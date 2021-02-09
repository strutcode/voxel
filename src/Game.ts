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

    const addChunk = (x: number, y: number, z: number) => {
      const chunk = new Chunk(x, y, z)
      chunk.randomize()
      Renderer.newChunk(chunk)
    }

    for (let x = 0; x < 32; x++) {
      for (let z = 0; z < 32; z++) {
        addChunk(x, 0, z)
      }
    }

    this.world = new World()
  }

  public static update() {
    if (this.state === GameState.Play) {
      this.world.updateView()
    }
  }
}
