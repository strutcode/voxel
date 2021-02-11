import { Vector3 } from '@babylonjs/core'
import Chunk from './engine/Chunk'
import Renderer from './engine/Renderer'
import World from './engine/World'
import Ammo from 'ammo.js/builds/ammo.js'

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

  public static async start() {
    await Renderer.init()

    this.world = new World()
    ;(globalThis as any).options = {
      set viewDistance(num: number) {
        World.viewDistance = num
      },
    }
  }

  public static update() {
    if (this.state === GameState.Play) {
      this.world.updateView(Renderer.getViewPosition(), Vector3.Zero())
    }
  }
}
