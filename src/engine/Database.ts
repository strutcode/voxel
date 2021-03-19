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

export interface ObjectInfo {
  modelName?: string
  colliders: {
    x: number
    y: number
    z: number
    sizeX: number
    sizeY: number
    sizeZ: number
  }[]
}

export default class Database {
  private static biomeData: Record<number, BiomeInfo> = {}
  private static blockData: Record<number, BlockInfo> = {}
  private static itemData: Record<number, ItemInfo> = {}
  private static objectData: Record<string, ObjectInfo> = {}

  private static biomeNameMap: Record<string, number> = {}
  private static blockNameMap: Record<string, number> = {}
  private static itemNameMap: Record<string, number> = {}

  public static async init(
    biomeData: typeof Database.biomeData,
    blockData: typeof Database.blockData,
    itemData: typeof Database.itemData,
    objectData: typeof Database.objectData,
  ) {
    this.biomeData = biomeData
    this.blockData = blockData
    this.itemData = itemData
    this.objectData = objectData

    Object.entries(biomeData).forEach(keyValue => {
      this.biomeNameMap[keyValue[1]?.name] = +keyValue[0]
    })

    Object.entries(blockData).forEach(keyValue => {
      this.blockNameMap[keyValue[1]?.name] = +keyValue[0]
    })

    Object.entries(itemData).forEach(keyValue => {
      this.itemNameMap[keyValue[1]?.name] = +keyValue[0]
    })
  }

  public static biomeInfo(id: number) {
    return this.biomeData[id] ?? this.biomeData[0]
  }

  public static blockInfo(id: number) {
    return this.blockData[id] ?? this.blockData[0]
  }

  public static itemInfo(id: number) {
    return this.itemData[id] ?? this.itemData[0]
  }

  public static objectInfo(id: string) {
    return this.objectData[id] ?? this.objectData['none']
  }

  public static biomeId(name: string): number {
    return this.biomeNameMap[name] ?? 0
  }

  public static blockId(name: string): number {
    return this.blockNameMap[name] ?? 0
  }

  public static itemId(name: string): number {
    return this.itemNameMap[name] ?? 0
  }
}
