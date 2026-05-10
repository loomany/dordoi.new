import { NextResponse } from "next/server";

import { fetchApprovedVendorPhotoBatches } from "@/lib/catalog/published-vendors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Подгрузка следующих партий фото для страницы магазина (бесконечный скролл).
 * GET /api/catalog/vendors/{vendorId}/photo-batches?before=ISO&limit=4
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;

  if (!UUID_RE.test(vendorId)) {
    return NextResponse.json(
      { error: "Invalid vendorId" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const beforeRaw = url.searchParams.get("before");
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 4;
  const before =
    beforeRaw && !Number.isNaN(Date.parse(beforeRaw)) ? beforeRaw : null;

  const batches = await fetchApprovedVendorPhotoBatches({
    vendorId,
    limit: Number.isFinite(limit) ? limit : 4,
    before,
  });

  return NextResponse.json(
    { batches },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
