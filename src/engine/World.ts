import Chunk from './voxel/Chunk'
import { manhattanDistance2d } from './math/Geometry'
import Physics from './physics/Physics'
import Renderer from './graphics/Renderer'
import Vector from './math/Vector'
import WorldMap from './WorldMap'

function signed10bit(n) {
  return (n + 511) & 1023
}

function digitKey(x, y, z) {
  return (signed10bit(x) << 20) + (signed10bit(y) << 10) + signed10bit(z)
}

function wrap(n, max) {
  return (n + max) % max
}

export default class World {
  public static viewDistance = 16

  public map = new WorldMap(16, 8, 7)
  private chunks = new Map<number, Chunk | null>()
  private visited = new Set<number>()
  private viewPos = new Vector()
  private chunkWorker = new Worker('./voxel/ChunkGenerator.worker.ts')

  public constructor() {
    this.setupMap()
    this.setupWorker()
  }

  public get width() {
    return this.map.width
  }

  public get height() {
    return this.map.height
  }

  public updateView(position: Vector, direction: Vector) {
    this.viewPos.x = Math.floor(position.x / Chunk.size)
    this.viewPos.y = Math.floor(position.y / Chunk.size)
    this.viewPos.z = Math.floor(position.z / Chunk.size)
    this.visited.clear()
    this.checkChunk(this.viewPos.x, 0, this.viewPos.z)

    // HACK: The flood fill algorithm should remove these
    this.chunks.forEach(chunk => {
      if (!chunk) return

      const distance = manhattanDistance2d(
        chunk.x,
        chunk.z,
        this.viewPos.x,
        this.viewPos.z,
      )

      if (distance > World.viewDistance) {
        this.unloadChunk(chunk.x, chunk.y, chunk.z)
      }
    })
  }

  public getBlock(x: number, y: number, z: number): number | null {
    x = wrap(x, this.width)
    z = wrap(z, this.height)

    const cx = Math.floor(x / Chunk.size)
    const cy = Math.floor(y / Chunk.size)
    const cz = Math.floor(z / Chunk.size)
    const chunk = this.chunks.get(digitKey(cx, cy, cz))

    if (chunk) {
      return chunk.get(
        x - cx * Chunk.size,
        y - cy * Chunk.size,
        z - cz * Chunk.size,
      )
    }

    return null
  }

  public setBlock(x: number, y: number, z: number, block: number) {
    x = wrap(x, this.width)
    z = wrap(z, this.height)

    const cx = Math.floor(x / Chunk.size)
    const cy = Math.floor(y / Chunk.size)
    const cz = Math.floor(z / Chunk.size)
    const chunk = this.chunks.get(digitKey(cx, cy, cz))

    if (chunk) {
      chunk.set(
        x - cx * Chunk.size,
        y - cy * Chunk.size,
        z - cz * Chunk.size,
        0,
      )
      this.refreshChunk(cx, cy, cz)
    }
  }

  private checkChunk(x: number, y: number, z: number) {
    const key = digitKey(x, y, z)
    this.visited.add(key)
    const distance = manhattanDistance2d(this.viewPos.x, this.viewPos.z, x, z)

    if (this.isLoaded(x, y, z)) {
      if (distance > World.viewDistance) {
        this.unloadChunk(x, y, z)
      } else {
        if (!this.visited.has(digitKey(x - 1, 0, z))) {
          this.checkChunk(x - 1, 0, z)
        }
        if (!this.visited.has(digitKey(x + 1, 0, z))) {
          this.checkChunk(x + 1, 0, z)
        }
        if (!this.visited.has(digitKey(x, 0, z - 1))) {
          this.checkChunk(x, 0, z - 1)
        }
        if (!this.visited.has(digitKey(x, 0, z + 1))) {
          this.checkChunk(x, 0, z + 1)
        }
      }

      const chunk = this.chunks.get(key)
      if (chunk) {
        if (distance < 3) {
          Physics.addChunk(chunk)
        } else {
          Physics.remChunk(chunk)
        }
      }
    } else if (distance <= World.viewDistance) {
      this.loadChunk(x, y, z)
    }
  }

  private isLoaded(x: number, y: number, z: number) {
    return this.chunks.has(digitKey(x, y, z))
  }

  private loadChunk(x: number, y: number, z: number) {
    this.chunks.set(digitKey(x, y, z), null)

    this.chunkWorker.postMessage({ type: 'chunk', x, y, z })
  }

  private refreshChunk(x: number, y: number, z: number) {
    const chunk = this.chunks.get(digitKey(x, y, z))

    if (chunk) {
      Renderer.updateChunk(chunk)
      Physics.updateChunk(chunk)
    }
  }

  private unloadChunk(x: number, y: number, z: number) {
    const chunk = this.chunks.get(digitKey(x, y, z))

    if (chunk) {
      Renderer.remChunk(chunk)
      this.chunks.delete(digitKey(x, y, z))
    }
  }

  private setupMap() {
    this.map.generate()
  }

  private setupWorker() {
    this.chunkWorker.postMessage({
      type: 'map',
      map: this.map.serialize(),
    })

    this.chunkWorker.onmessage = (ev: MessageEvent) => {
      const { x, y, z } = ev.data
      const chunk = Chunk.deserialize(ev.data)

      Renderer.addChunk(chunk)
      this.chunks.set(digitKey(x, y, z), chunk)
    }
  }
}
