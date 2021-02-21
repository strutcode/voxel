<template>
  <div class="compass">
    <div class="dial" :style="dialStyle">
      <div class="section">
        <div class="label">W</div>
      </div>
      <div class="section">
        <div class="label">N</div>
      </div>
      <div class="section">
        <div class="label">E</div>
      </div>
      <div class="section">
        <div class="label">S</div>
      </div>
      <div class="section">
        <div class="label">W</div>
      </div>
      <div class="section">
        <div class="label">N</div>
      </div>
    </div>
    <div class="pointer"></div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    computed: {
      heading() {
        const yaw = this.gameData.player?.yaw ?? 0
        const revolution = Math.PI * 2
        const result = yaw / revolution

        return result < 0 ? 1 + result : result
      },
      dialStyle() {
        const sectionWidth = 800

        return {
          transform: `translateX(-${(this.heading + 0.25) *
            (sectionWidth * 4)}px)`,
        }
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .compass
    position: absolute
    width: 50%
    height: 4vh
    top: 0
    left: 50%
    transform: translateX(-50%)
    background: #bbb
    overflow: hidden
    border: 8px ridge #ddd

    .dial
      position: absolute
      top: 0
      left: 50%
      display: flex
      flex-flow: row nowrap

      .section
        position: relative
        width: 800px
        height: 4vh
        background-image: url('data:image/svg+xml,%3Csvg width="804" height="51" viewBox="0 0 804 51" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="2" height="50" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="802" width="2" height="50" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="400" y="13" width="4" height="37.5" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="452" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="50" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="502" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="100" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="552" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="150" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="602" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="200" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="652" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="250" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="702" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="300" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="752" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3Crect x="350" y="25" width="2" height="25" fill="rgba(0, 0, 0, 0.5)"/%3E%3C/svg%3E%0A');
        background-size: 100%
        // background-position: left bottom

        .label
          position: absolute
          top: 0
          left: 0
          transform: translateX(-50%)
          color: white
          font-size: 3vh
          text-shadow: 0 0 5px black, 0 0 3px black, 0 0 2px black

    .pointer
      position: absolute
      bottom: 0
      left: 50%
      width: 0
      height: 0
      border: 16px solid red
      border-color: black black transparent transparent
      transform: rotate(-45deg) translate(-50%, 50%)
</style>
