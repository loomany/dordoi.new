export type CatalogLeadVideo = {
  src: string;
  posterUrl?: string;
};

export type CatalogMediaSlide =
  | { kind: "video"; src: string; posterUrl?: string }
  | { kind: "photo"; url: string };

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

function normalizeMediaUrls(urls: readonly string[] | null | undefined): string[] {
  if (!urls?.length) {
    return [];
  }
  return urls.map((u) => u.trim()).filter(Boolean);
}

/**
 * Чередование: видео, фото, видео, фото…
 * Остаток более длинного массива добавляется в конце.
 */
export function buildInterleavedCatalogMediaSlides(opts: {
  productVideos?: readonly string[] | null;
  photoUrls?: readonly string[] | null;
  /** Устаревший одиночный lead — используется, если productVideos пуст. */
  leadVideo?: CatalogLeadVideo;
}): CatalogMediaSlide[] {
  const videos = normalizeMediaUrls(opts.productVideos);
  if (videos.length === 0 && opts.leadVideo?.src.trim()) {
    videos.push(opts.leadVideo.src.trim());
  }
  const photos = normalizeMediaUrls(opts.photoUrls);
  const slides: CatalogMediaSlide[] = [];
  let vi = 0;
  let pi = 0;

  while (vi < videos.length || pi < photos.length) {
    if (vi < videos.length) {
      const poster = photos[vi];
      slides.push(
        poster
          ? { kind: "video", src: videos[vi]!, posterUrl: poster }
          : { kind: "video", src: videos[vi]! },
      );
      vi += 1;
    }
    if (pi < photos.length) {
      slides.push({ kind: "photo", url: photos[pi]! });
      pi += 1;
    }
  }

  return slides;
}
