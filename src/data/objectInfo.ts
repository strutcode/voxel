import { ObjectInfo } from '../engine/Database'

export default {
  none: {
    colliders: []
  },
  cactus: {
    colliders: [
      {
        x: 0,
        y: 1,
        z: 0,
        sizeX: 0.5,
        sizeY: 1,
        sizeZ: 0.5,
      },
    ],
  },
  tree: {
    modelName: 'tree2',
    colliders: [
      {
        x: 0,
        y: 1,
        z: 0,
        sizeX: 0.5,
        sizeY: 1,
        sizeZ: 0.5,
      },
    ],
  },
  tree2: {
    modelName: 'tree2',
    colliders: [
      {
        x: 0,
        y: 1,
        z: 0,
        sizeX: 0.5,
        sizeY: 1,
        sizeZ: 0.5,
      },
    ],
  },
  pumpkin: {
    colliders: [
      {
        x: 0,
        y: 0.5,
        z: 0,
        sizeX: 0.5,
        sizeY: 0.5,
        sizeZ: 0.5,
      },
    ],
  },
} as Record<string, ObjectInfo>
