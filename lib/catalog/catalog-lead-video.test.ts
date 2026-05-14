import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildInterleavedCatalogMediaSlides,
  findAdjacentPosterDuplicates,
  findPhotoVideoPosterDuplicates,
  findVideoPhotoPosterDuplicates,
} from "./catalog-lead-video";

describe("buildInterleavedCatalogMediaSlides", () => {
  it("interleaves extra photos after paired poster block", () => {
    const slides = buildInterleavedCatalogMediaSlides({
      productVideos: ["v1", "v2"],
      photoUrls: ["p1", "p2", "p3"],
    });
    assert.deepEqual(
      slides.map((s) =>
        s.kind === "video" ? `video:${s.src}@${s.posterUrl}` : `photo:${s.url}`,
      ),
      ["video:v1@p1", "photo:p3", "video:v2@p2"],
    );
    assert.equal(findAdjacentPosterDuplicates(slides).length, 0);
  });

  it("12x12 paired instagram thumbs — videos only, no duplicate slides", () => {
    const videos = Array.from({ length: 12 }, (_, i) => `video-${i}`);
    const photos = Array.from({ length: 12 }, (_, i) => `thumb-${i}`);
    const slides = buildInterleavedCatalogMediaSlides({
      productVideos: videos,
      photoUrls: photos,
    });
    assert.equal(findVideoPhotoPosterDuplicates(slides).length, 0);
    assert.equal(findPhotoVideoPosterDuplicates(slides).length, 0);
    assert.equal(slides.length, 12);
    assert.equal(slides.every((s) => s.kind === "video"), true);
  });

  it("12 videos + 15 photos — interleaves trailing unique photos", () => {
    const videos = Array.from({ length: 12 }, (_, i) => `v${i}`);
    const photos = Array.from({ length: 15 }, (_, i) => `p${i}`);
    const slides = buildInterleavedCatalogMediaSlides({
      productVideos: videos,
      photoUrls: photos,
    });
    assert.equal(findAdjacentPosterDuplicates(slides).length, 0);
    assert.equal(slides.filter((s) => s.kind === "photo").length, 3);
    assert.equal(slides.filter((s) => s.kind === "video").length, 12);
  });
});
