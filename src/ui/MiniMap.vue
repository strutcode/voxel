<template>
  <div class="minimap" v-show="gameData.showMap">
    <div class="marker" :style="markerStyle">⌫</div>
    <canvas ref="map"></canvas>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

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
        transform: `rotate(${this.gameData.player.yaw + Math.PI / 2}rad)`
      }
    },
  },

  methods: {
    update() {
      if (!this.gameData.map) return

      const source: HTMLCanvasElement = this.gameData.map.canvas
      const dest: HTMLCanvasElement = this.$refs.map

      const ctxA = source.getContext('2d')
      const ctxB = dest.getContext('2d')
  
      dest.width = source.width
      dest.height = source.height
  
      if (ctxA && ctxB) {
        ctxB.putImageData(ctxA.getImageData(0, 0, source.width, source.height), 0, 0)
      }
    }
  },

  watch: {
    'gameData.map'() {
      this.update()
    }
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