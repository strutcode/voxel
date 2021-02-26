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
  14: {
    name: 'grass',
    opaque: true,
    solid: true,
    textureIndex: {
      posY: 0,
      negY: 11,
      negX: 11,
      posX: 11,
      negZ: 11,
      posZ: 11,
    },
  },
  15: {
    name: 'tundragrass',
    opaque: true,
    solid: true,
    textureIndex: {
      posY: 2,
      negY: 14,
      negX: 14,
      posX: 14,
      negZ: 14,
      posZ: 14,
    },
  },
  16: {
    name: 'corruptgrass',
    opaque: true,
    solid: true,
    textureIndex: {
      posY: 3,
      negY: 15,
      negX: 15,
      posX: 15,
      negZ: 15,
      posZ: 15,
    },
  },
} as Record<number, BlockInfo>
