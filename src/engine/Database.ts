export interface BlockInfo {
  id: number
  solid: boolean
  opaque: boolean
  textureIndex: {
    posX: number
    negX: number
    posY: number
    negY: number
    posZ: number
    negZ: number
  }
}

export default class Database {
  public static voxelInfo(id: number) {}
}
