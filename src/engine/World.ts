import { Vector3 } from '@babylonjs/core'
import Chunk from './Chunk'
import Renderer from './Renderer'

export default class World {
  public static viewDistance = 16

  private chunks = new Map<string, Chunk | null>()
  private visited = new Set<string>()
  private viewPos = new Vector3()
  private chunkWorker = new Worker('./ChunkGenerator.worker.ts')

  public constructor() {
    this.setupWorker()
  }

  public updateView(position: Vector3, direction: Vector3) {
    this.viewPos.x = Math.floor(position.x / Chunk.size)
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
    this.visited.add(`${x},${y},${z}`)
    const distance = Math.abs(x - this.viewPos.x) + Math.abs(z - this.viewPos.z)

    if (this.isLoaded(x, y, z)) {
      if (distance > World.viewDistance) {
        this.unloadChunk(x, y, z)
      } else {
        if (!this.visited.has(`${x - 1},${y},${z}`)) {
          this.checkChunk(x - 1, 0, z)
        }
        if (!this.visited.has(`${x + 1},${y},${z}`)) {
          this.checkChunk(x + 1, 0, z)
        }
        if (!this.visited.has(`${x},${y},${z - 1}`)) {
          this.checkChunk(x, 0, z - 1)
        }
        if (!this.visited.has(`${x},${y},${z + 1}`)) {
          this.checkChunk(x, 0, z + 1)
        }
      }

      const chunk = this.chunks.get(`${x},${y},${z}`)
      if (chunk) {
        if (distance < 3) {
          Renderer.enablePhysics(chunk)
        } else {
          Renderer.disablePhysics(chunk)
        }
      }
    } else if (distance <= World.viewDistance) {
      this.loadChunk(x, y, z)
    }
  }

  private isLoaded(x: number, y: number, z: number) {
    return this.chunks.has(`${x},${y},${z}`)
  }

  private loadChunk(x: number, y: number, z: number) {
    this.chunks.set(`${x},${y},${z}`, null)

    this.chunkWorker.postMessage({ x, y, z })
  }

  private unloadChunk(x: number, y: number, z: number) {
    const chunk = this.chunks.get(`${x},${y},${z}`)

    if (chunk) {
      Renderer.delChunk(chunk)
      this.chunks.delete(`${x},${y},${z}`)
    }
  }

  private setupWorker() {
    this.chunkWorker.onmessage = (ev: MessageEvent) => {
      const { x, y, z } = ev.data
      const chunk = Chunk.deserialize(ev.data)

      Renderer.newChunk(chunk)
      this.chunks.set(`${x},${y},${z}`, chunk)
    }
  }
}
