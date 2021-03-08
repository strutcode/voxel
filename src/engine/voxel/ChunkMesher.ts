import Database from '../Database'
import Chunk from './Chunk'

interface ChunkMesh {
  positions: ArrayBuffer
  indices: ArrayBuffer
  uvs: ArrayBuffer
  colors: ArrayBuffer
  normals: ArrayBuffer
  texInds: ArrayBuffer
}

export default class ChunkMesher {
  public static createMesh(chunk: Chunk): ChunkMesh {
    const start = performance.now()
    let x,
      y,
      z,
      block,
      v = 0,
      k,
      n,
      e,
      s,
      w,
      u,
      d

    const positions: number[] = []
    const indices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const cols: number[] = []
    const texInd: number[] = []

    const aoShade = (side1, corner, side2) => {
      if (side1 && side2) {
        return 0
      }

      if (corner && (side1 || side2)) {
        return 85
      }

      if (corner || side1 || side2) {
        return 170
      }

      return 255
    }

    for (y = 0; y < Chunk.size; y++) {
      for (z = 0; z < Chunk.size; z++) {
        for (x = 0; x < Chunk.size; x++) {
          k = chunk.isOpaque(x, y, z)

          if (k) {
            block = Database.blockInfo(chunk.get(x, y, z))
            n = chunk.isOpaque(x, y, z + 1)
            e = chunk.isOpaque(x + 1, y, z)
            s = chunk.isOpaque(x, y, z - 1)
            w = chunk.isOpaque(x - 1, y, z)
            u = chunk.isOpaque(x, y + 1, z)
            d = chunk.isOpaque(x, y - 1, z)

            if (!block?.textureIndex) continue

            // +X
            if (x == Chunk.size - 1 || !e) {
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
              uvs.push(0, 1, 1, 1, 1, 0, 0, 0)
              cols.push(200, 200, 200, 200)
              normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.posX,
                  block.textureIndex.posX,
                  block.textureIndex.posX,
                  block.textureIndex.posX,
                )
              }

              v += 4
            }
            // -X
            if (x == 0 || !w) {
              positions.push(x, y, z, x, y, z + 1, x, y + 1, z + 1, x, y + 1, z)
              indices.push(v + 3, v + 1, v, v + 3, v + 2, v + 1)
              uvs.push(0, 1, 1, 1, 1, 0, 0, 0)
              cols.push(200, 200, 200, 200)
              normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.negX,
                  block.textureIndex.negX,
                  block.textureIndex.negX,
                  block.textureIndex.negX,
                )
              }

              v += 4
            }
            // +Z
            if (z == Chunk.size - 1 || !n) {
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
              uvs.push(0, 0, 1, 0, 1, 1, 0, 1)
              cols.push(200, 200, 200, 200)
              normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.posZ,
                  block.textureIndex.posZ,
                  block.textureIndex.posZ,
                  block.textureIndex.posZ,
                )
              }

              v += 4
            }
            // -Z
            if (z == 0 || !s) {
              positions.push(x, y, z, x + 1, y, z, x + 1, y + 1, z, x, y + 1, z)
              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)
              uvs.push(0, 1, 1, 1, 1, 0, 0, 0)
              cols.push(200, 200, 200, 200)
              normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.negZ,
                  block.textureIndex.negZ,
                  block.textureIndex.negZ,
                  block.textureIndex.negZ,
                )
              }

              v += 4
            }
            // +Y
            if (y == Chunk.size - 1 || !u) {
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
              uvs.push(0, 0, 1, 0, 1, 1, 0, 1)
              cols.push(255, 255, 255, 255)
              normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.posY,
                  block.textureIndex.posY,
                  block.textureIndex.posY,
                  block.textureIndex.posY,
                )
              }

              v += 4
            }
            // -Y
            if (y == 0 || !d) {
              positions.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x + 1, y, z)
              indices.push(v, v + 1, v + 3, v + 1, v + 2, v + 3)
              uvs.push(0, 0, 1, 0, 1, 1, 0, 1)
              cols.push(177, 177, 177, 177)
              normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0)

              if (typeof block.textureIndex === 'number') {
                texInd.push(
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                  block.textureIndex,
                )
              } else {
                texInd.push(
                  block.textureIndex.negY,
                  block.textureIndex.negY,
                  block.textureIndex.negY,
                  block.textureIndex.negY,
                )
              }

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
      uvs: new Int8Array(uvs),
      colors: new Uint8Array(cols),
      normals: new Uint8Array(normals),
      texInds: new Uint32Array(texInd),
    }
  }
}
