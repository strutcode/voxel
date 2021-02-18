import BabylonImplementation from './BabylonImplementation'
import Chunk from './Chunk'
import Vector from './Vector'

export default class Renderer {
  private static viewPos = new Vector()

  public static async init() {
    await BabylonImplementation.init()
  }

  public static async addChunk(chunk: Chunk) {
    await BabylonImplementation.renderAddChunk(chunk)
  }

  public static async remChunk(chunk: Chunk) {
    await BabylonImplementation.renderRemChunk(chunk)
  }

  public static getViewPosition() {
    BabylonImplementation.getViewPosition().toArray(this.viewPos['storage'])
    return this.viewPos
  }
}
