export type ParsedListingKey =
  | { kind: "slug"; slug: string }
  | { kind: "sample"; sampleId: string };

export function parseListingKey(key: string): ParsedListingKey | null {
  if (key.startsWith("slug:")) {
    const slug = key.slice(5).trim();
    if (!slug) {
      return null;
    }
    return { kind: "slug", slug };
  }
  if (key.startsWith("sample:")) {
    const id = key.slice(7).trim();
    if (!/^\d+$/.test(id)) {
      return null;
    }
    return { kind: "sample", sampleId: id };
  }
  return null;
}

export function catalogListingKeyFromSlug(slug: string): string {
  return `slug:${slug}`;
}

export function catalogListingKeyFromSampleId(sampleId: string): string {
  return `sample:${sampleId}`;
}
