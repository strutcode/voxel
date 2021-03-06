import Hud from './Hud'

export default class Input {
  private static axis = {
    ViewH: 0,
    ViewV: 0,
    MoveH: 0,
    MoveV: 0,
  }
  private static inputMap = {
    Forward: 'w',
    Back: 's',
    Left: 'a',
    Right: 'd',
    Run: 'shift',
    Warp: 'q',
    AutoMove: 'numlock',
    Break: 'mouse0',
    Place: 'mouse1',
    Jump: ' ',
    Fly: 'f',
    Map: 'm',
    Inventory: 'tab',
    DevConsole: '`',
    DebugOverlay: 'f1',
  }
  private static keyDown: Record<string, boolean> = {}
  private static key: Record<string, boolean> = {}
  private static lastKey: Record<string, boolean> = {}
  private static wantsPointerLock = true
  private static hasPointerLock = false

  public static async init() {
    const keyMap = Object.entries(this.inputMap).reduce((acc, keyValue) => {
      acc[keyValue[1]] = keyValue[0]
      return acc
    }, {} as Record<string, string>)

    document.addEventListener('keydown', ev => {
      const key = ev.key.toLowerCase()

      this.keyDown[key] = true

      if (keyMap[key]) {
        ev.preventDefault()
        ev.stopPropagation()
      }
    })
    document.addEventListener('keyup', ev => {
      this.keyDown[ev.key.toLowerCase()] = false
    })

    document.addEventListener('pointermove', ev => {
      if (this.hasPointerLock) {
        this.axis.ViewH += ev.movementX
        this.axis.ViewV += ev.movementY
      }
    })

    document.addEventListener('pointerdown', ev => {
      if (this.hasPointerLock) {
        this.key[`mouse${ev.button}`] = true
      } else if (this.wantsPointerLock) {
        this.capturePointer()
      }
    })
    document.addEventListener('pointerup', ev => {
      this.key[`mouse${ev.button}`] = false
    })

    document.addEventListener('pointerlockchange', () => {
      this.hasPointerLock = document.pointerLockElement === document.body
    })
  }

  public static capturePointer() {
    document.body.requestPointerLock()
    this.wantsPointerLock = true
  }

  public static releasePointer() {
    document.exitPointerLock()
    this.wantsPointerLock = false
  }

  public static startFrame() {}

  public static endFrame() {
    this.axis.ViewH = this.axis.ViewV = 0

    this.axis.MoveH = +!!this.keyDown['d'] - +!!this.keyDown['a']
    this.axis.MoveV = +!!this.keyDown['w'] - +!!this.keyDown['s']

    this.lastKey = this.key
    this.key = Object.assign({}, this.keyDown)
  }

  public static getAxis(name: keyof typeof Input.axis) {
    return this.axis[name]
  }

  public static getButton(name: keyof typeof Input.inputMap) {
    const frame = this.key[this.inputMap[name]] ?? false
    const lastFrame = this.lastKey[this.inputMap[name]] ?? false

    if (frame === lastFrame) {
      return false
    }

    return frame
  }

  public static getButtonDown(name: keyof typeof Input.inputMap) {
    return this.keyDown[this.inputMap[name]] ?? false
  }
}
