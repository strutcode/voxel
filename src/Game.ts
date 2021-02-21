import Renderer from './engine/graphics/Renderer'
import Physics from './engine/physics/Physics'
import Vector from './engine/math/Vector'
import World from './engine/World'
import Player from './engine/Player'
import Input from './engine/ui/Input'
import Hud from './engine/ui/Hud'
import Database from './engine/Database'

import Debug from './ui/Debug.vue'
import Inventory from './ui/Inventory.vue'
import Compass from './ui/Compass.vue'
import Reticle from './ui/Reticle.vue'

import blockInfo from './data/blockInfo'
import itemInfo from './data/itemInfo'

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

  // Chrome???
  // https://stackoverflow.com/questions/17382321/requestanimationframe-garbage-collection
  private static updateA = (() => Game.update(Game.updateB)).bind(Game)
  private static updateB = (() => Game.update(Game.updateA)).bind(Game)

  public static async start() {
    await Renderer.init()
    await Physics.init()
    await Input.init()
    await Hud.init()
    await Database.init(blockInfo, itemInfo)

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
    Hud.addComponent(Debug)
    Hud.addComponent(Inventory)
    Hud.addComponent(Compass)
    Hud.addComponent(Reticle)

    requestAnimationFrame(this.updateA)
  }

  public static update(next: () => void) {
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
          // TODO: needs to become data somehow
          switch (block) {
            case 1:
              this.player.addItem(0)
              this.player.addItem(1, 2)
              break
            case 2:
              this.player.addItem(3, 3)
              break
            case 3:
              this.player.addItem(4, 3)
              break
          }

          this.world.setBlock(targetBlock.x, targetBlock.y, targetBlock.z, 0)
        }
      }

      this.world.updateView(Renderer.getViewPosition(), new Vector())
      Physics.update()
      Renderer.render()
      Input.endFrame()
    }

    requestAnimationFrame(next)
  }
}

Object.assign(globalThis, {
  Input,
  Physics,
  Renderer,
  Game,
})
