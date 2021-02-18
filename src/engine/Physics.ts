import BabylonImplementation from './BabylonImplementation'
import Chunk from './Chunk'
import Mobile from './Mobile'

export default class Physics {
  public static addChunk(chunk: Chunk) {
    BabylonImplementation.physicsAddChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    BabylonImplementation.physicsRemChunk(chunk)
  }
}
