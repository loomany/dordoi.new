"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.ico"
            alt="Dordoi.help"
            width={56}
            height={56}
            style={{ borderRadius: 12 }}
          />
          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Ошибка
          </p>
          <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 600 }}>Что-то пошло не так</h1>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: "#64748b" }}>
            Попробуйте обновить страницу. Если ошибка повторяется, зайдите позже.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 32,
              height: 40,
              padding: "0 16px",
              border: 0,
              borderRadius: 8,
              background: "#0891b2",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </main>
      </body>
    </html>
  );
}
