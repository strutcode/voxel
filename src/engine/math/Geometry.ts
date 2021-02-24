export function manhattanDistance2d(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

export function manhattanDistance3d(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)
}

export function wrap(val: number, max: number) {
  return (val + max) % max
}
