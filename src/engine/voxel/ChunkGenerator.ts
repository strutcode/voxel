import noise from 'asm-noise'
import { lerp } from '../math/Interpolation'
import WorldMap from '../WorldMap'
import Chunk from './Chunk'

export default class ChunkGenerator {
  public randomize(chunk: Chunk) {
    for (let y = 0; y < Chunk.size; y++) {
      for (let z = 0; z < Chunk.size; z++) {
        for (let x = 0; x < Chunk.size; x++) {
          chunk.set(x, y, z, Math.round(Math.random()))
        }
      }
    }
  }

  public perlin(chunk: Chunk) {
    for (let z = 0; z < Chunk.size; z++) {
      for (let x = 0; x < Chunk.size; x++) {
        const terrain =
          noise(
            (chunk.x * Chunk.size + x) / 44,
            (chunk.z * Chunk.size + z) / 44,
          ) *
          noise(
            (chunk.x * Chunk.size + x) / 128,
            (chunk.z * Chunk.size + z) / 128,
          )
        const height = terrain * (Chunk.size - 1) + 1
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
            chunk.set(x, y, z, 1)
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

  public biome(chunk: Chunk) {
    for (let z = 0; z < Chunk.size; z++) {
      for (let x = 0; x < Chunk.size; x++) {
        let type = 0
        let terrain = 0

        noise.octaves = 8
        const biome = noise(
          (chunk.x * Chunk.size + x) / 1024,
          (chunk.z * Chunk.size + z) / 1024,
        )
        noise.octaves = 1

        const stageSize = 0.33
        const blendAmt = 0.1
        const blendRange = stageSize * blendAmt

        if (biome < 0.33) {
          type = 3
        } else if (biome < 0.66) {
          type = 1
        } else {
          type = 2
        }

        const iceTerrain = () => 0.01
        const grassTerrain = () =>
          noise(
            (chunk.x * Chunk.size + x) / 44,
            (chunk.z * Chunk.size + z) / 44,
          ) *
          noise(
            (chunk.x * Chunk.size + x) / 128,
            (chunk.z * Chunk.size + z) / 128,
          )
        const desertTerrain = () =>
          noise(
            (chunk.x * Chunk.size + x) / 128,
            (chunk.z * Chunk.size + z) / 128,
          )

        if (biome < stageSize - blendRange) {
          terrain = iceTerrain()
        } else if (
          biome >= stageSize - blendRange &&
          biome < stageSize + blendRange
        ) {
          terrain = lerp(
            iceTerrain(),
            grassTerrain(),
            (biome - (stageSize - blendRange)) / (blendRange * 2),
          )
        } else if (
          biome >= stageSize + blendRange &&
          biome < stageSize * 2 - blendRange
        ) {
          terrain = grassTerrain()
        } else if (
          biome >= stageSize * 2 - blendRange &&
          biome < stageSize * 2 + blendRange
        ) {
          terrain = lerp(
            grassTerrain(),
            desertTerrain(),
            (biome - (stageSize * 2 - blendRange)) / (blendRange * 2),
          )
        } else {
          terrain = desertTerrain()
        }

        const height = terrain * (Chunk.size - 1) + 1

        for (let y = 0; y < Chunk.size; y++) {
          if (y <= height) {
            chunk.set(x, y, z, type)
          } else {
            if (type === 1) {
              const tree =
                noise(
                  (chunk.x * Chunk.size + x) / 50,
                  (chunk.z * Chunk.size + z) / 50,
                ) +
                noise(
                  (chunk.x * Chunk.size + x) / 400,
                  (chunk.z * Chunk.size + z) / 400,
                )
              const pumpkin =
                noise(
                  (chunk.x * Chunk.size + x) / 2,
                  (chunk.z * Chunk.size + z) / 2,
                ) +
                noise(
                  100 + (chunk.x * Chunk.size + x) / 100,
                  100 + (chunk.z * Chunk.size + z) / 100,
                )

              if (tree > 1.2 && Math.random() < 0.008) {
                chunk.addObject(
                  'tree',
                  x,
                  y,
                  z,
                  Math.floor(Math.random() * 4) * 90,
                  Math.random() * 0.6 + 0.2,
                )
              } else if (pumpkin > 1.8 && Math.random() < 0.05) {
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
              }
            } else if (type === 2) {
              if (Math.random() < 0.0005) {
                chunk.addObject(
                  'cactus',
                  x,
                  y,
                  z,
                  Math.floor(Math.random() * 4) * 90,
                )
              }
            }

            break
          }
        }
      }
    }
  }

  public overworldBiome(chunk: Chunk, map: WorldMap) {
    let x, y, z, xx, zz

    for (z = 0; z < Chunk.size; z++) {
      for (x = 0; x < Chunk.size; x++) {
        xx = chunk.x * Chunk.size + x
        zz = chunk.z * Chunk.size + z

        const biome = map.biomeAt(xx, zz)
        const type = (() => {
          switch (biome) {
            case 1:
              return 2
            case 2:
              return 1
            case 3:
              return 4
            case 4:
              return 3
            default:
              return 0
          }
        })()

        for (y = 0; y < map.depthAt(xx, zz); y++) {
          chunk.set(x, y, z, type)
        }
      }
    }
  }
}
