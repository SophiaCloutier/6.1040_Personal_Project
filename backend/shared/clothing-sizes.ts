export const clothingSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One size'];

export function matchesClothingSize(itemSize: string | undefined, selectedSize: string): boolean {
  const size = normalizeClothingSize(itemSize ?? '');
  return !selectedSize || !size || size === normalizeClothingSize(selectedSize);
}

export function normalizeClothingSize(value: string): string {
  const size = value.trim().replace(/\s+/g, ' ').toUpperCase();
  const aliases: Record<string, string> = {
    'EXTRA EXTRA SMALL': 'XXS', 'EXTRA SMALL': 'XS', SMALL: 'S', MEDIUM: 'M', LARGE: 'L',
    'EXTRA LARGE': 'XL', 'EXTRA EXTRA LARGE': 'XXL', '2XL': 'XXL', XXXL: '3XL',
    'ONE SIZE': 'One size', 'ONE-SIZE': 'One size', OS: 'One size', OSFA: 'One size',
  };
  return aliases[size] ?? size;
}
