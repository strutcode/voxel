import Vue from 'vue'
import Game from '../../Game'

type Component = ReturnType<typeof Vue.extend>

Vue.config.productionTip = false

export default class Hud {
  private static root: HTMLDivElement
  private static vue: Component
  private static gameData = {
    player: null,
    map: null,
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
  }

  public static addComponent(component: Component) {
    this.vue.components.push(component)
  }
}
