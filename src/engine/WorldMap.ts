export default class WorldMap {
  private data: Uint16Array
  private _canvas: HTMLCanvasElement = document.createElement('canvas')
  private rgba: Uint8ClampedArray

  public constructor(
    public width: number,
    public height: number,
    subdivisions = 7,
  ) {
    this.data = new Uint16Array(width * height)
    this.rgba = new Uint8ClampedArray(width * height * 4)

    this.initialize()
  }

  private initialize() {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = Math.round(Math.random())
    }

    this.updateMinimap()
  }

  private refine() {}

  private updateMinimap() {
    const canvas = this._canvas

    canvas.width = this.width
    canvas.height = this.height

    let x, y, i, r, g, b

    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        i = (y * this.width + x) * 4
        r = g = b = this.data[y * this.width + x] ? 255 : 0

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
