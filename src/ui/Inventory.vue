<template>
  <div class="recents">
    <div
      class="title"
      :style="{ opacity: gameData.player.recents.length ? 1 : 0 }"
    >
      Acquired
    </div>
    <transition-group name="list">
      <div
        class="item"
        v-for="(item, i) in gameData.player.recents"
        :key="item.key"
      >
        <div class="line">
          <div class="icon" :style="itemStyle(item.id)"></div>
          <div>
            <span class="name">{{ item.name }}</span> x{{ item.amount }}
          </div>
        </div>
      </div>
    </transition-group>
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
  .icon
    width: 5vh
    height: 5vh
    background-image: url('../../assets/items.png')
    image-rendering: pixelated

  .recents
    position: absolute
    bottom: 1vh
    left: 1vh
    color: white
    font: 14pt sans-serif
    text-align: center
    text-shadow: 0 0 5px black, 0 0 3px black, 0 0 2px black

    .title
      transition: all 200ms
      font-size: 18pt
      font-weight: bold
      font-variant: small-caps

    .item
      display: flex
      flex-flow: column nowrap
      justify-self: center

      .icon
        width: 4vh
        height: 4vh
        margin-right: 1vh
        filter: drop-shadow(0 0 2px black)

      .name
        text-transform: capitalize

      .line
        display: flex
        flex-flow: row nowrap
        align-items: center
        text-align: left

  .list-enter-active, .list-leave-active
    transition: all 200ms

  .list-enter, .list-leave-to
    transform: translateX(-100%)
    opacity: 0
</style>
