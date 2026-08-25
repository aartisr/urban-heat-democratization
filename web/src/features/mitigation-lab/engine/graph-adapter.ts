/** A deliberately conservative connectivity proxy for the synthetic teaching grid. */
export function coolingContinuity(priority: Float32Array, width: number, height: number) {
  let connected = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const index = y * width + x;
    const nearRoute = Math.abs(y / height - 0.53) < 0.14;
    if (nearRoute && priority[index] < 0.56) connected += 1;
  }
  return connected / priority.length;
}
