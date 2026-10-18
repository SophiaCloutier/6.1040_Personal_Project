export type PhotoPosition = { x: number; y: number; zoom?: number };
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function panPhoto(position: PhotoPosition, dx: number, dy: number, overflowX: number, overflowY: number): PhotoPosition {
  return { ...position, x: overflowX > 0.01 ? clamp(position.x - dx / overflowX * 100, 0, 100) : position.x, y: overflowY > 0.01 ? clamp(position.y - dy / overflowY * 100, 0, 100) : position.y };
}
export function zoomPhoto(position: PhotoPosition, factor: number, minimum = 1): PhotoPosition {
  return { ...position, zoom: clamp((position.zoom ?? 1) * factor, minimum, 4) };
}
