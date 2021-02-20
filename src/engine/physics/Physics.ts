import BabylonImplementation from '../external/BabylonImplementation'
import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'
import Player from '../Player'
import Vector from '../math/Vector'

export default class Physics {
  private static aimedBlock: Vector | null = new Vector()

  public static async init() {
    await BabylonImplementation.init()
  }

  public static update() {
    this.updateAimedVoxel()
  }

  public static addChunk(chunk: Chunk) {
    BabylonImplementation.physicsAddChunk(chunk)
  }

  public static updateChunk(chunk: Chunk) {
    BabylonImplementation.physicsUpdateChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    BabylonImplementation.physicsRemChunk(chunk)
  }

  public static addPlayer(player: Player) {
    BabylonImplementation.physicsAddPlayer(player)
  }

  public static syncPlayer(player: Player) {
    BabylonImplementation.physicsSyncPlayer(player)
  }

  public static updateAimedVoxel() {
    this.aimedBlock = BabylonImplementation.physicsGetAimedVoxel()
  }

  public static getAimedVoxel() {
    return this.aimedBlock
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
