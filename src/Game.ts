import Chunk from './engine/Chunk'
import Renderer from './engine/Renderer'
import World from './engine/World'

enum GameState {
  Play,
}

export default class Game {
  public static speedHz = 30
  public static state: GameState = GameState.Play
  public static world: World

  private static mainLoop = setInterval(
    Game.update.bind(Game),
    1000 / Game.speedHz,
  )

  public static start() {
    Renderer.init()

    const chunk = new Chunk()
    chunk.randomize()
    Renderer.newChunk(chunk)

    this.world = new World()
  }

  public static update() {
    if (this.state === GameState.Play) {
      this.world.updateView()
    }
  }
}
