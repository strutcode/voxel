<template>
  <div class="minimap" v-show="gameData.showMap">
    <div class="marker" :style="markerStyle">⌫</div>
    <canvas ref="map"></canvas>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import WorldMap from '../engine/WorldMap'

  export default Vue.extend({
    mounted() {
      this.update()
    },

    computed: {
      markerStyle() {
        const { player, map } = this.gameData
        const x = (player.position.x / map.width) * 100
        const y = 100 - (player.position.z / map.height) * 100

        return {
          top: `${y < 0 ? 100 + y : y % 100}%`,
          left: `${x < 0 ? 100 + x : x % 100}%`,
          transform: `rotate(${this.gameData.player.yaw + Math.PI / 2}rad)`,
        }
      },
    },

    methods: {
      update() {
        if (!this.gameData.map) return

        const map = this.gameData.map as WorldMap
        const rgba = new Uint8ClampedArray(map.width * map.height * 4)
        const canvas = this.$refs.map as HTMLCanvasElement

        // Match the map dimensions
        canvas.width = map.width
        canvas.height = map.height

        let x, y, i, r, g, b

        // Iterate over the 2d map
        for (y = 0; y < map.height; y++) {
          for (x = 0; x < map.width; x++) {
            // Get the image data index, accounting for each pixel comprising 4 values
            i = ((map.height - y - 1) * map.width + x) * 4
            r = g = b = 0

            // Convert biome codes to colors
            switch (map.biomeAt(x, y)) {
              case 0:
                break
              case 1:
                r = 237
                g = 236
                b = 161
                break
              case 2:
                r = 46
                g = 119
                b = 41
                break
              case 3:
                r = 17
                g = 49
                b = 154
                break
              case 4:
                r = g = b = 200
                b = 222
                break
            }

            // Set the pixel
            rgba[i + 0] = r
            rgba[i + 1] = g
            rgba[i + 2] = b
            rgba[i + 3] = 255
          }
        }

        // Draw the result to the canvas
        const ctx = canvas.getContext('2d')

        if (ctx) {
          const img = new ImageData(rgba, map.width, map.height)
          ctx.putImageData(img, 0, 0)
        }
      },
    },

    watch: {
      'gameData.map'() {
        this.update()
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .minimap
    position: absolute
    bottom: 0
    right: 0
    width: 45vw
    border: 8px ridge #ddd
    font-size: 0

    canvas
      width: 100%
      image-rendering: pixelated
      opacity: 0.9

    .marker
      position: absolute
      top: 50%
      left: 50%
      transform: translate(-50%, -50%)
      color: white
      font: 16px sans-serif
      text-shadow: 0 0 5px black, 0 0 3px black, 0 0 2px black
      z-index: +1
      transform-origin: 60% 60%
</style>
