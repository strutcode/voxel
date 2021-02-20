export default class Input {
  private static axis = {
    ViewH: 0,
    ViewV: 0,
    MoveH: 0,
    MoveV: 0,
  }
  private static inputMap = {
    Break: 'mouse0',
    Place: 'mouse1',
    Jump: ' ',
  }
  private static key: Record<string, boolean> = {
    w: false,
    s: false,
    a: false,
    d: false,
  }

  public static async init() {
    window.addEventListener('keydown', (ev) => {
      this.key[ev.key.toLowerCase()] = true
    })
    window.addEventListener('keyup', (ev) => {
      this.key[ev.key.toLowerCase()] = false
    })

    window.addEventListener('pointermove', (ev) => {
      this.axis.ViewH += ev.movementX
      this.axis.ViewV += ev.movementY
    })

    window.addEventListener('pointerdown', (ev) => {
      document.body.requestPointerLock()

      this.key[`mouse${ev.button}`] = true
    })
    window.addEventListener('pointerup', (ev) => {
      this.key[`mouse${ev.button}`] = false
    })
  }

  public static startFrame() {}

  public static endFrame() {
    this.axis.ViewH = this.axis.ViewV = 0

    this.axis.MoveH = +this.key['d'] - +this.key['a']
    this.axis.MoveV = +this.key['w'] - +this.key['s']
  }

  public static getAxis(name: keyof typeof Input.axis) {
    return this.axis[name]
  }

  public static getButton(name: keyof typeof Input.inputMap) {
    return this.key[this.inputMap[name]] ?? false
  }
}
