import type { AppRole } from "@/lib/auth/roles";

/** Область личного кабинета для SaaS: один интерфейс на аккаунт. */
export type CabinetArea = "buyer" | "vendor" | "buyer_agent" | "admin";

export type CabinetRoutingInput = {
  role: AppRole;
  vendorId: string | null;
};

export function cabinetAreaForProfile(p: CabinetRoutingInput): CabinetArea {
  if (p.role === "admin") {
    return "admin";
  }
  if (p.role === "buyer_agent") {
    return "buyer_agent";
  }
  if (p.role === "vendor" || p.vendorId) {
    return "vendor";
  }
  return "buyer";
}

function cabinetPathForArea(locale: string, area: CabinetArea): string {
  switch (area) {
    case "admin":
      return `/${locale}/cabinet/admin`;
    case "vendor":
      return `/${locale}/cabinet/vendor`;
    case "buyer_agent":
      return `/${locale}/cabinet/buyer-agent`;
    default:
      return `/${locale}/cabinet/buyer`;
  }
}

export function cabinetPathForProfile(
  locale: string,
  p: CabinetRoutingInput,
): string {
  return cabinetPathForArea(locale, cabinetAreaForProfile(p));
}
