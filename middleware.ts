import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * Railway forwards x-forwarded-port equal to the container bind port (PORT).
 * next-intl builds locale redirects from forwarded headers → Location includes :8080.
 * Strip that internal port so browsers only see https://dordoi.help/... on the default HTTPS port.
 *
 * В dev `next dev` сам выставляет process.env.PORT=3000 и тогда мы бы срезали `:3000`
 * из `x-forwarded-host`, из-за чего Next.js 16 валит Server Actions с ошибкой
 * `x-forwarded-host does not match origin`. На локалке нет внешнего прокси —
 * заголовок не трогаем.
 */
function withoutInternalForwardedPort(request: NextRequest): NextRequest {
  if (process.env.NODE_ENV !== "production") return request;

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

function routeLocaleFromPathname(pathname: string): string {
  if (pathname.startsWith("/api")) {
    return "ru";
  }
  const m = pathname.match(/^\/(ru|kk|kg|uz|tj)(\/|$)/);
  return m?.[1] ?? "ru";
}

export default async function middleware(request: NextRequest) {
  const req = withoutInternalForwardedPort(request);
  const routeLocale = routeLocaleFromPathname(req.nextUrl.pathname);
  const headers = new Headers(req.headers);
  headers.set("x-dordoi-route-locale", routeLocale);
  const reqWithLocale = new NextRequest(req, { headers });
  const response = intlMiddleware(reqWithLocale);
  return updateSession(reqWithLocale, response);
}

export const config = {
  matcher: [
    "/",
    "/(ru|kk|kg|uz|tj)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
