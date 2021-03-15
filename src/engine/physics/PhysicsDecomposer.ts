import Chunk from '../voxel/Chunk'
import { Ammo as AmmoType } from 'ammo.js'

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

    const boxes: Cube[] = []
    let x, y, z, u, v, w, nU, nV, nW

    // search x, on solid find longest span on x
    // search y for span of x, if air or visited discord whole row and break
    // repeat for z
    // create box and mark all as visited

    // for (y = 0; y < Chunk.size; y++) {
    //   for (z = 0; z < Chunk.size; z++) {
    //     for (x = 0; x < Chunk.size; x++) {
    //       if (chunk.isSolid(x, y, z)) {
    //         u = x
    //         v = y
    //         w = z
    //         nU = nW = 1

    //         while (u + 1 < Chunk.size && chunk.isSolid(u + 1, v, w)) {
    //           u++
    //           nU++
    //         }

    //         for (w = w + 1; w < Chunk.size; w++) {
    //           for (u = x; u < Chunk.size; u++) {
    //             if (!chunk.isSolid(u, v, w)) {
    //               break
    //             }
    //           }

    //           if (!chunk.isSolid(u, v, w)) {
    //             break
    //           }

    //           nW++
    //         }

    //         boxes.push({
    //           minX: x,
    //           maxX: x + nU,
    //           minY: y,
    //           maxY: y + 1,
    //           minZ: z,
    //           maxZ: z + nW,
    //         })
    //       }
    //     }
    //   }
    // }

    for (x = 0; x < Chunk.size; x++) {
      for (z = 0; z < Chunk.size; z++) {
        for (y = 0; y < Chunk.size; y++) {
          if (chunk.isSolid(x, y, z)) {
            nV = 1

            while (chunk.isSolid(x, y + nV, z)) nV++

            boxes.push({
              minX: x,
              maxX: x + 1,
              minY: y,
              maxY: y + nV,
              minZ: z,
              maxZ: z + 1,
            })

            y += nV
          }
        }
      }
    }

    return boxes
  }

  public static meshDecomposition(chunk: Chunk, Ammo: AmmoType) {
    const mesh = new Ammo.btTriangleMesh()
    const pointA = new Ammo.btVector3()
    const pointB = new Ammo.btVector3()
    const pointC = new Ammo.btVector3()

    let x, y, z
    const add = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      x3: number,
      y3: number,
      z3: number,
    ) => {
      pointA.setValue(x1, y1, z1)
      pointB.setValue(x2, y2, z2)
      pointC.setValue(x3, y3, z3)
      mesh.addTriangle(pointA, pointB, pointC)
    }

    for (x = 0; x < Chunk.size; x++) {
      for (y = 0; y < Chunk.size; y++) {
        for (z = 0; z < Chunk.size; z++) {
          if (chunk.isSolid(x, y, z)) {
            if (!chunk.isSolid(x - 1, y, z)) {
              add(x, y, z, x, y + 1, z, x, y + 1, z + 1)
              add(x, y, z, x, y, z + 1, x, y + 1, z + 1)
            }
            if (!chunk.isSolid(x + 1, y, z)) {
              add(x + 1, y, z, x + 1, y + 1, z, x + 1, y + 1, z + 1)
              add(x + 1, y, z, x + 1, y, z + 1, x + 1, y + 1, z + 1)
            }
            if (!chunk.isSolid(x, y - 1, z)) {
              add(x, y, z, x + 1, y, z, x + 1, y, z + 1)
              add(x, y, z, x, y, z + 1, x + 1, y, z + 1)
            }
            if (!chunk.isSolid(x, y + 1, z)) {
              add(x, y + 1, z, x + 1, y + 1, z + 1, x + 1, y + 1, z)
              add(x, y + 1, z, x, y + 1, z + 1, x + 1, y + 1, z + 1)
            }
            if (!chunk.isSolid(x, y, z - 1)) {
              add(x, y, z, x + 1, y, z, x + 1, y + 1, z)
              add(x, y, z, x, y + 1, z, x + 1, y + 1, z)
            }
            if (!chunk.isSolid(x, y, z + 1)) {
              add(x, y, z + 1, x + 1, y, z + 1, x + 1, y + 1, z + 1)
              add(x, y, z + 1, x, y + 1, z + 1, x + 1, y + 1, z + 1)
            }
          }
        }
      }
    }

    Ammo.destroy(pointA)
    Ammo.destroy(pointB)
    Ammo.destroy(pointC)

    return mesh
  }
}
