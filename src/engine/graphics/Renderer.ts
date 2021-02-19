import BabylonImplementation from '../external/BabylonImplementation'
import Chunk from '../voxel/Chunk'
import Vector from '../math/Vector'
import Player from '../Player'
import Game from '../../Game'

export default class Renderer {
  private static viewPos = new Vector()

  public static async init() {
    await BabylonImplementation.init()
  }

  public static render() {
    BabylonImplementation.setViewPosition(Game.player)
    BabylonImplementation.render()
  }

  public static setAimedVoxel(target: Vector | null) {
    BabylonImplementation.setAimedVoxel(target)
  }

  public static async addChunk(chunk: Chunk) {
    await BabylonImplementation.renderAddChunk(chunk)
  }

  public static async remChunk(chunk: Chunk) {
    await BabylonImplementation.renderRemChunk(chunk)
  }

  public static addPlayer(player: Player) {
    BabylonImplementation.renderAddPlayer(player)
  }

  public static getViewPosition() {
    BabylonImplementation.getViewPosition().toArray(this.viewPos['storage'])
    return this.viewPos
  }
}
