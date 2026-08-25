import type { LabGeometry } from "../domain/types";

export function geometryCenter(geometry: LabGeometry) {
  const count = Math.max(1, geometry.points.length);
  return geometry.points.reduce((center, point) => ({ x: center.x + point.x / count, y: center.y + point.y / count }), { x: 0, y: 0 });
}

export function radialInfluence(width: number, height: number, geometry: LabGeometry, strength: number, radius: number) {
  const field = new Float32Array(width * height);
  const center = geometryCenter(geometry);
  const safeRadius = Math.max(0.025, radius);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const dx = (x + 0.5) / width - center.x;
    const dy = (y + 0.5) / height - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    field[y * width + x] = Math.min(1, Math.max(0, strength * Math.exp(-(distance * distance) / (2 * safeRadius * safeRadius))));
  }
  return field;
}
