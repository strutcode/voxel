import Renderer from './engine/graphics/Renderer'
import Physics from './engine/physics/Physics'
import Vector from './engine/math/Vector'
import World from './engine/World'
import Player from './engine/Player'
import Input from './engine/ui/Input'
import Hud from './engine/ui/Hud'

import Test from './Test.vue'

enum GameState {
  Play,
}

export default class Game {
  public static speedHz = 30
  public static state: GameState = GameState.Play
  public static world: World
  public static player: Player
  public static deltaTime = 0
  private static lastFrame = performance.now()

  private static boundUpdate = Game.update.bind(Game)

  public static async start() {
    await Renderer.init()
    await Physics.init()
    await Input.init()
    await Hud.init()

    this.world = new World()
    ;(globalThis as any).options = {
      set viewDistance(num: number) {
        World.viewDistance = num
      },
    }

    this.player = new Player()
    this.player.position.y = 42
    Physics.addPlayer(this.player)
    Renderer.addPlayer(this.player)
    Hud.addComponent(Test)

    requestAnimationFrame(this.boundUpdate)
  }

  public static update() {
    if (this.state === GameState.Play) {
      const time = performance.now()
      this.deltaTime = (time - this.lastFrame) / 1000
      this.lastFrame = time

      Input.startFrame()
      this.player.update()
      Physics.syncPlayer(this.player)
      Hud.update()

      const targetBlock = Physics.getAimedVoxel()
      if (Input.getButton('Break') && targetBlock) {
        const block = this.world.getBlock(
          targetBlock.x,
          targetBlock.y,
          targetBlock.z,
        )
        
        if (block) {
          this.world.removeBlock(targetBlock.x, targetBlock.y, targetBlock.z)
          this.player.addItem(block.type)
        }
      }

      this.world.updateView(Renderer.getViewPosition(), new Vector())
      Physics.update()
      Renderer.render()
      Input.endFrame()
    }

    requestAnimationFrame(this.boundUpdate)
  }
}

Object.assign(globalThis, {
  Input,
  Physics,
  Renderer,
  Game,
})
