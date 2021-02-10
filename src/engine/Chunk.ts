import { Noise } from 'noisejs'

import Block from './Block'

const blockPos = (x: number, y: number, z: number) =>
  Math.floor(y * Chunk.squareSize + z * Chunk.size + x)

const noise = new Noise()

type ChunkData = {
  x: number
  y: number
  z: number
  data: Uint32Array
}

export default class Chunk {
  public static size = 32
  public static squareSize = Chunk.size ** 2
  public static cubeSize = Chunk.size ** 3

  public static deserialize(serialized: ChunkData) {
    const chunk = new Chunk(serialized.x, serialized.y, serialized.z, true)
    chunk.chunkStore = serialized.data
    return chunk
  }

  private chunkStore = new Uint32Array(Chunk.cubeSize)

  constructor(public x = 0, public y = 0, public z = 0, empty = false) {
    if (!empty) this.initialize()
  }

  public get(x: number, y: number, z: number): Block {
    return {
      type: this.chunkStore[blockPos(x, y, z)],
    }
  }

  public set(x: number, y: number, z: number, block: Block) {
    this.chunkStore[blockPos(x, y, z)] = block.type
  }

  private randomize() {
    for (let i = 0; i < this.chunkStore.length; i++) {
      this.chunkStore[i] = Math.round(Math.random())
    }
  }

  private perlin() {
    for (let z = 0; z < Chunk.size; z++) {
      for (let x = 0; x < Chunk.size; x++) {
        const height =
          (noise.simplex2(
            (this.x * Chunk.size + x) / 128,
            (this.z * Chunk.size + z) / 128,
          ) +
            1) *
            0.5 *
            (Chunk.size - 1) +
          1

        for (let y = Chunk.size - 1; y > 0; y--) {
          if (y <= height) {
            this.set(x, y, z, {
              type: 1,
            })
          }
        }
      }
    }
  }

  public initialize() {
    this.perlin()
  }

  public isSolid(x: number, y: number, z: number): boolean {
    return this.chunkStore[blockPos(x, y, z)] > 0
  }

  public isOpaque(x: number, y: number, z: number): boolean {
    return this.chunkStore[blockPos(x, y, z)] > 0
  }

  public serialize(): ChunkData {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      data: this.chunkStore,
    }
  }
}
