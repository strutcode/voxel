// @ts-ignore
import NoiseType, { Noise } from 'noisejs'

import Block from './Block'

const blockPos = (x: number, y: number, z: number) =>
  Math.floor(y * Chunk.squareSize + z * Chunk.size + x)

const noise = new Noise() as NoiseType

type ChunkData = {
  x: number
  y: number
  z: number
  objects: ChunkObject[]
  data: Uint32Array
}

type ChunkObject = {
  x: number
  y: number
  z: number
  scale: number
  name: string
}

export default class Chunk {
  public static size = 32
  public static squareSize = Chunk.size ** 2
  public static cubeSize = Chunk.size ** 3

  public static deserialize(serialized: ChunkData) {
    const chunk = new Chunk(serialized.x, serialized.y, serialized.z, true)
    chunk.objects = serialized.objects
    chunk.chunkStore = serialized.data
    return chunk
  }

  private chunkStore = new Uint32Array(Chunk.cubeSize)
  public objects: ChunkObject[] = []

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
        const tree =
          noise.simplex2(
            (this.x * Chunk.size + x) / 2,
            (this.z * Chunk.size + z) / 2,
          ) *
            2 +
          noise.simplex2(
            (this.x * Chunk.size + x) / 128,
            (this.z * Chunk.size + z) / 128,
          )

        for (let y = 0; y < Chunk.size; y++) {
          if (y <= height) {
            this.set(x, y, z, {
              type: 1,
            })
          } else {
            if (tree > 2.5) {
              this.objects.push({
                x,
                y,
                z,
                scale: Math.random() * 0.8 + 0.6,
                name: 'tree',
              })
            }
            break
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
      objects: this.objects,
      data: this.chunkStore,
    }
  }
}
