export type AppRole =
  | "user"
  | "buyer"
  | "buyer_agent"
  | "vendor"
  | "admin";

export const DEFAULT_ROLE: AppRole = "buyer";
