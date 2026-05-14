export function buildCatalogBrowsePath(opts: {
  page?: number;
  categorySlugs: string[];
  searchQuery?: string;
  compareWithPreview?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.page != null && opts.page > 1) {
    params.set("page", String(opts.page));
  }
  if (opts.categorySlugs.length > 0) {
    const sortedSlugs = [...opts.categorySlugs].sort();
    params.set("cat", sortedSlugs.join(","));
  }
  const search = opts.searchQuery?.trim();
  if (search) {
    params.set("search", search);
  }
  if (opts.compareWithPreview) {
    params.set("compare", "1");
  }
  const q = params.toString();
  return q.length > 0 ? `/catalog?${q}` : "/catalog";
}
