# Sitemap hotfix — dordoi.help

**Дата:** 2026-05-11  

## Симптом

В Google Search Console или у части клиентов `https://dordoi.help/sitemap.xml` мог восприниматься как **не-XML** (плоский текст без ожидаемой структуры `<urlset>` / `<loc>`), что мешает отправке sitemap.

## Вероятная причина

Файл **`app/sitemap.ts`** (конвенция Next.js `MetadataRoute.Sitemap`) в связке с **`dynamic = "force-dynamic"`** и расширенными полями (`alternates.languages` → xhtml в sitemap) в редких случаях мог отдаваться клиенту с **неподходящим восприятием** (кэш, прокси, парсер, старая версия деплоя). Точная причина по одному только описанию без HAR не установлена; для GSC надёжнее **явный XML-ответ** с заданным **`Content-Type: application/xml; charset=utf-8`**.

## Что сделано

1. **Удалён** `app/sitemap.ts` (конвенция MetadataRoute для sitemap).  
2. **Добавлен** маршрут **`app/sitemap.xml/route.ts`**: `GET` возвращает `new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", ... } })`.  
3. **Добавлен** `lib/sitemap-xml-body.ts`: сборка **валидного** XML 0.9 с `<urlset>`, `<url>`, `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`, плюс **`xhtml:link`** для hreflang (как раньше по смыслу).  
4. Логика URL не менялась: **`publicRoutes` × `routing.locales`**, **`hreflangAlternatesForPath`**, **`siteIndexable()`** (пустой `<urlset>` при закрытом сайте).  
5. Обновлены ссылки в **`lib/site.ts`**, **`.env.example`**, **`docs/architecture.md`**.

## Content-Type

Ожидается:

`Content-Type: application/xml; charset=utf-8`

Не используется `text/plain`.

## Пример фрагмента XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://dordoi.help/ru</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="https://dordoi.help/ru" />
    <xhtml:link rel="alternate" hreflang="kk" href="https://dordoi.help/kk" />
    <xhtml:link rel="alternate" hreflang="ky" href="https://dordoi.help/kg" />
    <xhtml:link rel="alternate" hreflang="uz" href="https://dordoi.help/uz" />
    <xhtml:link rel="alternate" hreflang="tg" href="https://dordoi.help/tj" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://dordoi.help/ru" />
    <lastmod>2026-05-11T12:00:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  ...
</urlset>
```

## Проверки

| Шаг | Результат |
|-----|-----------|
| `npm run build` | Успешно |
| `npx tsc --noEmit` | Успешно |
| Маршрут в сборке | `ƒ /sitemap.xml` (динамический route handler) |

После деплоя на production повторить:

```bash
curl -I https://dordoi.help/sitemap.xml
curl https://dordoi.help/sitemap.xml | head
```

Ожидается заголовок **`Content-Type: application/xml; charset=utf-8`** и тело, начинающееся с `<?xml` и содержащее `<urlset>`.

## robots.txt

Без изменений логики: по-прежнему **`Sitemap: https://dordoi.help/sitemap.xml`** (через `app/robots.ts` + `baseUrl()`).
