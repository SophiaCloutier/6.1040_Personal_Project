import { expect, test } from 'bun:test';
import { canEditListing, orderActivity } from '../shared/activity';
const sale = (id: string, status: string, claim = 'claimed') => ({ id, claim: { status: claim }, transaction: { status } });
test('selling puts confirmations first and sold last, preserving newest order within each group', () => {
  const items = [sale('sold-new', 'confirmed', 'completed'), sale('active-new', 'awaitingPayment'), sale('confirm-new', 'awaitingConfirmation'), sale('sold-old', 'confirmed', 'completed'), sale('available', '', 'available'), sale('confirm-old', 'awaitingConfirmation')];
  expect(orderActivity(items, true).map(i => i.id)).toEqual(['confirm-new', 'confirm-old', 'active-new', 'available', 'sold-new', 'sold-old']);
  expect(items[0].id).toBe('sold-new');
  expect(orderActivity(items, false).map(i => i.id)).toEqual(['active-new', 'confirm-new', 'available', 'confirm-old', 'sold-new', 'sold-old']);
});
test('edits close on reported payment or either completed state, but unpaid reservations remain editable', () => {
  expect(canEditListing(sale('available', '', 'available'))).toBe(true);
  expect(canEditListing(sale('reserved', 'awaitingPayment'))).toBe(true);
  expect(canEditListing(sale('sent', 'awaitingConfirmation'))).toBe(false);
  expect(canEditListing(sale('sold', '', 'completed'))).toBe(false);
  expect(canEditListing(sale('confirmed', 'confirmed'))).toBe(false);
});
