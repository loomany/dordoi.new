import {
  YANDEX_WEBMASTER_VERIFICATION_HTML,
} from "@/lib/seo/yandex-webmaster-verification";

export const dynamic = "force-static";

export function GET() {
  return new Response(YANDEX_WEBMASTER_VERIFICATION_HTML, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      // Ask intermediaries (e.g. Cloudflare) not to rewrite the HTML body.
      "Cache-Control": "public, max-age=86400, no-transform",
    },
  });
}
