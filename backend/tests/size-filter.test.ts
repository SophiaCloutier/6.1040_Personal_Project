import { expect, test } from 'bun:test';
import { matchesClothingSize } from '../shared/clothing-sizes.ts';

test('size filters preserve unsized items and restrict only items with a size', () => {
  const items = [
    { title: 'Bike', clothingSize: undefined },
    { title: 'Bike helmet', clothingSize: '' },
    { title: 'Bike jersey', clothingSize: 'XL' },
    { title: 'Bike jersey medium', clothingSize: 'M' },
    { title: 'Desk', clothingSize: undefined },
  ];
  expect(items.filter(item => item.title.toLowerCase().includes('bike') && matchesClothingSize(item.clothingSize, 'XL')).map(item => item.title)).toEqual(['Bike', 'Bike helmet', 'Bike jersey']);
  expect(matchesClothingSize('extra large', 'XL')).toBe(true);
  expect(matchesClothingSize('M', '')).toBe(true);
  expect(matchesClothingSize('   ', 'XL')).toBe(true);
});
