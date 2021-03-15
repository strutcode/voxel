import { m4 } from 'twgl.js'
import Vector from '../math/Vector'

const worldUp = new Vector(0, 1, 0)
const fovToRadians = 0.008726646259971648 // Baked degrees to radians divided by 2

export default class Camera {
  public position = new Vector()
  public direction = new Vector(0, 0, 1)
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
      this.fov * fovToRadians,
      -this.aspect,
      this.near,
      this.far,
      this.projection,
    )
    m4.multiply(this.projection, this.view, this.viewProjection)
  }

  render() {
    this.updateProjection()
  }
}
