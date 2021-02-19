export default class Input {
  private static axis = {
    ViewH: 0,
    ViewV: 0,
    MoveH: 0,
    MoveV: 0,
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

    window.addEventListener('click', (ev) => {
      document.body.requestPointerLock()
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
}
