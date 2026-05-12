import { z } from "zod";

import type { DordoiFirstTouchPayload } from "@/lib/dordoi/analytics/types";

const firstTouchSchema = z
  .object({
    firstPath: z.string().max(500).optional(),
    firstSearch: z.string().max(2000).optional(),
    firstReferrer: z.string().max(2000).optional(),
    firstUrl: z.string().max(2000).optional(),
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),
    gclidPresent: z.boolean().optional(),
    gbraidPresent: z.boolean().optional(),
    wbraidPresent: z.boolean().optional(),
    visitorId: z.string().max(200).optional(),
    sessionId: z.string().max(200).optional(),
    createdAt: z.string().max(80).optional(),
  })
  .strip();

export function parseDordoiFirstTouch(
  raw: unknown,
): DordoiFirstTouchPayload | undefined {
  if (raw === undefined || raw === null) return undefined;
  const p = firstTouchSchema.safeParse(raw);
  if (!p.success) return undefined;
  return p.data;
}
