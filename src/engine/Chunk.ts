import Block from './Block'

const blockPos = (x: number, y: number, z: number) =>
  Math.floor((y * Chunk.squareSize + z * Chunk.size + x) / 32)

export default class Chunk {
  public static size = 32
  public static squareSize = Chunk.size ** 2
  public static cubeSize = Chunk.size ** 3

  private solidStore = new Uint32Array(Chunk.cubeSize / 32)
  private opaqueStore = new Uint32Array(Chunk.cubeSize / 32)

  constructor(public x = 0, public y = 0, public z = 0) {}

  public get(x: number, y: number, z: number): Block {
    return {}
  }

  public set(x: number, y: number, z: number, block: Block) {}

  public randomize() {
    for (let i = 0; i < this.solidStore.length; i++) {
      this.solidStore[i] = this.opaqueStore[i] = Math.floor(
        Math.random() * 2 ** 32,
      )
    }
  }

  public isSolid(x: number, y: number, z: number): boolean {
    return (this.solidStore[blockPos(x, y, z)] & (1 << x % 31)) > 0
  }

  public isOpaque(x: number, y: number, z: number): boolean {
    return (this.opaqueStore[blockPos(x, y, z)] & (1 << x % 31)) > 0
  }
}
