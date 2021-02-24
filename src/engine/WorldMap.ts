import { wrap } from './math/Geometry'

interface SerializedMapData {
  width: number
  height: number
  data: Uint16Array
}

export default class WorldMap {
  public static deserialize(serialized: SerializedMapData) {
    return new WorldMap(
      serialized.width,
      serialized.height,
      undefined,
      serialized.data,
    )
  }

  private data: Uint16Array
  private refineH = false

  public constructor(
    public width: number,
    public height: number,
    private subdivisions = 4,
    referenceData?: Uint16Array,
  ) {
    if (referenceData && referenceData.length === width * height) {
      this.data = referenceData
    } else {
      this.data = new Uint16Array(width * height)
    }
  }

  public get(x: number, y: number) {
    return this.data[wrap(y, this.height) * this.width + wrap(x, this.width)]
  }

  public set(x: number, y: number, val: number) {
    this.data[wrap(y, this.height) * this.width + wrap(x, this.width)] = val
  }

  public generate() {
    this.initialize()

    for (let n = 0; n < this.subdivisions; n++) {
      this.refine()
    }
  }

  private initialize() {
    for (let i = 0; i < this.data.length; i++) {
      if (i < this.width || i > this.data.length - this.width - 1) {
        this.data[i] = 4
        continue
      }

      this.data[i] = Math.random() < 0.5 ? 3 : 2
    }
  }

  private refine() {
    const oldData = this.data
    const oldWidth = this.width
    const oldHeight = this.height

    // Resize the map; we'll double the number to create empty space between rows and cols
    this.width *= 2
    this.height *= 2
    this.data = new Uint16Array(this.width * this.height)

    let x, y, ia, ib, ex, ey

    // Fill gaps on primary axis
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        ia = Math.floor(y / 2) * oldWidth + Math.floor(x / 2)
        ib = y * this.width + x

        ex = x % 2 === 0
        ey = y % 2 === 0

        if (ex && ey) {
          this.data[ib] = oldData[ia]
          continue
        }

        if (this.refineH && ey && !ex) {
          ia =
            Math.floor(y / 2) * oldWidth +
            Math.floor(wrap(x / 2 + Math.round(Math.random()), oldWidth))
          this.data[ib] = oldData[ia]
        }

        if (!this.refineH && ex && !ey) {
          ia =
            Math.floor(wrap(y / 2 + Math.round(Math.random()), oldHeight)) *
              oldWidth +
            Math.floor(x / 2)
          this.data[ib] = oldData[ia]
        }
      }
    }

    // Fill gaps on secondary axis
    if (this.refineH) {
      for (y = 1; y < this.height; y += 2) {
        for (x = 0; x < this.width; x++) {
          ia = y * this.width + x

          this.data[ia] = this.get(x, y + Math.sign(Math.random() - 0.5))
        }
      }
    } else {
      for (y = 0; y < this.height; y++) {
        for (x = 1; x < this.width; x += 2) {
          ia = y * this.width + x

          this.data[ia] = this.get(x + Math.sign(Math.random() - 0.5), y)
        }
      }
    }

    // Flip axis
    this.refineH = !this.refineH
  }

  public biomeAt(x: number, y: number) {
    x = (x + this.width) % this.width
    y = (y + this.height) % this.height

    return this.data[y * this.width + x]
  }

  public serialize(): SerializedMapData {
    return {
      width: this.width,
      height: this.height,
      data: this.data,
    }
  }
}
