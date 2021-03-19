import Chunk from '../voxel/Chunk'
import { euclideanDistance3d, wrap } from '../math/Geometry'
import Physics from '../physics/Physics'
import Renderer from '../graphics/Renderer'
import Vector from '../math/Vector'
import WorldMap from './WorldMap'
import Doodad from './Doodad'
import { digitKey } from '../math/Bitwise'

export default class World {
  private chunks = new Map<number, Chunk | null>()
  private viewPos = new Vector()
  private chunkWorker = new Worker('../voxel/ChunkGenerator.worker.ts')

  public constructor(public map: WorldMap) {
    this.setupWorker()
  }

  public async init() {
    const { x, y, z } = this.viewPos

    // Just prioritize player's chunk for now
    this.maybeLoadChunk(
      Math.floor(x / Chunk.size),
      Math.floor(y / Chunk.size),
      Math.floor(z / Chunk.size),
    )

    await new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.isReady(x, y, z)) {
          clearTimeout(timer)
          resolve()
        }
      }, 10)
    })
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

    let x, y, z
    for (
      x = this.viewPos.x - Renderer.viewDistance;
      x < this.viewPos.x + Renderer.viewDistance;
      x++
    ) {
      for (
        y = this.viewPos.y - Renderer.viewDistance;
        y < this.viewPos.y + Renderer.viewDistance;
        y++
      ) {
        for (
          z = this.viewPos.z - Renderer.viewDistance;
          z < this.viewPos.z + Renderer.viewDistance;
          z++
        ) {
          this.maybeLoadChunk(x, y, z)
        }
      }
    }
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

  private maybeLoadChunk(x: number, y: number, z: number) {
    if (y < 0) return

    const distance = euclideanDistance3d(
      this.viewPos.x,
      this.viewPos.y,
      this.viewPos.z,
      x,
      y,
      z,
    )

    if (distance > Renderer.viewDistance) {
      if (this.isLoaded(x, y, z)) {
        this.unloadChunk(x, y, z)
      }
    } else {
      if (!this.isLoaded(x, y, z)) {
        this.loadChunk(x, y, z)
      }

      const chunk = this.chunks.get(digitKey(x, y, z))
      if (chunk) {
        if (distance < Physics.activeDistance) {
          Physics.addChunk(chunk)
        } else {
          Physics.remChunk(chunk)
        }
      }
    }
  }

  private isLoaded(x: number, y: number, z: number) {
    return this.chunks.has(digitKey(x, y, z))
  }

  private isReady(x: number, y: number, z: number) {
    // TODO: This doesn't account for meshing and physics
    return !!this.chunks.get(digitKey(x, y, z))
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

  private setupWorker() {
    this.chunkWorker.postMessage({
      type: 'map',
      map: this.map.serialize(),
    })

    this.chunkWorker.onmessage = (ev: MessageEvent) => {
      const { x, y, z } = ev.data
      const chunk = Chunk.deserialize(ev.data)

      this.registerObjects(chunk)
      Renderer.addChunk(chunk)

      this.chunks.set(digitKey(x, y, z), chunk)
    }
  }

  private registerObjects(chunk: Chunk) {
    for (let name in chunk.objects) {
      chunk.objects[name].forEach(object => {
        const doodad = new Doodad(name)

        doodad.position.set(object.x, object.y, object.z)
        doodad.rotation = object.rotation ?? 0

        object.id = doodad.id
      })
    }
  }
}
