import { BiomeInfo } from '../engine/Database'

export default {
  0: {
    name: 'missing',
    color: {
      r: 255,
      g: 0,
      b: 255,
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
      r: 222,
      g: 222,
      b: 245,
    },
  },
  4: {
    name: 'tundra',
    color: {
      r: 180,
      g: 180,
      b: 202,
    },
  },
  5: {
    name: 'desert',
    color: {
      r: 237,
      g: 236,
      b: 161,
    },
  },
  6: {
    name: 'corruption',
    color: {
      r: 97,
      g: 66,
      b: 93,
    },
  },
  7: {
    name: 'ocean',
    color: {
      r: 17,
      g: 49,
      b: 154,
    },
  },
} as Record<number, BiomeInfo>
