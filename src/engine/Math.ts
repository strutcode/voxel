export function manhattanDistance2d(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

export function manhattanDistance3d(x1, y1, z1, x2, y2, z2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)
}

let a
export function lerp(x: number, y: number, blend: number) {
  a = Math.max(0, Math.min(blend, 1))
  return x * (1 - a) + y * a
}
