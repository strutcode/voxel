<template>
  <div class="panel" v-show="gameData.showDebug">
    <div>X: {{ position.x.toFixed(2) }}</div>
    <div>Y: {{ position.y.toFixed(2) }}</div>
    <div>Z: {{ position.z.toFixed(2) }}</div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    computed: {
      position() {
        return this.gameData.position
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
