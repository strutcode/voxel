export default class WorldMap {
  private data: Uint16Array
  private _canvas: HTMLCanvasElement = document.createElement('canvas')
  private rgba: Uint8ClampedArray
  private refineH = false

  public constructor(
    public width: number,
    public height: number,
    private subdivisions = 4,
  ) {
    this.data = new Uint16Array(width * height)
    this.rgba = new Uint8ClampedArray(width * height * 4)

    this.initialize()
  }

  private initialize() {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = Math.random() < 0.5 ? 3 : 2
    }

    for (let n = 0; n < this.subdivisions; n++) {
      this.refine()
    }

    this.updateMinimap()
  }

  private refine() {
    const oldData = this.data
    const oldWidth = this.width
    const oldHeight = this.height

    // Resize the map, we want every in between row to be new so x + (x - 1)
    this.width = this.width + (this.width - 1)
    this.height = this.height + (this.height - 1)
    this.data = new Uint16Array(this.width * this.height)

    const fx = oldWidth / this.width
    const fy = oldHeight / this.height

    let x, y, ia, ib

    // Fill gaps on primary axis
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        ia = Math.floor(y * fy) * oldWidth + Math.floor(x * fx)
        ib = y * this.width + x

        if ((this.refineH && x % 2 === 0) || (!this.refineH && y % 2 === 0)) {
          this.data[ib] = oldData[ia]
          continue
        }

        if (Math.random() < 0.5) {
          this.data[ib] = oldData[ia]
        } else {
          if (this.refineH) {
            this.data[ib] = oldData[ia + 1]
          } else {
            this.data[ib] = oldData[ia + oldWidth]
          }
        }
      }
    }

    // Fill gaps on secondary axis
    for (y = 0; y < this.height; y++) {
      for (x = 1; x < this.width; x += 2) {
        ia = y * this.width + x

        if (this.refineH) {
          if (Math.random() < 0.5) {
            this.data[ia] = this.data[ia - 1]
          } else {
            this.data[ia] = this.data[ia + 1]
          }
        } else {
          if (Math.random() < 0.5) {
            this.data[ia] = this.data[ia - this.width]
          } else {
            this.data[ia] = this.data[ia + this.width]
          }
        }
      }
    }

    // Flip axis
    this.refineH = !this.refineH
  }

  private updateMinimap() {
    this.rgba = new Uint8ClampedArray(this.width * this.height * 4)
    const canvas = this._canvas

    canvas.width = this.width
    canvas.height = this.height

    let x, y, i, r, g, b

    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        i = (y * this.width + x) * 4
        r = g = b = 0

        switch (this.data[y * this.width + x]) {
          case 0:
            break
          case 1:
            r = 255
            break
          case 2:
            g = 255
            break
          case 3:
            b = 255
            break
          case 4:
            r = g = b = 255
            break
        }

        this.rgba[i + 0] = r
        this.rgba[i + 1] = g
        this.rgba[i + 2] = b
        this.rgba[i + 3] = 255
      }
    }

    const ctx = canvas.getContext('2d')

    if (ctx) {
      const img = new ImageData(this.rgba, this.width, this.height)
      ctx.putImageData(img, 0, 0)
    }
  }

  public get asTexture() {
    return this.rgba
  }

  public get canvas() {
    return this._canvas
  }
}
