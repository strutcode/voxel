export default class Vector {
  public static fromArray(input: number[]) {
    return new Vector(input)
  }

  private storage = new Float32Array(3)

  constructor(array: number[])
  constructor(x?: number, y?: number, z?: number)
  constructor(a?: number | number[], y?: number, z?: number) {
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

  get x() {
    return this.storage[0]
  }
  get y() {
    return this.storage[1]
  }
  get z() {
    return this.storage[2]
  }

  set x(val: number) {
    this.storage[0] = val
  }
  set y(val: number) {
    this.storage[1] = val
  }
  set z(val: number) {
    this.storage[2] = val
  }
}
