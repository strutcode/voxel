export function signed10bit(n: number) {
  return (n + 511) & 1023
}

export function digitKey(x: number, y: number, z: number) {
  return (signed10bit(x) << 20) + (signed10bit(y) << 10) + signed10bit(z)
}
