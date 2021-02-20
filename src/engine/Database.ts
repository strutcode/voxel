export interface BlockInfo {
  name: string
  solid: boolean
  opaque: boolean
  textureIndex?: {
    posX: number
    negX: number
    posY: number
    negY: number
    posZ: number
    negZ: number
  }
}

export interface ItemInfo {
  name: string
  iconIndex: number
}

export default class Database {
  private static blockData: Record<number, BlockInfo> = {}
  private static itemData: Record<number, ItemInfo> = {}

  public static async init(
    blockData: typeof Database.blockData,
    itemData: typeof Database.itemData,
  ) {
    this.blockData = blockData
    this.itemData = itemData
  }

  public static blockInfo(id: number) {
    return this.blockData[id]
  }

  public static itemInfo(id: number) {
    return this.itemData[id]
  }
}
