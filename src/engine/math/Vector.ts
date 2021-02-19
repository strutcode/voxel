export default class Vector {
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

  public get x() {
    return this.storage[0]
  }
  public get y() {
    return this.storage[1]
  }
  public get z() {
    return this.storage[2]
  }

  public set x(val: number) {
    this.storage[0] = val
  }
  public set y(val: number) {
    this.storage[1] = val
  }
  public set z(val: number) {
    this.storage[2] = val
  }

  public set(x: number, y: number, z: number) {
    this.storage[0] = x
    this.storage[1] = y
    this.storage[2] = z
  }
}
