export interface BiomeInfo {
  name: string
  color: {
    r: number
    g: number
    b: number
  }
}

type SplitTextureFaces = {
  posX: number
  negX: number
  posY: number
  negY: number
  posZ: number
  negZ: number
}

export interface BlockInfo {
  name: string
  solid: boolean
  opaque: boolean
  textureIndex?: number | SplitTextureFaces
}

export interface ItemInfo {
  name: string
  iconIndex: number
}

export default class Database {
  private static biomeData: Record<number, BiomeInfo> = {}
  private static blockData: Record<number, BlockInfo> = {}
  private static itemData: Record<number, ItemInfo> = {}

  private static biomeNameMap: Record<string, number> = {}
  private static blockNameMap: Record<string, number> = {}

  public static async init(
    biomeData: typeof Database.biomeData,
    blockData: typeof Database.blockData,
    itemData: typeof Database.itemData,
  ) {
    this.biomeData = biomeData
    this.blockData = blockData
    this.itemData = itemData

    Object.entries(this.biomeData).forEach(keyValue => {
      this.biomeNameMap[keyValue[1]?.name] = +keyValue[0]
    })

    Object.entries(blockData).forEach(keyValue => {
      this.blockNameMap[keyValue[1]?.name] = +keyValue[0]
    })
  }

  public static biomeInfo(id: number) {
    return this.biomeData[id]
  }

  public static blockInfo(id: number) {
    return this.blockData[id]
  }

  public static itemInfo(id: number) {
    return this.itemData[id]
  }

  public static biomeId(name: string): number | undefined {
    return this.biomeNameMap[name]
  }

  public static blockId(name: string): number | undefined {
    return this.blockNameMap[name]
  }
}
