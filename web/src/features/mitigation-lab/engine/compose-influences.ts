/** Combines bounded mechanism fields without allowing additive over-claims. */
export function composeInfluences(fields: Float32Array[]): Float32Array {
  if (!fields.length) return new Float32Array();
  const result = new Float32Array(fields[0].length);
  for (let index = 0; index < result.length; index += 1) {
    let remaining = 1;
    for (const field of fields) remaining *= 1 - Math.min(1, Math.max(0, field[index] ?? 0));
    result[index] = 1 - remaining;
  }
  return result;
}
