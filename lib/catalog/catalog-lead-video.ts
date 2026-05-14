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
 * photos[0..N-1] при N = min(videos, photos) — только poster'ы для видео, не отдельные слайды.
 * В ленту попадают photos[N..] (уникальные фото без пары с видео).
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
  const posterCount = Math.min(videos.length, photos.length);
  const slides: CatalogMediaSlide[] = [];
  let vi = 0;
  let pi = posterCount;

  while (vi < videos.length || pi < photos.length) {
    if (vi < videos.length) {
      const poster = vi < posterCount ? photos[vi] : undefined;
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

/** Подряд video→photo с одним URL (poster = фото). */
export function findVideoPhotoPosterDuplicates(
  slides: readonly CatalogMediaSlide[],
): { index: number; posterUrl: string }[] {
  const hits: { index: number; posterUrl: string }[] = [];
  for (let i = 0; i < slides.length - 1; i += 1) {
    const cur = slides[i];
    const next = slides[i + 1];
    if (
      cur?.kind === "video" &&
      next?.kind === "photo" &&
      cur.posterUrl &&
      cur.posterUrl === next.url
    ) {
      hits.push({ index: i, posterUrl: cur.posterUrl });
    }
  }
  return hits;
}

/** Подряд photo→video с тем же кадром (poster видео = фото). */
export function findPhotoVideoPosterDuplicates(
  slides: readonly CatalogMediaSlide[],
): { index: number; posterUrl: string }[] {
  const hits: { index: number; posterUrl: string }[] = [];
  for (let i = 0; i < slides.length - 1; i += 1) {
    const cur = slides[i];
    const next = slides[i + 1];
    if (
      cur?.kind === "photo" &&
      next?.kind === "video" &&
      next.posterUrl &&
      cur.url === next.posterUrl
    ) {
      hits.push({ index: i, posterUrl: cur.url });
    }
  }
  return hits;
}

export function findAdjacentPosterDuplicates(
  slides: readonly CatalogMediaSlide[],
): { index: number; posterUrl: string; direction: "video-photo" | "photo-video" }[] {
  return [
    ...findVideoPhotoPosterDuplicates(slides).map((h) => ({
      ...h,
      direction: "video-photo" as const,
    })),
    ...findPhotoVideoPosterDuplicates(slides).map((h) => ({
      ...h,
      direction: "photo-video" as const,
    })),
  ];
}
