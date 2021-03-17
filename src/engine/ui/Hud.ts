import Vue from 'vue'
import Game from '../../Game'
import Input from './Input'

type Component = ReturnType<typeof Vue.extend>

Vue.config.productionTip = false
Vue.config.devtools = false

export default class Hud {
  private static root: HTMLDivElement
  private static vue: Component
  private static gameData = {
    player: null,
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    map: null,
    showMap: false,
    showInventory: false,
    showConsole: false,
    showDebug: false,
  }

  public static async init() {
    this.root = document.createElement('div')
    document.body.appendChild(this.root)

    Hud.gameData.player = Game.player
    Hud.gameData.map = Game.world.map

    Vue.mixin({
      data() {
        return {
          gameData: Hud.gameData,
        }
      },
    })

    this.vue = new Vue({
      el: this.root,
      data() {
        return {
          components: [] as Component[],
        }
      },
      render(h) {
        return h(
          'div',
          {
            staticStyle: {
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              zIndex: '+1',
            },
          },
          this.components.map(c => h(c)),
        )
      },
    })
  }

  public static update() {
    Hud.gameData.player = Game.player
    Hud.gameData.map = Game.world.map
    Hud.gameData.position.x = Game.player.position.x
    Hud.gameData.position.y = Game.player.position.y
    Hud.gameData.position.z = Game.player.position.z

    if (Input.getButton('Map')) {
      Hud.gameData.showMap = !Hud.gameData.showMap
    }

    if (Input.getButton('DevConsole')) {
      Hud.gameData.showConsole = !Hud.gameData.showConsole
    }

    if (Input.getButton('DebugOverlay')) {
      Hud.gameData.showDebug = !Hud.gameData.showDebug
    }

    if (Input.getButton('Inventory')) {
      Hud.gameData.showInventory = !Hud.gameData.showInventory

      if (Hud.gameData.showInventory) {
        Input.releasePointer()
      } else {
        Input.capturePointer()
      }
    }
  }

  public static addComponent(component: Component) {
    this.vue.components.push(component)
  }
}
