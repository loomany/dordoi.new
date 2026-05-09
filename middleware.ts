import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(ru|kk|kg|uz|tj)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
