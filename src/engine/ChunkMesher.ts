import Chunk from './Chunk'

interface ChunkMesh {
  positions: ArrayBuffer
  indices: ArrayBuffer
  normals: ArrayBuffer
}

export default class ChunkMesher {
  public static createMesh(chunk: Chunk): ChunkMesh {
    const start = performance.now()
    let x,
      y,
      z,
      v = 0

    const positions: number[] = []
    const indices: number[] = []
    const normals: number[] = []

    for (y = 0; y < Chunk.size; y++) {
      for (z = 0; z < Chunk.size; z++) {
        for (x = 0; x < Chunk.size; x++) {
          if (chunk.isOpaque(x, y, z)) {
            // +X
            if (x == Chunk.size - 1 || !chunk.isOpaque(x + 1, y, z)) {
              positions.push(
                x + 1,
                y,
                z,
                x + 1,
                y,
                z + 1,
                x + 1,
                y + 1,
                z + 1,
                x + 1,
                y + 1,
                z,
              )

              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)

              normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0)

              v += 4
            }
            // -X
            if (x == 0 || !chunk.isOpaque(x - 1, y, z)) {
              positions.push(x, y, z, x, y, z + 1, x, y + 1, z + 1, x, y + 1, z)

              indices.push(v + 3, v + 1, v, v + 3, v + 2, v + 1)

              normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0)

              v += 4
            }
            // +Z
            if (z == Chunk.size - 1 || !chunk.isOpaque(x, y, z + 1)) {
              positions.push(
                x,
                y + 1,
                z + 1,
                x + 1,
                y + 1,
                z + 1,
                x + 1,
                y,
                z + 1,
                x,
                y,
                z + 1,
              )

              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)

              normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1)

              v += 4
            }
            // -Z
            if (z == 0 || !chunk.isOpaque(x, y, z - 1)) {
              positions.push(x, y, z, x + 1, y, z, x + 1, y + 1, z, x, y + 1, z)

              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)

              normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)

              v += 4
            }
            // +Y
            if (y == Chunk.size - 1 || !chunk.isOpaque(x, y + 1, z)) {
              positions.push(
                x,
                y + 1,
                z,
                x + 1,
                y + 1,
                z,
                x + 1,
                y + 1,
                z + 1,
                x,
                y + 1,
                z + 1,
              )

              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)

              normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0)

              v += 4
            }
            // -Y
            if (y == 0 || !chunk.isOpaque(x, y - 1, z)) {
              positions.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x + 1, y, z)

              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)

              normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0)

              v += 4
            }
          }
        }
      }
    }

    const end = performance.now()

    // TODO: performance monitor

    return {
      positions: new Uint8Array(positions),
      indices: new Uint32Array(indices),
      normals: new Int8Array(normals),
    }
  }
}
