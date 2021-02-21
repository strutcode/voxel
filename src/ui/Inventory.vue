<template>
  <div class="hotBar">
    <div class="slot" v-for="i in 10" :key="i">
      <template v-if="inventory[i - 1]">
        <div class="icon" :style="itemStyle(inventory[i - 1].id)"></div>
        <div class="count">{{ inventory[i - 1].amount }}</div>
      </template>
    </div>
    <img src="../../assets/items.png" v-show="false" ref="itemsImg" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    data() {
      return {
        imageWidth: 0,
        imageHeight: 0,
      }
    },

    computed: {
      inventory() {
        return this.gameData.player?.inventory ?? []
      },
    },

    mounted() {
      const img = this.$refs.itemsImg as Image
      img.onload = () => {
        this.imageWidth = img.width
        this.imageHeight = img.height
        this.$forceUpdate()
      }
    },

    methods: {
      itemStyle(id: number | undefined) {
        if (id == null) {
          return {
            visibility: 'hidden',
          }
        }

        const iconsH = this.imageWidth / 16
        const x = id % iconsH
        const y = Math.floor(id / iconsH)

        return {
          backgroundSize: `${iconsH * 100}%`,
          backgroundPosition: `${(x / (iconsH - 1)) * 100}% ${(y /
            (iconsH - 1)) *
            100}%`,
        }
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .hotBar
    display: flex
    flex-flow: column nowrap
    position: absolute
    top: 50%
    left: 0
    transform: translateY(-50%)
    border: 4px outset #ddd

    .slot
      position: relative
      width: 5vh
      height: 5vh
      background: #bbb
      border: 4px inset #ddd

      .icon
        width: 5vh
        height: 5vh
        background-image: url('../../assets/items.png')
        image-rendering: pixelated

      .count
        position: absolute
        bottom: 0
        right: 6px
        font-size: 16px
        font-family: monospace
        color: white
        font-weight bold
        text-shadow: 0 0 5px black, 0 0 3px black, 0 0 2px black
</style>
