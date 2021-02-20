<template>
  <div class="reticle"></div>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({})
</script>

<style lang="stylus" scoped>
  .reticle
    position: absolute
    top: 50%
    left: 50%
    transform: translate(-50%, -50%)

    &:before, &:after
      content: ''
      display: block
      position: absolute
      background: white

    &:before
      width: 30px
      height: 4px
      top: -2px
      left: -15px

    &:after
      width: 4px
      height: 30px
      top: -15px
      left: -2px
</style>
