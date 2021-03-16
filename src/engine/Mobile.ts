import Game from '../Game'
import Vector from './math/Vector'

const ninetyDegrees = Math.PI / 2
const threeSixtyDegrees = Math.PI * 2
const epsilon = 0.0001

export default class Mobile {
  public position = new Vector()
  public velocity = new Vector()
  public direction = new Vector()
  public speed = 4
  public fly = true

  private orientation = {
    yaw: 0,
    pitch: 0,
  }

  constructor() {
    this.updateDirection()
  }

  public get yaw() {
    return this.orientation.yaw
  }
  public set yaw(value: number) {
    this.orientation.yaw = value % threeSixtyDegrees
    this.updateDirection()
  }

  public get pitch() {
    return this.orientation.pitch
  }
  public set pitch(value: number) {
    this.orientation.pitch = Math.max(
      epsilon - ninetyDegrees,
      Math.min(value, ninetyDegrees - epsilon),
    )
    this.updateDirection()
  }

  private updateDirection() {
    const { pitch, yaw } = this.orientation

    this.direction.x = Math.sin(yaw) * Math.cos(pitch)
    this.direction.y = -Math.sin(pitch)
    this.direction.z = Math.cos(yaw) * Math.cos(pitch)
  }

  public moveForward(amount: number) {
    const speed = this.speed * Game.deltaTime

    this.velocity.x += this.direction.x * amount * speed
    this.velocity.y += this.direction.y * amount * speed
    this.velocity.z += this.direction.z * amount * speed

    if (!this.fly) {
      this.velocity.y = 0
    }
  }

  public moveRight(amount: number) {
    const speed = this.speed * Game.deltaTime
    this.velocity.x += Math.sin(this.yaw + ninetyDegrees) * amount * speed
    this.velocity.z += Math.cos(this.yaw + ninetyDegrees) * amount * speed
  }

  public lookRight(amount: number) {
    this.yaw += amount * 0.001
  }

  public lookUp(amount: number) {
    this.pitch += amount * 0.001
  }
}
