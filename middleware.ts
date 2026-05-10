import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * Railway forwards x-forwarded-port equal to the container bind port (PORT).
 * next-intl builds locale redirects from forwarded headers → Location includes :8080.
 * Strip that internal port so browsers only see https://dordoi.help/... on the default HTTPS port.
 */
function withoutInternalForwardedPort(request: NextRequest): NextRequest {
  const listenPort = process.env.PORT;
  if (!listenPort) return request;

  const headers = new Headers(request.headers);
  let changed = false;

  if (headers.get("x-forwarded-port") === listenPort) {
    headers.delete("x-forwarded-port");
    changed = true;
  }

  const xfHost = headers.get("x-forwarded-host");
  if (xfHost?.endsWith(`:${listenPort}`)) {
    headers.set(
      "x-forwarded-host",
      xfHost.slice(0, -(`:${listenPort}`.length)),
    );
    changed = true;
  }

  if (!changed) return request;

  return new NextRequest(request.url, {
    headers,
    method: request.method,
  });
}

export default async function middleware(request: NextRequest) {
  const req = withoutInternalForwardedPort(request);
  const response = intlMiddleware(req);
  return updateSession(req, response);
}

export const config = {
  matcher: [
    "/",
    "/(ru|kk|kg|uz|tj)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
