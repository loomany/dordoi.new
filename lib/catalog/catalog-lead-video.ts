export type CatalogLeadVideo = {
  src: string;
  posterUrl?: string;
};

/** Первое видео в начале ленты фото (каталог и профиль). */
export function leadVideoFromProductVideos(opts: {
  productVideos?: readonly string[] | null;
  posterUrl?: string | null;
}): CatalogLeadVideo | undefined {
  const src = opts.productVideos?.[0]?.trim();
  if (!src) {
    return undefined;
  }
  const poster = opts.posterUrl?.trim();
  return poster ? { src, posterUrl: poster } : { src };
}
