/**
 * Аудит регистрации / входа по телефону (OTP → профиль → сессия).
 *
 * Проверяет:
 *   - env (Supabase, AUTH_REGISTRATION_SECRET, publishable key)
 *   - synthetic email + signInWithPassword({ email }) — обход без Phone provider
 *   - миграцию phone-only: auth.users с телефоном без email
 *   - полный HTTP-проход: OTP в БД → /api/auth/verify-code → /api/auth/complete-registration
 *   - повторный вход существующего пользователя через /api/auth/verify-code
 *   - «сироты»: auth.users без profiles и наоборот
 *
 * Переменные:
 *   AUTH_TEST_BASE_URL — база API (по умолчанию http://localhost:3000)
 *   AUTH_AUDIT_PHONE   — только диагностика конкретного номера (цифры, напр. 79991234567)
 *   AUTH_AUDIT_EMAIL   — проверка занятости email в profiles
 *   AUTH_AUDIT_CLEANUP — 1 = удалить тестового пользователя после прогона
 *
 * Запуск:
 *   npx tsx scripts/audit-auth-registration.ts
 *   AUTH_AUDIT_PHONE=79991234567 npx tsx scripts/audit-auth-registration.ts
 *   AUTH_TEST_BASE_URL=https://dordoi.help npx tsx scripts/audit-auth-registration.ts
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createSessionViaEmailLogin } from "@/lib/auth/establish-session";
import { findAuthUserByPhoneDigits } from "@/lib/auth/find-auth-user-by-phone";
import { randomPassword } from "@/lib/auth/password";
import {
  phoneLoginEmailDomain,
  resolveLoginEmail,
  syntheticEmailForPhone,
} from "@/lib/auth/phone-login-email";
import { digitsOnly, toE164Digits } from "@/lib/phone";

type StepResult = { ok: boolean; detail: string };

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function log(title: string, result: StepResult): void {
  const mark = result.ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${title}`);
  console.log(`      ${result.detail}`);
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function createAdmin(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Need NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createAnon(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function trySignInWithEmail(
  anon: SupabaseClient,
  email: string,
  password: string,
): Promise<StepResult> {
  const res = await anon.auth.signInWithPassword({ email, password });
  if (res.error) {
    return {
      ok: false,
      detail: `${res.error.name}: ${res.error.message}`,
    };
  }
  if (!res.data.session) {
    return { ok: false, detail: "signInWithPassword вернул null session" };
  }
  return {
    ok: true,
    detail: `session user=${res.data.session.user.id}`,
  };
}

async function trySignInWithPhone(
  anon: SupabaseClient,
  phone: string,
  password: string,
): Promise<StepResult> {
  const res = await anon.auth.signInWithPassword({ phone, password });
  if (res.error) {
    return {
      ok: false,
      detail: `${res.error.name}: ${res.error.message}`,
    };
  }
  if (!res.data.session) {
    return { ok: false, detail: "signInWithPassword вернул null session" };
  }
  return {
    ok: true,
    detail: `session user=${res.data.session.user.id}`,
  };
}

async function postJson(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}

async function seedOtp(
  admin: SupabaseClient,
  phoneDigits: string,
  code: string,
): Promise<void> {
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { error } = await admin.from("otp_codes").upsert(
    { phone: phoneDigits, code, expires_at },
    { onConflict: "phone" },
  );
  if (error) throw new Error(`otp upsert: ${error.message}`);
}

function randomTestPhone(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `7999000${suffix}`;
}

async function deleteAuthUser(admin: SupabaseClient, userId: string): Promise<void> {
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

async function inspectPhone(
  admin: SupabaseClient,
  anon: SupabaseClient,
  phoneDigits: string,
): Promise<void> {
  console.log("\n--- Диагностика номера ---");
  console.log(`phone (digits): ${phoneDigits}`);
  console.log(`phone (E.164):    ${toE164Digits(phoneDigits)}`);
  console.log(`synthetic email:  ${syntheticEmailForPhone(phoneDigits)}`);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, email, phone, created_at")
    .eq("phone", phoneDigits)
    .maybeSingle();

  const authUser = await findAuthUserByPhoneDigits(admin, phoneDigits);

  if (profile) {
    console.log("profiles:", JSON.stringify(profile, null, 2));
  } else {
    console.log("profiles: запись не найдена");
  }

  if (authUser) {
    const loginEmail = resolveLoginEmail(
      phoneDigits,
      authUser.email,
      profile?.email,
    );
    console.log(
      "auth.users:",
      JSON.stringify(
        {
          id: authUser.id,
          phone: authUser.phone,
          email: authUser.email,
          resolvedLoginEmail: loginEmail,
          phone_confirmed_at: authUser.phone_confirmed_at,
          email_confirmed_at: authUser.email_confirmed_at,
        },
        null,
        2,
      ),
    );
    if (profile && profile.id !== authUser.id) {
      log("id sync profile ↔ auth", {
        ok: false,
        detail: `profiles.id=${profile.id} ≠ auth.users.id=${authUser.id}`,
      });
    }
  } else {
    console.log("auth.users: не найден по телефону");
  }

  if (authUser && profile?.id === authUser.id) {
    const session = await createSessionViaEmailLogin(
      admin,
      anon,
      authUser.id,
      phoneDigits,
      { profileEmail: profile.email },
    );
    log("createSessionViaEmailLogin (synthetic email path)", {
      ok: session !== null,
      detail: session
        ? `access_token len=${session.access_token.length}`
        : "не удалось создать сессию",
    });

    const password = randomPassword();
    await admin.auth.admin.updateUserById(authUser.id, { password });
    const phoneTry = await trySignInWithPhone(
      anon,
      toE164Digits(phoneDigits),
      password,
    );
    log("signInWithPassword(phone) — ожидаем FAIL если Phone provider выкл.", phoneTry);
  } else if (authUser && !profile) {
    log("сирота auth.users", {
      ok: false,
      detail:
        "В Auth есть пользователь, в profiles — нет. complete-registration пытается найти сироту.",
    });
  } else if (profile && !authUser) {
    log("сирота profiles", {
      ok: false,
      detail:
        "В profiles есть строка, в Auth пользователь по телефону не найден. verify-code не сможет войти.",
    });
  }
}

async function inspectEmail(admin: SupabaseClient, email: string): Promise<void> {
  console.log("\n--- Диагностика email ---");
  const norm = email.trim().toLowerCase();
  const { data: rows } = await admin
    .from("profiles")
    .select("id, phone, name, email")
    .ilike("email", norm);

  if (!rows?.length) {
    console.log(`profiles: email «${email}» свободен`);
    return;
  }
  console.log(`profiles: email занят (${rows.length}):`);
  for (const r of rows) {
    console.log(`  - id=${r.id} phone=${r.phone} name=${r.name}`);
  }
}

async function findOrphanSample(admin: SupabaseClient): Promise<void> {
  console.log("\n--- Сироты (выборка) ---");
  let orphansAuth = 0;
  let phoneOnlyNoEmail = 0;
  let page: number | null = 1;
  const authWithoutProfile: User[] = [];

  while (page != null && authWithoutProfile.length < 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const u of data.users) {
      const d = digitsOnly(u.phone ?? "");
      if (d && !u.email?.trim()) phoneOnlyNoEmail++;
      if (!d) continue;
      const { data: p } = await admin
        .from("profiles")
        .select("id")
        .eq("phone", d)
        .maybeSingle();
      if (!p) {
        orphansAuth++;
        if (authWithoutProfile.length < 5) authWithoutProfile.push(u);
      }
    }
    page = data.nextPage;
  }

  const { data: profilesNoAuth } = await admin
    .from("profiles")
    .select("id, phone, name")
    .limit(200);

  let orphansProfile = 0;
  for (const p of profilesNoAuth ?? []) {
    const { data: au } = await admin.auth.admin.getUserById(p.id);
    if (!au.user) orphansProfile++;
  }

  console.log(
    `auth.users с телефоном без email (кандидаты на synthetic): ${phoneOnlyNoEmail}`,
  );
  console.log(`auth.users с телефоном без profiles (всего просмотрено): ${orphansAuth}`);
  for (const u of authWithoutProfile) {
    console.log(`  orphan auth: id=${u.id} phone=${u.phone} email=${u.email ?? "—"}`);
  }
  console.log(`profiles без auth.users (из первых 200): ${orphansProfile}`);
}

async function runE2e(
  admin: SupabaseClient,
  baseUrl: string,
  cleanup: boolean,
): Promise<boolean> {
  const phoneDigits = randomTestPhone();
  const code = "4242";
  const name = "Auth Audit Bot";
  let createdUserId: string | null = null;

  console.log("\n--- E2E HTTP регистрация ---");
  console.log(`test phone: ${phoneDigits}`);

  await seedOtp(admin, phoneDigits, code);

  const verify = await postJson(baseUrl, "/api/auth/verify-code", {
    phone: phoneDigits,
    code,
  });
  if (verify.status !== 200 || verify.json.isNewUser !== true) {
    log("POST /api/auth/verify-code (new user)", {
      ok: false,
      detail: `status=${verify.status} body=${JSON.stringify(verify.json)}`,
    });
    return false;
  }
  const tempToken = String(verify.json.tempToken ?? "");
  if (!tempToken) {
    log("tempToken", { ok: false, detail: "пустой tempToken" });
    return false;
  }
  log("POST /api/auth/verify-code (new user)", {
    ok: true,
    detail: "isNewUser=true, tempToken получен",
  });

  const complete = await postJson(baseUrl, "/api/auth/complete-registration", {
    name,
    tempToken,
  });
  if (complete.status !== 200) {
    const { data: failedProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phoneDigits)
      .maybeSingle();
    if (failedProfile?.id) {
      createdUserId = failedProfile.id;
      if (cleanup) {
        await deleteAuthUser(admin, failedProfile.id);
        await admin.from("otp_codes").delete().eq("phone", phoneDigits);
        console.log(
          `[cleanup] удалён частично созданный пользователь ${failedProfile.id}`,
        );
      }
    }
    log("POST /api/auth/complete-registration (без email)", {
      ok: false,
      detail: `status=${complete.status} code=${String(complete.json.code ?? "")} body=${JSON.stringify(complete.json)}`,
    });
    return false;
  }
  log("POST /api/auth/complete-registration (без email)", {
    ok: true,
    detail: "success, token в ответе",
  });

  const { data: authAfterReg } = await admin.auth.admin.getUserById(
    String(
      (
        await admin
          .from("profiles")
          .select("id")
          .eq("phone", phoneDigits)
          .maybeSingle()
      ).data?.id ?? "",
    ),
  );
  const regEmail = authAfterReg.user?.email ?? "—";
  log("auth.users email после регистрации", {
    ok: regEmail === syntheticEmailForPhone(phoneDigits),
    detail: regEmail,
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phoneDigits)
    .maybeSingle();
  createdUserId = profile?.id ?? null;

  await seedOtp(admin, phoneDigits, code);
  const login = await postJson(baseUrl, "/api/auth/verify-code", {
    phone: phoneDigits,
    code,
  });
  if (login.status !== 200 || login.json.isNewUser !== false) {
    log("POST /api/auth/verify-code (existing user)", {
      ok: false,
      detail: `status=${login.status} body=${JSON.stringify(login.json)}`,
    });
  } else {
    log("POST /api/auth/verify-code (existing user)", {
      ok: true,
      detail: "вход существующего пользователя после OTP",
    });
  }

  if (cleanup && createdUserId) {
    await deleteAuthUser(admin, createdUserId);
    await admin.from("otp_codes").delete().eq("phone", phoneDigits);
    console.log(`\n[cleanup] удалён тестовый пользователь ${createdUserId}`);
  } else if (createdUserId) {
    console.log(
      `\n[info] тестовый пользователь оставлен: ${createdUserId} (${phoneDigits}). AUTH_AUDIT_CLEANUP=1 для удаления.`,
    );
  }

  return complete.status === 200 && login.status === 200;
}

/** Phone-only user в Auth → synthetic email → signInWithPassword({ email }). */
async function directSyntheticEmailSignInTest(
  admin: SupabaseClient,
  anon: SupabaseClient,
): Promise<StepResult> {
  const phoneDigits = randomTestPhone();
  const loginEmail = syntheticEmailForPhone(phoneDigits);
  const password = randomPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    phone: toE164Digits(phoneDigits),
    phone_confirm: true,
    email: loginEmail,
    email_confirm: true,
    password,
  });
  if (error || !created.user) {
    return {
      ok: false,
      detail: `createUser: ${error?.message ?? "no user"}`,
    };
  }
  const userId = created.user.id;
  try {
    return await trySignInWithEmail(anon, loginEmail, password);
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
}

/** Миграция: телефон есть, email пустой → establishSessionAfterOtp. */
async function legacyPhoneOnlyMigrationTest(
  admin: SupabaseClient,
  anon: SupabaseClient,
): Promise<StepResult> {
  const phoneDigits = randomTestPhone();
  const password = randomPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    phone: toE164Digits(phoneDigits),
    phone_confirm: true,
    password,
  });
  if (error || !created.user) {
    return {
      ok: false,
      detail: `createUser phone-only: ${error?.message ?? "no user"}`,
    };
  }
  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    phone: phoneDigits,
    name: "Legacy Phone Only",
    role: "buyer",
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, detail: `profiles insert: ${profileErr.message}` };
  }

  try {
    const session = await createSessionViaEmailLogin(admin, anon, userId, phoneDigits, {
      profileEmail: null,
    });
    if (!session) {
      return { ok: false, detail: "createSessionViaEmailLogin вернул null" };
    }

    const { data: after } = await admin.auth.admin.getUserById(userId);
    const expected = syntheticEmailForPhone(phoneDigits);
    if (after.user?.email !== expected) {
      return {
        ok: false,
        detail: `email не проставлен: got=${after.user?.email ?? "null"} want=${expected}`,
      };
    }

    return {
      ok: true,
      detail: `legacy phone-only → ${expected}, session ok`,
    };
  } finally {
    await deleteAuthUser(admin, userId);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  console.log("=== Аудит регистрации Dordoi.help ===\n");
  console.log(`synthetic email domain: ${phoneLoginEmailDomain()}\n`);

  const baseUrl =
    process.env.AUTH_TEST_BASE_URL?.trim() || "http://localhost:3000";
  const cleanup = process.env.AUTH_AUDIT_CLEANUP === "1";
  const auditPhone = process.env.AUTH_AUDIT_PHONE?.trim();
  const auditEmail = process.env.AUTH_AUDIT_EMAIL?.trim();

  const envChecks: StepResult[] = [];

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    envChecks.push({ ok: true, detail: "NEXT_PUBLIC_SUPABASE_URL задан" });
  } catch (e) {
    envChecks.push({ ok: false, detail: (e as Error).message });
  }

  try {
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    envChecks.push({ ok: true, detail: "SUPABASE_SERVICE_ROLE_KEY задан" });
  } catch (e) {
    envChecks.push({ ok: false, detail: (e as Error).message });
  }

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    envChecks.push({
      ok: true,
      detail: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY задан",
    });
  } catch (e) {
    envChecks.push({ ok: false, detail: (e as Error).message });
  }

  const regSecret = process.env.AUTH_REGISTRATION_SECRET?.trim() ?? "";
  envChecks.push({
    ok: regSecret.length >= 16,
    detail:
      regSecret.length >= 16
        ? `AUTH_REGISTRATION_SECRET задан (${regSecret.length} симв.)`
        : "AUTH_REGISTRATION_SECRET отсутствует или < 16 символов — новые номера не пройдут шаг регистрации",
  });

  for (const c of envChecks) {
    log("env", c);
  }

  const fatal = envChecks.some((c) => !c.ok);
  if (fatal) {
    console.log("\nИсправьте env и перезапустите.");
    process.exit(1);
  }

  const admin = createAdmin();
  const anon = createAnon();

  log(
    "signInWithPassword(email) с synthetic email",
    await directSyntheticEmailSignInTest(admin, anon),
  );
  log(
    "миграция phone-only (без email в auth)",
    await legacyPhoneOnlyMigrationTest(admin, anon),
  );

  if (auditPhone) {
    const digits = digitsOnly(auditPhone);
    await inspectPhone(admin, anon, digits);
  }

  if (auditEmail) {
    await inspectEmail(admin, auditEmail);
  }

  await findOrphanSample(admin);

  console.log(`\n--- E2E через ${baseUrl} ---`);
  let serverReachable = true;
  try {
    const ping = await fetch(baseUrl, { method: "HEAD" });
    console.log(`HEAD ${baseUrl} → ${ping.status}`);
  } catch (e) {
    serverReachable = false;
    console.log(
      `Сервер недоступен (${baseUrl}): ${(e as Error).message}. Запустите \`npm run dev\` или задайте AUTH_TEST_BASE_URL.`,
    );
  }

  if (serverReachable) {
    const e2eOk = await runE2e(admin, baseUrl, cleanup);
    if (!e2eOk) {
      console.log(
        "\nE2E не прошёл. Проверьте:\n" +
          "  • Email provider включён в Supabase (Phone provider может быть выключен)\n" +
          "  • AUTH_PHONE_LOGIN_EMAIL_DOMAIN и synthetic email в auth.users\n" +
          "  • логи [establishSession] на сервере",
      );
      process.exit(1);
    }
  }

  console.log("\n=== Итог ===");
  console.log("Email при регистрации: НЕОБЯЗАТЕЛЕН (пустое поле → synthetic login-email).");
  console.log(
    "Вход: OTP → establishSessionAfterOtp → signInWithPassword({ email }), Phone provider не нужен.",
  );
  console.log(
    "Старые phone-only аккаунты: при входе им проставляется synthetic email автоматически.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
