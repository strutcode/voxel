import noise from 'asm-noise'
import { wrap } from './math/Geometry'
import { clamp } from './math/Interpolation'

interface SerializedMapData {
  width: number
  height: number
  biome?: Uint8ClampedArray
  depth?: Float32Array
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

    this.depthMap = new MapData(
      new Float32Array(this.width * this.height),
      this.width,
      this.height,
    )

    let x, y, d
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        d = (this.distanceToWater(x, y) / 8) * noise(x / 200, y / 200)

        if (d < 1 && this.biomeAt(x, y) === 2) {
          this.biomeMap?.fastSet(x, y, 1)
        }

        this.depthMap.fastSet(x, y, clamp(d, 1, 32))
      }
    }
  }

  private distanceToWater(x: number, y: number): number {
    if (this.biomeAt(x, y) === 3) return 0

    let xx,
      yy,
      d = 1

    for (let i = 0; i < 400; i++) {
      xx = i % 2 === 0 ? 0 : d
      yy = i % 2 === 1 ? 0 : d

      if (i % 3 == 0) xx = -xx
      if (i % 4 == 0) yy = -yy

      if (this.biomeAt(x + xx, y + yy) === 3) {
        break
      }

      if (i % 4 === 0) d++
    }

    return d
  }

  private initialize() {
    this.biomeMap = new MapData(
      new Uint8ClampedArray(this.width * this.height),
      this.width,
      this.height,
    )

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (y === 0 || y === this.height - 1) {
          this.biomeMap.fastSet(x, y, 4)
          continue
        }

        this.biomeMap.fastSet(x, y, Math.random() < 0.5 ? 3 : 2)
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
          continue
        }

        if (this.refineH && ey && !ex) {
          this.biomeMap.fastSet(
            x,
            y,
            oldBiome.get(xx + Math.round(Math.random()), yy),
          )
        }

        if (!this.refineH && ex && !ey) {
          this.biomeMap.fastSet(
            x,
            y,
            oldBiome.get(xx, yy + Math.round(Math.random())),
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
