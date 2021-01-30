import { VertexData } from '@babylonjs/core'
import Chunk from './Chunk'

export default class ChunkMesher {
  public static createMesh(chunk: Chunk): VertexData {
    return VertexData.CreatePlane({})
  }
}
