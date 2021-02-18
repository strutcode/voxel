let a
export function lerp(x: number, y: number, blend: number) {
  a = Math.max(0, Math.min(blend, 1))
  return x * (1 - a) + y * a
}
