import Chunk from './voxel/Chunk'
import { manhattanDistance3d } from './math/Geometry'
import Physics from './physics/Physics'
import Renderer from './graphics/Renderer'
import Vector from './math/Vector'
import Block from './voxel/Block'

function signed10bit(n) {
  return (n + 511) & 1023
}

function digitKey(x, y, z) {
  return (signed10bit(x) << 20) + (signed10bit(y) << 10) + signed10bit(z)
}

export default class World {
  public static viewDistance = 16

  private chunks = new Map<number, Chunk | null>()
  private visited = new Set<number>()
  private physics = new Set<number>()
  private viewPos = new Vector()
  private chunkWorker = new Worker('./voxel/ChunkGenerator.worker.ts')

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

  public getBlock(x: number, y: number, z: number): Block | null {
    const cx = Math.floor(x / Chunk.size)
    const cy = Math.floor(y / Chunk.size)
    const cz = Math.floor(z / Chunk.size)
    const chunk = this.chunks.get(digitKey(cx, cy, cz))

    if (chunk) {
      return chunk.get(x % Chunk.size, y % Chunk.size, z % Chunk.size)
    }

    return null
  }

  public setBlock(x: number, y: number, z: number, block: Block) {
    const cx = Math.floor(x / Chunk.size)
    const cy = Math.floor(y / Chunk.size)
    const cz = Math.floor(z / Chunk.size)
    const chunk = this.chunks.get(digitKey(cx, cy, cz))

    if (chunk) {
      chunk.set(x % Chunk.size, y % Chunk.size, z % Chunk.size, 0)
      this.refreshChunk(cx, cy, cz)
    }
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
          // if (!this.physics.has(key)) {
          Physics.addChunk(chunk)
          // this.physics.add(key)
          // }
        } else {
          // if (this.physics.has(key)) {
          Physics.remChunk(chunk)
          // this.physics.delete(key)
          // }
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

  private setupWorker() {
    this.chunkWorker.onmessage = (ev: MessageEvent) => {
      const { x, y, z } = ev.data
      const chunk = Chunk.deserialize(ev.data)

      Renderer.addChunk(chunk)
      this.chunks.set(digitKey(x, y, z), chunk)
    }
  }
}
