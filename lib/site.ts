export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}
