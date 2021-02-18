import Chunk from './Chunk'
import { manhattanDistance3d } from './Math'
import Physics from './Physics'
import Renderer from './Renderer'
import Vector from './Vector'

function signed10bit(n) {
  return (n + 511) & 1023
}

function digitKey(x, y, z) {
  return (signed10bit(x) << 20) + (signed10bit(y) << 10) + signed10bit(z)
}

export default class World {
  public static viewDistance = 32

  private chunks = new Map<number, Chunk | null>()
  private visited = new Set<number>()
  private viewPos = new Vector()
  private chunkWorker = new Worker('./ChunkGenerator.worker.ts')

  public constructor() {
    this.setupWorker()
  }

  public updateView(position: Vector, direction: Vector) {
    this.viewPos.x = Math.floor(position.x / Chunk.size)
    this.viewPos.y = Math.floor(position.y / Chunk.size)
    this.viewPos.z = Math.floor(position.z / Chunk.size)
    this.visited.clear()
    this.checkChunk(this.viewPos.x, 0, this.viewPos.z)

    // HACK: The flood fill algorithm should remove these
    this.chunks.forEach((chunk) => {
      if (!chunk) return

      const distance =
        Math.abs(chunk.x - this.viewPos.x) + Math.abs(chunk.z - this.viewPos.z)

      if (distance > World.viewDistance) {
        this.unloadChunk(chunk.x, chunk.y, chunk.z)
      }
    })
  }

  private checkChunk(x: number, y: number, z: number) {
    const key = digitKey(x, y, z)
    this.visited.add(key)
    const distance = manhattanDistance3d(
      this.viewPos.x,
      this.viewPos.y,
      this.viewPos.z,
      x,
      y,
      z,
    )

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

    this.chunkWorker.postMessage({ x, y, z })
  }

  private unloadChunk(x: number, y: number, z: number) {
    const chunk = this.chunks.get(digitKey(x, y, z))

    if (chunk) {
      Renderer.remChunk(chunk)
      this.chunks.delete(digitKey(x, y, z))
    }
  }

  private setupWorker() {
    this.chunkWorker.onmessage = (ev: MessageEvent) => {
      const { x, y, z } = ev.data
      const chunk = Chunk.deserialize(ev.data)

      Renderer.addChunk(chunk)
      this.chunks.set(digitKey(x, y, z), chunk)
    }
  }
}
