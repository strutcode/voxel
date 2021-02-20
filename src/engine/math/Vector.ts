export default class Vector {
  public x = 0
  public y = 0
  public z = 0

  public static fromArray(input: number[]) {
    return new Vector(input)
  }

  private storage = new Float32Array(3)

  public constructor(array: number[])
  public constructor(x?: number, y?: number, z?: number)
  public constructor(a?: number | number[], y?: number, z?: number) {
    if (Array.isArray(a)) {
      this.x = a[0] ?? 0
      this.y = a[1] ?? 0
      this.z = a[2] ?? 0
    } else {
      this.x = a ?? 0
      this.y = y ?? 0
      this.z = z ?? 0
    }
  }

  public set(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }
}
