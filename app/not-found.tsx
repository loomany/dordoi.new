import Link from "next/link";

import "./globals.css";

export default function NotFound() {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground antialiased">
        <main className="flex max-w-md flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.ico" alt="Dordoi.help" width={56} height={56} className="rounded-xl" />
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            404
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Страница не найдена</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ссылка устарела или страница была удалена.
          </p>
          <Link
            href="/ru"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            На главную
          </Link>
        </main>
      </body>
    </html>
  );
}
