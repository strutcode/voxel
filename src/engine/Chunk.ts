import Block from './Block'

const chunkSize = 64
const squareSize = chunkSize ** 2
const cubeSize = chunkSize ** 3
const blockPos = (x: number, y: number, z: number) =>
  Math.floor((y * squareSize + z * chunkSize + x) / 32)

export default class Chunk {
  private solidStore = new Int32Array(cubeSize / 32)
  private opaqueStore = new Int32Array(cubeSize / 32)

  constructor() {}

  public get(x: number, y: number, z: number): Block {
    return {}
  }

  public set(x: number, y: number, z: number, block: Block) {}

  public isSolid(x: number, y: number, z: number): boolean {
    return (this.solidStore[blockPos(x, y, z)] & (1 << x % 32)) > 0
  }

  public isOpaque(x: number, y: number, z: number): boolean {
    return (this.opaqueStore[blockPos(x, y, z)] & (1 << x % 32)) > 0
  }
}
