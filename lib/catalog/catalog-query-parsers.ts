import { parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server";

/** Query keys shared by catalog page (RSC) and `CatalogCategoryFilter` (client). */
export const catalogQueryParsers = {
  cat: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger,
  search: parseAsString,
};
