import noise from 'asm-noise'
import Chunk from './Chunk'

export default class ChunkGenerator {
  public randomize(chunk: Chunk) {
    for (let y = 0; y < Chunk.size; y++) {
      for (let z = 0; z < Chunk.size; z++) {
        for (let x = 0; x < Chunk.size; x++) {
          chunk.set(x, y, z, {
            type: Math.round(Math.random()),
          })
        }
      }
    }
  }

  public perlin(chunk: Chunk) {
    for (let z = 0; z < Chunk.size; z++) {
      for (let x = 0; x < Chunk.size; x++) {
        const terrain =
          noise(
            (chunk.x * Chunk.size + x) / 88,
            (chunk.z * Chunk.size + z) / 88,
          ) *
          noise(
            (chunk.x * Chunk.size + x) / 272,
            (chunk.z * Chunk.size + z) / 272,
          )
        const height = (terrain + 1) * 0.5 * (Chunk.size - 1) + 1
        const tree =
          noise(
            (chunk.x * Chunk.size + x) / 50,
            (chunk.z * Chunk.size + z) / 50,
          ) *
            2 +
          noise(
            (chunk.x * Chunk.size + x) / 400,
            (chunk.z * Chunk.size + z) / 400,
          )
        const pumpkin =
          noise(
            (chunk.x * Chunk.size + x) / 2,
            (chunk.z * Chunk.size + z) / 2,
          ) *
            2 +
          noise(
            100 + (chunk.x * Chunk.size + x) / 100,
            100 + (chunk.z * Chunk.size + z) / 100,
          )

        for (let y = 0; y < Chunk.size; y++) {
          if (y <= height) {
            chunk.set(x, y, z, {
              type: 1,
            })
          } else {
            if (tree > 1.5 && Math.random() < 0.05) {
              chunk.addObject(
                'tree',
                x,
                y,
                z,
                Math.floor(Math.random() * 4) * 90,
                Math.random() * 0.6 + 0.2,
              )
            } else if (pumpkin > 2.5) {
              chunk.addObject(
                'pumpkin',
                x,
                y,
                z,
                Math.random() * 360,
                Math.random() * 0.4 + 0.6,
              )
            } else if (Math.random() < 0.0005) {
              const animals = ['fox', 'ocelot']

              chunk.addObject(
                animals[Math.floor(Math.random() * animals.length)],
                x,
                y,
                z,
              )
            } else if (Math.random() < 0.5) {
              chunk.addObject('grass2', x, y, z, Math.random() * 360)
            }

            break
          }
        }
      }
    }
  }
}
