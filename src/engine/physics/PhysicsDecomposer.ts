import Chunk from '../voxel/Chunk'

interface Cube {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export default class PhysicsDecomposer {
  public static boxDecomposition(chunk: Chunk): Cube[] {
    if (chunk.isEmpty) {
      return []
    }

    if (chunk.isFull) {
      return [
        {
          minX: 0,
          minY: 0,
          minZ: 0,
          maxX: Chunk.size,
          maxY: Chunk.size,
          maxZ: Chunk.size,
        },
      ]
    }

    return []
  }
}
