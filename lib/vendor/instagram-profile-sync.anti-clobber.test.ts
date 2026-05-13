import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_VENDOR_MEDIA_BUCKET,
  DEFAULT_VENDOR_VIDEOS_BUCKET,
  mergeMediaUrlsPreservingStorage,
  resolveLogoUrlPreservingStorage,
} from "./instagram-profile-sync";

const STORAGE_PHOTO =
  "https://example.supabase.co/storage/v1/object/public/vendor-media/v/photo.jpg";
const STORAGE_VIDEO =
  "https://example.supabase.co/storage/v1/object/public/vendor-videos/v/clip.mp4";
const STORAGE_LOGO =
  "https://example.supabase.co/storage/v1/object/public/vendor-media/v/logo.jpg";
const FBCDN_PHOTO = "https://scontent.cdninstagram.com/v/photo.jpg";
const FBCDN_VIDEO = "https://scontent.cdninstagram.com/v/video.mp4";
const FBCDN_LOGO = "https://scontent.cdninstagram.com/v/logo.jpg";

describe("mergeMediaUrlsPreservingStorage", () => {
  it("approved + existing vendor-videos + incoming fbcdn → keeps vendor-videos", () => {
    const merged = mergeMediaUrlsPreservingStorage({
      isApproved: true,
      existing: [STORAGE_VIDEO],
      incoming: [FBCDN_VIDEO],
      storageBucket: DEFAULT_VENDOR_VIDEOS_BUCKET,
    });
    assert.equal(merged[0], STORAGE_VIDEO);
  });

  it("approved + existing vendor-media photo + incoming fbcdn → keeps vendor-media", () => {
    const merged = mergeMediaUrlsPreservingStorage({
      isApproved: true,
      existing: [STORAGE_PHOTO],
      incoming: [FBCDN_PHOTO],
      storageBucket: DEFAULT_VENDOR_MEDIA_BUCKET,
    });
    assert.equal(merged[0], STORAGE_PHOTO);
  });

  it("pending vendor without Storage → incoming media preserved as before", () => {
    const photos = mergeMediaUrlsPreservingStorage({
      isApproved: false,
      existing: null,
      incoming: [FBCDN_PHOTO, "https://example.com/p2.jpg"],
      storageBucket: DEFAULT_VENDOR_MEDIA_BUCKET,
    });
    assert.deepEqual(photos, [FBCDN_PHOTO, "https://example.com/p2.jpg"]);

    const videos = mergeMediaUrlsPreservingStorage({
      isApproved: false,
      existing: [],
      incoming: [FBCDN_VIDEO],
      storageBucket: DEFAULT_VENDOR_VIDEOS_BUCKET,
    });
    assert.deepEqual(videos, [FBCDN_VIDEO]);
  });

  it("mixed array does not clobber Storage slots while updating external slots", () => {
    const merged = mergeMediaUrlsPreservingStorage({
      isApproved: true,
      existing: [STORAGE_VIDEO, FBCDN_VIDEO, STORAGE_VIDEO],
      incoming: ["https://cdn.example/new0.mp4", "https://cdn.example/new1.mp4"],
      storageBucket: DEFAULT_VENDOR_VIDEOS_BUCKET,
    });
    assert.equal(merged[0], STORAGE_VIDEO);
    assert.equal(merged[1], "https://cdn.example/new1.mp4");
    assert.equal(merged[2], STORAGE_VIDEO);
  });

  it("approved keeps trailing Storage-only slots when incoming is shorter", () => {
    const merged = mergeMediaUrlsPreservingStorage({
      isApproved: true,
      existing: [STORAGE_PHOTO, STORAGE_PHOTO],
      incoming: [FBCDN_PHOTO],
      storageBucket: DEFAULT_VENDOR_MEDIA_BUCKET,
    });
    assert.deepEqual(merged, [STORAGE_PHOTO, STORAGE_PHOTO]);
  });
});

describe("resolveLogoUrlPreservingStorage", () => {
  it("approved + Storage logo is not overwritten by fbcdn", () => {
    const logo = resolveLogoUrlPreservingStorage({
      isApproved: true,
      existingLogoUrl: STORAGE_LOGO,
      incomingLogoUrl: FBCDN_LOGO,
    });
    assert.equal(logo, STORAGE_LOGO);
  });

  it("pending vendor uses incoming logo when no Storage logo", () => {
    const logo = resolveLogoUrlPreservingStorage({
      isApproved: false,
      existingLogoUrl: null,
      incomingLogoUrl: FBCDN_LOGO,
    });
    assert.equal(logo, FBCDN_LOGO);
  });
});
