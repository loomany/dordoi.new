import * as jose from "jose";

const AUD = "registration";

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_REGISTRATION_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error("AUTH_REGISTRATION_SECRET_MISSING");
  }
  return new TextEncoder().encode(raw);
}

export async function signRegistrationToken(phoneDigits: string): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({ phone: phoneDigits })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(AUD)
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyRegistrationToken(
  token: string,
): Promise<{ phone: string }> {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(token, secret, {
    audience: AUD,
  });
  const phone = payload.phone;
  if (typeof phone !== "string" || !/^\d+$/.test(phone)) {
    throw new Error("INVALID_REGISTRATION_TOKEN");
  }
  return { phone };
}
