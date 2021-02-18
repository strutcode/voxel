import Renderer from './engine/Renderer'
import Vector from './engine/Vector'
import World from './engine/World'

enum GameState {
  Play,
}

export default class Game {
  public static speedHz = 30
  public static state: GameState = GameState.Play
  public static world: World

  private static boundUpdate = Game.update.bind(Game)

  public static async start() {
    await Renderer.init()

    this.world = new World()
    ;(globalThis as any).options = {
      set viewDistance(num: number) {
        World.viewDistance = num
      },
    }

    requestAnimationFrame(this.boundUpdate)
  }

  public static update() {
    if (this.state === GameState.Play) {
      this.world.updateView(Renderer.getViewPosition(), new Vector())
    }

    requestAnimationFrame(this.boundUpdate)
  }
}
