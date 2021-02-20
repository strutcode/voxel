import { BlockInfo } from './engine/Database'

export default {
  0: {
    name: 'air',
    opaque: false,
    solid: false,
  },
  1: {
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
