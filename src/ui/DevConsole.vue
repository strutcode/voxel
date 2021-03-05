<template>
  <div v-show="gameData.showConsole" class="devConsole">
    <div class="outputArea" v-html="finalOutput"></div>
    <div class="inputArea">
      <div class="prompt">$</div>
      <input
        type="text"
        ref="input"
        @keydown="interrupt"
        @keydown.enter="handle"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Game from '../Game'

  export default Vue.extend({
    data() {
      return {
        output: [],
      }
    },

    computed: {
      finalOutput() {
        return this.output.join('<br />')
      },
    },

    methods: {
      interrupt(ev) {
        if (ev.key !== '`') {
          ev.stopPropagation()
        }
      },
      print(input: string) {
        let final = input

        if (input.startsWith('$')) {
          final = `<span class="input">${input}</span>`
        }

        this.output.push(final)
      },
      handle(ev) {
        const input = ev.target.value

        this.print(`$ ${input}`)
        ev.target.value = ''

        let i = 0
        const getWord = () => {
          if (i >= input.length) return null

          let quote = false
          let buf = ''
          let c = input[i]

          while (i < input.length) {
            if (c === ' ') {
              if (!quote) {
                i++
                break
              }
            }

            if (c === '"') {
              quote = !quote
            } else {
              buf += c
            }

            c = input[++i]
          }

          return buf
        }

        const command = getWord()
        const argv = []

        let next

        while ((next = getWord())) {
          argv.push(next)
        }

        this.execute(command, argv)
      },
      execute(command: string, argv: string[]) {
        switch (command) {
          case 'add':
            try {
              const num = !argv[1] ? 1 : parseInt(argv[1])

              if (!isFinite(num) || isNaN(num)) {
                this.print('Invalid quantity')
                break
              }

              Game.addItem(argv[0], num)
            } catch (e) {
              this.print(e.message)
            }
            break
          default:
            this.print(`"${command}": no such command, try "help"`)
        }
      },
    },

    watch: {
      'gameData.showConsole'(show) {
        if (show) {
          this.$nextTick(() => {
            this.$refs.input.focus()
          })
        }
      },
    },
  })
</script>

<style lang="stylus" scoped>
  .devConsole
    position: absolute
    bottom: 0
    left: 50%
    transform: translateX(-50%)
    width: 40vw
    border: 4px outset #ddd
    background: #bbb

    & >>> .input
      opacity: 0.5

    &, input
      font: 14pt sans-serif

    .outputArea
      height: 20vh
      border: 4px inset #ddd

    .inputArea
      display: flex
      border-top: 4px outset #ddd

      .prompt
        padding: 0.25rem 0.5rem

      input
        flex-grow: 1
        border: 4px inset #ddd
        background: #bbb

        &:focus
          border: 4px inset #ddd
          background: #eee
          outline: none
</style>
