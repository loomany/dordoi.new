# Dordoi.help — Google Places Discovery

**Режим:** dry-run (HTTP к Places **не** выполнялись).
**Дата:** 2026-05-12T18:44:53.849Z
**limit:** 100 | **include-ratings:** false

## Параметры прогона

- **discovery-group:** `apparel-footwear`
- **include-text-search:** true
- **grid:** `compact` (5 точек: центр + N,S,E,W)
- **radii (м):** 500, 700
- **output-tag:** `apparel-footwear` (задан в `--output-tag=`)

## Выходные файлы (этот прогон)

- `data/generated/dordoi-google-places.apparel-footwear.raw.json`
- `data/generated/dordoi-google-places.apparel-footwear.catalog-matched.json`
- `data/generated/dordoi-google-places.apparel-footwear.discovery-unmapped.json`
- `data/generated/dordoi-google-places.apparel-footwear.excluded.json`
- `data/generated/dordoi-google-places.apparel-footwear.discovery-summary.csv`
- `reports/dordoi-google-places-apparel-footwear-summary.md`

## План запросов

- **Text Search:** 21
- **Nearby Search:** 10 (1 групп × 5 точек × 2 радиуса)
- **Всего (план):** 31

## Группы includedTypes (Nearby) в этом прогоне

- **apparel-footwear** (Одежда/обувь): `clothing_store`, `womens_clothing_store`, `shoe_store`, `sportswear_store`

## Blacklist

### Типы (часть множества)

`atm`, `bakery`, `bank`, `bar`, `cafe`, `casino`, `church`, `courier_service`, `dentist`, `doctor`, `finance`, `food`, `gas_station`, `government_office`, `grocery_store`, `health`, `hospital`, `hotel`, `lodging`, `meal_delivery`, `meal_takeaway`, `mosque`, `moving_company`, `night_club`, `parking`, `pharmacy`, `police`, `post_office`, `restaurant`, `school`, `shipping_service`, `storage`, `supermarket`, `university`, `warehouse`

### Ключевые слова (фрагмент)

кафе, cafe, ресторан, restaurant, банк, bank, atm, обмен, exchange, ломбард, pawn, pawnshop, карго, cargo, логистика, logistics, доставка, delivery, shipping, склад, warehouse, аптека, pharmacy, отель, hotel, школ, school, заправ, gas_station, парковк, parking, казино, casino, ночной клуб, night_club

## Файлы при реальном запуске (`--dry-run=false`)

Имена совпадают с разделом **Выходные файлы** выше (по `output-tag`). Старые фиксированные имена без тега для discovery **не** используются.

Три корзины: **catalog_matched**, **discovery_unmapped**, **excluded**.
