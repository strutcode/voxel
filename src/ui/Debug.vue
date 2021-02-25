<template>
  <div class="panel" v-show="show">
    <div>X: {{ loc.x.toFixed(2) }}</div>
    <div>Y: {{ loc.y.toFixed(2) }}</div>
    <div>Z: {{ loc.z.toFixed(2) }}</div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    mounted() {
      document.addEventListener('keydown', ev => {
        if (ev.key === '`') {
          this.show = !this.show
        }
      })
    },

    data() {
      return {
        show: false,
      }
    },

    computed: {
      loc() {
        return this.gameData.player?.position ?? { x: 0, y: 0, z: 0 }
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .panel
    font-size: 14pt
    font-family: monospace
    display: inline-block
    padding: 0.5em 1em
    background: #eee
</style>
