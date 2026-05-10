import { randomBytes, randomInt } from "node:crypto";

export function randomPassword(): string {
  return randomBytes(32).toString("base64url");
}

/** Четырёхзначный OTP с ведущими нулями. */
export function generateOtp4(): string {
  return randomInt(0, 10000).toString().padStart(4, "0");
}
