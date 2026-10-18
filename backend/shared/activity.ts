export type SaleState = { claim?: { status?: string | null }; transaction?: { status?: string | null } };
export const isSold = (item: SaleState) => item.claim?.status === 'completed' || item.transaction?.status === 'confirmed';
export const canEditListing = (item: SaleState) => !isSold(item) && item.transaction?.status !== 'awaitingConfirmation';
export function orderActivity<T extends SaleState>(items: readonly T[], selling: boolean): T[] {
  const rank = (item: T) => isSold(item) ? 2 : selling && item.transaction?.status === 'awaitingConfirmation' ? 0 : 1;
  return [...items].sort((a, b) => rank(a) - rank(b));
}
