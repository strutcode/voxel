import { wrap } from './math/Geometry'

interface SerializedMapData {
  width: number
  height: number
  biome: Uint8ClampedArray
  depth: Float32Array
}

class MapData<T extends Uint8ClampedArray | Float32Array> {
  constructor(public data: T, public width: number, public height: number) {}

  public get(x: number, y: number) {
    return this.data[wrap(y, this.height) * this.width + wrap(x, this.width)]
  }

  public set(x: number, y: number, value: number) {
    this.data[wrap(y, this.height) * this.width + wrap(x, this.width)] = value
  }

  public fastGet(x: number, y: number) {
    return this.data[y * this.width + x]
  }

  public fastSet(x: number, y: number, value: number) {
    this.data[y * this.width + x] = value
  }
}

export default class WorldMap {
  public static deserialize(serialized: SerializedMapData) {
    const map = new WorldMap(serialized.width, serialized.height)

    if (serialized.biome) {
      map.biomeMap = new MapData(
        serialized.biome,
        serialized.width,
        serialized.height,
      )
    }

    if (serialized.depth) {
      map.depthMap = new MapData(
        serialized.depth,
        serialized.width,
        serialized.height,
      )
    }

    return map
  }

  private biomeMap?: MapData<Uint8ClampedArray>
  private depthMap?: MapData<Float32Array>
  private refineH = false

  public constructor(
    public width: number,
    public height: number,
    private subdivisions = 4,
  ) {}

  public generate() {
    this.initialize()

    for (let n = 0; n < this.subdivisions; n++) {
      this.refine()
    }
  }

  private initialize() {
    this.biomeMap = new MapData(
      new Uint8ClampedArray(this.width * this.height),
      this.width,
      this.height,
    )
    this.depthMap = new MapData(
      new Float32Array(this.width * this.height),
      this.width,
      this.height,
    )

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (y === 0 || y === this.height - 1) {
          this.biomeMap.fastSet(x, y, 4)
          this.depthMap.fastSet(x, y, 16)
          continue
        }

        this.biomeMap.fastSet(x, y, Math.random() < 0.5 ? 3 : 2)
        this.depthMap.fastSet(
          x,
          y,
          this.biomeMap.fastGet(x, y) === 3 ? 1 : 16 + Math.random() * 16,
        )
      }
    }
  }

  private refine() {
    if (!this.biomeMap) return

    const oldBiome = this.biomeMap
    const oldDepth = this.depthMap

    // Resize the map; we'll double the number to create empty space between rows and cols
    this.width *= 2
    this.height *= 2
    this.biomeMap = new MapData(
      new Uint8ClampedArray(this.width * this.height),
      this.width,
      this.height,
    )
    this.depthMap = new MapData(
      new Float32Array(this.width * this.height),
      this.width,
      this.height,
    )

    let x, y, xx, yy, ex, ey

    // Fill gaps on primary axis
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        xx = Math.floor(x / 2)
        yy = Math.floor(y / 2)

        ex = x % 2 === 0
        ey = y % 2 === 0

        if (ex && ey) {
          this.biomeMap.fastSet(x, y, oldBiome.fastGet(xx, yy))
          this.depthMap.fastSet(x, y, oldDepth.fastGet(xx, yy))
          continue
        }

        if (this.refineH && ey && !ex) {
          this.biomeMap.fastSet(
            x,
            y,
            oldBiome.get(xx + Math.round(Math.random()), yy),
          )
          this.depthMap.fastSet(
            x,
            y,
            (oldDepth.get(xx, yy) + oldDepth.get(xx + 1, yy)) / 2,
          )
        }

        if (!this.refineH && ex && !ey) {
          this.biomeMap.fastSet(
            x,
            y,
            oldBiome.get(xx, yy + Math.round(Math.random())),
          )
          this.depthMap.fastSet(
            x,
            y,
            (oldDepth.get(xx, yy) + oldDepth.get(xx, yy + 1)) / 2,
          )
        }
      }
    }

    // Fill gaps on secondary axis
    if (this.refineH) {
      for (y = 1; y < this.height; y += 2) {
        for (x = 0; x < this.width; x++) {
          this.biomeMap.fastSet(
            x,
            y,
            this.biomeMap.get(x, y + Math.sign(Math.random() - 0.5)),
          )
          this.depthMap.fastSet(
            x,
            y,
            (this.depthMap.get(x, y - 1) + this.depthMap.get(x, y + 1)) / 2,
          )
        }
      }
    } else {
      for (y = 0; y < this.height; y++) {
        for (x = 1; x < this.width; x += 2) {
          this.biomeMap.fastSet(
            x,
            y,
            this.biomeMap.get(x + Math.sign(Math.random() - 0.5), y),
          )
          this.depthMap.fastSet(
            x,
            y,
            (this.depthMap.get(x - 1, y) + this.depthMap.get(x + 1, y)) / 2,
          )
        }
      }
    }

    // Flip axis
    this.refineH = !this.refineH
  }

  public biomeAt(x: number, y: number) {
    if (!this.biomeMap) return 0

    return this.biomeMap.get(x, y)
  }

  public depthAt(x: number, y: number) {
    if (!this.depthMap) return 0

    return this.depthMap.get(x, y)
  }

  public serialize(): SerializedMapData {
    return {
      width: this.width,
      height: this.height,
      biome: this.biomeMap?.data,
      depth: this.depthMap?.data,
    }
  }
}
