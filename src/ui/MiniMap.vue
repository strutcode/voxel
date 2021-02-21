<template>
  <canvas ref="map"></canvas>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  mounted() {
    this.update()
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
  }

  watch: {
    'gameData.map'() {
      this.update()
    }
  },
})
</script>

<style lang="stylus" scoped>
  canvas
    position: absolute
    bottom: 0
    right: 0
    width: 30vw
    image-rendering: pixelated
</style>