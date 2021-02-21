import Vue from 'vue'
import Game from '../../Game'
import Player from '../Player'
import World from '../World'

type Component = ReturnType<typeof Vue.extend>

export default class Hud {
  private static root: HTMLDivElement
  private static vue: Component
  private static gameData = {
    player: null,
  }

  public static async init() {
    this.root = document.createElement('div')
    document.body.appendChild(this.root)

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
  }

  public static addComponent(component: Component) {
    this.vue.components.push(component)
  }
}
