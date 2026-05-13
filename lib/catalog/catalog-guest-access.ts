/** Сколько карточек поставщиков видит гость без оплаты (глобально, с учётом пагинации). */
export const GUEST_FREE_CATALOG_CARDS = 6;

export function isCatalogCardLockedForGuest(opts: {
  hasFullAccess: boolean;
  globalIndex: number;
  freeLimit?: number;
}): boolean {
  if (opts.hasFullAccess) return false;
  const limit = opts.freeLimit ?? GUEST_FREE_CATALOG_CARDS;
  return opts.globalIndex >= limit;
}
