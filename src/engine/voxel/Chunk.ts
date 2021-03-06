import { digitKey } from '../math/Bitwise'

const blockPos = (x: number, y: number, z: number) =>
  Math.floor(y * Chunk.squareSize + z * Chunk.size + x)

type ChunkData = {
  x: number
  y: number
  z: number
  objects: Record<string, ChunkObject[]>
  data: Uint32Array | undefined
  solidCount: number
}

type ChunkObject = {
  id?: number
  x: number
  y: number
  z: number
  rotation?: number
  scale?: number
}

export default class Chunk {
  public static size = 32
  public static squareSize = Chunk.size ** 2
  public static cubeSize = Chunk.size ** 3

  public static deserialize(serialized: ChunkData) {
    const chunk = new Chunk(serialized.x, serialized.y, serialized.z)
    chunk.objects = serialized.objects
    chunk.chunkStore = serialized.data
    chunk.solidCount = serialized.solidCount
    return chunk
  }

  private chunkStore?: Uint32Array
  private solidCount = 0
  public objects: Record<string, ChunkObject[]> = {}

  constructor(public x = 0, public y = 0, public z = 0) {}

  public get key() {
    return digitKey(this.x, this.y, this.z)
  }

  public get(x: number, y: number, z: number): number {
    if (!this.chunkStore) {
      return 0
    }

    return this.chunkStore[blockPos(x, y, z)]
  }

  public set(x: number, y: number, z: number, id: number) {
    if (!this.chunkStore && id !== 0) {
      this.chunkStore = new Uint32Array(Chunk.cubeSize)
    }

    // Bookkeeping
    if (id === 0) {
      if (this.get(x, y, z) !== 0) {
        this.solidCount--
      }
    }
    else {
      if (this.get(x, y, z) === 0) {
        this.solidCount++
      }
    }
    
    if (this.chunkStore) {
      this.chunkStore[blockPos(x, y, z)] = id
    }
  }

  public get isEmpty() {
    return !this.chunkStore
  }

  public get isFull() {
    return this.solidCount === Chunk.cubeSize
  }

  public addObject(
    name: string,
    x: number,
    y: number,
    z: number,
    rotation = 0,
    scale = 1,
  ) {
    this.objects[name] ??= []
    this.objects[name].push({
      x,
      y,
      z,
      rotation,
      scale,
    })
  }

  public type(x: number, y: number, z: number): number {
    if (!this.chunkStore) return 0

    return this.chunkStore[blockPos(x, y, z)]
  }

  public isSolid(x: number, y: number, z: number): boolean {
    if (!this.chunkStore) return false

    return this.chunkStore[blockPos(x, y, z)] > 0
  }

  public isOpaque(x: number, y: number, z: number): boolean {
    if (!this.chunkStore) return false

    return this.chunkStore[blockPos(x, y, z)] > 0
  }

  public serialize(): ChunkData {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      objects: this.objects,
      data: this.chunkStore,
      solidCount: this.solidCount
    }
  }
}
