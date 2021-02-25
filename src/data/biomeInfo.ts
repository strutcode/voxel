import { BiomeInfo } from '../engine/Database'

export default {
  0: {
    name: 'ocean',
    color: {
      r: 17,
      g: 49,
      b: 154,
    },
  },
  1: {
    name: 'grassland',
    color: {
      r: 46,
      g: 119,
      b: 41,
    },
  },
  2: {
    name: 'beach',
    color: {
      r: 237,
      g: 236,
      b: 161,
    },
  },
  3: {
    name: 'arctic',
    color: {
      r: 200,
      g: 200,
      b: 222,
    },
  },
  4: {
    name: 'tundra',
    color: {
      r: 200,
      g: 200,
      b: 222,
    },
  },
} as Record<number, BiomeInfo>
