export default class Vector {
  private data = [0, 0, 0]

  public static fromArray(input: number[]) {
    return new Vector(input)
  }

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
    return this.data[0]
  }
  public get y() {
    return this.data[1]
  }
  public get z() {
    return this.data[2]
  }
  public set x(val) {
    this.data[0] = val
  }
  public set y(val) {
    this.data[1] = val
  }
  public set z(val) {
    this.data[2] = val
  }

  public set(x: number, y: number, z: number) {
    this.data[0] = x
    this.data[1] = y
    this.data[2] = z
  }

  public get asArray() {
    return this.data
  }

  public get length() {
    return Math.sqrt(this.data[0] ** 2 + this.data[1] ** 2 + this.data[2] ** 2)
  }

  public add(other: Vector | number) {
    if (typeof other === 'number') {
      return new Vector(this.x + other, this.y + other, this.z + other)
    }

    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z)
  }

  public sub(other: Vector | number) {
    if (typeof other === 'number') {
      return new Vector(this.x - other, this.y - other, this.z - other)
    }

    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z)
  }

  public mul(other: Vector | number) {
    if (typeof other === 'number') {
      return new Vector(this.x * other, this.y * other, this.z * other)
    }

    return new Vector(this.x * other.x, this.y * other.y, this.z * other.z)
  }

  public div(other: Vector | number) {
    if (typeof other === 'number') {
      return new Vector(this.x / other, this.y / other, this.z / other)
    }

    return new Vector(this.x / other.x, this.y / other.y, this.z / other.z)
  }

  public dot(other: Vector) {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  public cross(other: Vector) {
    return new Vector(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    )
  }

  public normalize() {
    const div = this.length

    if (div === 0) return this

    this.x /= div
    this.y /= div
    this.z /= div

    return this
  }
}
