<template>
  <div class="panel">
    <div>X: {{ loc.x }}</div>
    <div>Y: {{ loc.y }}</div>
    <div>Z: {{ loc.z }}</div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    computed: {
      loc() {
        return this.gameData.player?.position ?? { x: 0, y: 0, z: 0 }
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .panel
    font-size: 18pt
    display: inline-block
    padding: 0.5em 1em
    background: #eee
</style>
