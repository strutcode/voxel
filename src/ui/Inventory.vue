<template>
  <div>
    <div class="inventory" v-show="showInventory">
      <template v-for="item in gameData.player.inventory">
        <div class="icon" :style="itemStyle(item.id)"></div>
        <div class="name">{{ item.name }}</div>
        <div class="amount">{{ item.amount }}</div>
      </template>
    </div>

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
          v-for="item in gameData.player.recents"
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
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    data() {
      return {
        imageWidth: 0,
        imageHeight: 0,
        showInventory: false,
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

      window.addEventListener('keydown', ev => {
        if (ev.key.toLowerCase() === 'tab') {
          ev.preventDefault()
          ev.stopPropagation()

          this.showInventory = !this.showInventory
        }
      })
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

  .inventory
    position: fixed
    top: 50%
    left: 50%
    transform: translate(-50%, -50%)
    background: #ddd
    border: 8px ridge #bbb
    font: 16pt sans-serif
    display: grid
    grid-template-columns: auto auto auto
    padding: 0.5rem
    z-index: +10

    .icon
      width: 4vh
      height: 4vh
      grid-column: 1
      margin-right: 1rem

    .name
      grid-column: 2
      align-self: center
      text-transform: capitalize

    .amount
      grid-column: 3
      align-self: center
      margin-left: 1rem

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
