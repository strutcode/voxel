import { m4 } from 'twgl.js'
import Vector from '../math/Vector'

const worldUp = new Vector(0, 1, 0)

export default class Camera {
  public position: Vector = new Vector()
  public direction: Vector = new Vector(0, -0.5, 0.5)
  public right!: Vector
  public up!: Vector
  public eye: m4.Mat4 = m4.identity()
  public view: m4.Mat4 = m4.identity()
  public projection: m4.Mat4 = m4.identity()
  public viewProjection: m4.Mat4 = m4.identity()

  constructor(
    public fov: number = 90,
    public aspect: number = 1,
    public near: number = 0.1,
    public far: number = 100,
  ) {
    this.updateProjection()
  }

  public updateProjection() {
    this.right = worldUp.cross(this.direction)
    this.up = this.direction.cross(this.right)

    m4.lookAt(
      this.position.asArray,
      this.position.add(this.direction).asArray,
      this.up.asArray,
      this.eye,
    )
    m4.inverse(this.eye, this.view)
    m4.perspective(
      ((this.fov / 2) * Math.PI) / 180,
      this.aspect,
      this.near,
      this.far,
      this.projection,
    )
    m4.multiply(this.projection, this.view, this.viewProjection)
  }

  render(gl: WebGLRenderingContext) {
    this.updateProjection()
  }
}
