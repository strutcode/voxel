import { BlockInfo } from '../engine/Database'

export default {
  0: {
    name: 'air',
    opaque: false,
    solid: false,
  },
  1: {
    name: 'sand',
    opaque: true,
    solid: true,
    textureIndex: 4,
  },
  2: {
    name: 'snow',
    opaque: true,
    solid: true,
    textureIndex: 5,
  },
  3: {
    name: 'water',
    opaque: false,
    solid: false,
    textureIndex: 6,
  },
  4: {
    name: 'lime',
    opaque: true,
    solid: true,
    textureIndex: 7,
  },
  5: {
    name: 'marble',
    opaque: true,
    solid: true,
    textureIndex: 8,
  },
  6: {
    name: 'granite',
    opaque: true,
    solid: true,
    textureIndex: 9,
  },
  7: {
    name: 'slate',
    opaque: true,
    solid: true,
    textureIndex: 10,
  },
  8: {
    name: 'peat',
    opaque: true,
    solid: true,
    textureIndex: 11,
  },
  10: {
    name: 'clay',
    opaque: true,
    solid: true,
    textureIndex: 12,
  },
  11: {
    name: 'silt',
    opaque: true,
    solid: true,
    textureIndex: 13,
  },
  12: {
    name: 'chalk',
    opaque: true,
    solid: true,
    textureIndex: 14,
  },
  13: {
    name: 'loam',
    opaque: true,
    solid: true,
    textureIndex: 15,
  },
  99: {
    name: 'grass',
    opaque: false,
    solid: false,
    textureIndex: {
      posY: 0,
      negY: 2,
      negX: 1,
      posX: 1,
      negZ: 1,
      posZ: 1,
    },
  },
} as Record<number, BlockInfo>
