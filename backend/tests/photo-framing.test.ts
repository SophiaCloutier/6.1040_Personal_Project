import { expect, test } from 'bun:test';
import { panPhoto, zoomPhoto } from '../shared/photo-framing';

test('drag follows the pointer and stops at image edges without exposing empty space', () => {
  // A 300px photo in a 200px viewport has 100px of horizontal travel.
  expect(panPhoto({ x: 50, y: 50, zoom: 1 }, 25, 0, 100, 0)).toEqual({ x: 25, y: 50, zoom: 1 });
  expect(panPhoto({ x: 50, y: 50 }, -200, 200, 100, 100)).toEqual({ x: 100, y: 0 });
  expect(panPhoto({ x: 30, y: 70 }, 20, 20, 0, 0)).toEqual({ x: 30, y: 70 });
});

test('zoom supports old saved positions and stays within the supported crop range', () => {
  expect(zoomPhoto({ x: 20, y: 80 }, 2)).toEqual({ x: 20, y: 80, zoom: 2 });
  expect(zoomPhoto({ x: 20, y: 80, zoom: 4 }, 2).zoom).toBe(4);
  expect(zoomPhoto({ x: 20, y: 80, zoom: 1 }, 0.5).zoom).toBe(1);
});


test('item viewing can zoom out to fit the full image without changing editor zoom limits', () => {
  expect(zoomPhoto({ x: 50, y: 50, zoom: 1 }, 0.1, 0.5).zoom).toBe(0.5);
  expect(zoomPhoto({ x: 50, y: 50, zoom: 1 }, 0.1).zoom).toBe(1);
});
