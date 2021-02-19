import BabylonImplementation from '../external/BabylonImplementation'
import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'

export default class Physics {
  public static async init() {
    await BabylonImplementation.init()
  }

  public static update() {}

  public static addChunk(chunk: Chunk) {
    BabylonImplementation.physicsAddChunk(chunk)
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

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
