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
import MiniMap from './ui/MiniMap.vue'
import DevConsole from './ui/DevConsole.vue'
import Reticle from './ui/Reticle.vue'

import biomeInfo from './data/biomeInfo'
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
  public static deltaTimeMs = 0
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
    await Database.init(biomeInfo, blockInfo, itemInfo)

    this.world = new World()
    ;(globalThis as any).options = {
      set viewDistance(num: number) {
        World.viewDistance = num
      },
    }

    this.player = new Player()
    this.player.position.x = this.world.width / 2
    this.player.position.y =
      this.world.map.heightAt(this.world.width / 2, this.world.height / 2) + 2
    this.player.position.z = this.world.height / 2

    await this.world.init()
    await Hud.init()

    Physics.addPlayer(this.player)
    Renderer.addPlayer(this.player)
    Hud.addComponent(Debug)
    Hud.addComponent(Inventory)
    Hud.addComponent(Compass)
    Hud.addComponent(MiniMap)
    Hud.addComponent(DevConsole)
    Hud.addComponent(Reticle)

    requestAnimationFrame(this.updateA)
  }

  public static update(next: () => void) {
    if (this.state === GameState.Play) {
      const time = performance.now()
      this.deltaTimeMs = time - this.lastFrame
      this.deltaTime = this.deltaTimeMs / 1000
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

        const grass = Database.blockId('grass')
        const sand = Database.blockId('sand')
        const snow = Database.blockId('snow')

        if (block) {
          // TODO: needs to become data somehow
          switch (block) {
            case grass:
              this.player.addItem('grass')
              this.player.addItem('dirt', 2)
              break
            case sand:
              this.player.addItem('sand', 3)
              break
            case snow:
              this.player.addItem('snow', 3)
              break
          }

          this.world.setBlock(targetBlock.x, targetBlock.y, targetBlock.z, 0)
        }
      }

      this.world.updateView(Renderer.getViewPosition(), new Vector())
      Physics.update(this.deltaTimeMs)
      Renderer.render()
      Input.endFrame()
    }

    requestAnimationFrame(next)
  }

  public static addItem(name: string, quantity = 1) {
    if (Database.itemId(name) === 0) {
      throw new Error(`No such item: '${name}'`)
    }

    this.player.addItem(name, quantity)
  }
}

Object.assign(globalThis, {
  Input,
  Physics,
  Renderer,
  Game,
  Database,
  Hud,
})
