# Dordoi.help — Google Places Discovery

**Режим:** dry-run (HTTP к Places **не** выполнялись).
**Дата:** 2026-05-12T18:41:44.184Z
**limit:** 100 | **include-ratings:** false

## Параметры прогона

- **discovery-group:** `all`
- **include-text-search:** true
- **grid:** `full` (9 точек: центр + 8 направлений)
- **radii (м):** 300, 500, 700, 1000

## План запросов

- **Text Search:** 21
- **Nearby Search:** 216 (6 групп × 9 точек × 4 радиуса)
- **Всего (план):** 237

## Предупреждение

Запланировано **237** HTTP-запросов к Places — это больше **MAX_REQUESTS_PER_RUN=80**. Реальный прогон может быть неполным из-за внутреннего лимита.

## Группы includedTypes (Nearby) в этом прогоне

- **apparel-footwear** (Одежда/обувь): `clothing_store`, `womens_clothing_store`, `shoe_store`, `sportswear_store`
- **trade-market** (Торговля/рынок): `store`, `general_store`, `department_store`, `shopping_mall`, `market`, `flea_market`, `wholesaler`, `warehouse_store`
- **home-building** (Дом/товары): `home_goods_store`, `home_improvement_store`, `furniture_store`, `hardware_store`, `building_materials_store`
- **accessories-cosmetics** (Аксессуары/косметика): `jewelry_store`, `cosmetics_store`, `gift_shop`
- **toys** (Детское/игрушки): `toy_store`
- **electronics** (Электроника): `electronics_store`, `cell_phone_store`

## Blacklist

### Типы (часть множества)

`atm`, `bakery`, `bank`, `bar`, `cafe`, `casino`, `church`, `courier_service`, `dentist`, `doctor`, `finance`, `food`, `gas_station`, `government_office`, `grocery_store`, `health`, `hospital`, `hotel`, `lodging`, `meal_delivery`, `meal_takeaway`, `mosque`, `moving_company`, `night_club`, `parking`, `pharmacy`, `police`, `post_office`, `restaurant`, `school`, `shipping_service`, `storage`, `supermarket`, `university`, `warehouse`

### Ключевые слова (фрагмент)

кафе, cafe, ресторан, restaurant, банк, bank, atm, обмен, exchange, ломбард, pawn, pawnshop, карго, cargo, логистика, logistics, доставка, delivery, shipping, склад, warehouse, аптека, pharmacy, отель, hotel, школ, school, заправ, gas_station, парковк, parking, казино, casino, ночной клуб, night_club

## Файлы при реальном запуске (`--dry-run=false`)

- `data/generated/dordoi-google-places.raw.json`
- `data/generated/dordoi-google-places.catalog-matched.json`
- `data/generated/dordoi-google-places.discovery-unmapped.json`
- `data/generated/dordoi-google-places.excluded.json`
- `data/generated/dordoi-google-places.discovery-summary.csv`
- `reports/dordoi-google-places-discovery-summary.md`

Три корзины: **catalog_matched**, **discovery_unmapped**, **excluded**.
