import Game from '../Game'
import Vector from './math/Vector'

const ninetyDegrees = Math.PI / 2
const threeSixtyDegrees = Math.PI * 2
const epsilon = 0.0001

export default class Mobile {
  public position = new Vector()
  public velocity = new Vector()
  public yaw = 0
  public pitch = 0
  public speed = 4

  public fly = true

  public moveForward(amount: number) {
    const speed = this.speed * Game.deltaTime
    const pitchFactor = this.fly ? Math.cos(this.pitch) : 1

    this.velocity.x += Math.sin(this.yaw) * pitchFactor * amount * speed
    this.velocity.z += Math.cos(this.yaw) * pitchFactor * amount * speed

    if (this.fly) {
      this.velocity.y +=
        Math.sign(-this.pitch) * (1 - pitchFactor) * amount * speed
    }
  }

  public moveRight(amount: number) {
    const speed = this.speed * Game.deltaTime
    this.velocity.x += Math.sin(this.yaw + ninetyDegrees) * amount * speed
    this.velocity.z += Math.cos(this.yaw + ninetyDegrees) * amount * speed
  }

  public lookRight(amount: number) {
    this.yaw += amount * 0.001
    this.yaw %= threeSixtyDegrees
  }

  public lookUp(amount: number) {
    this.pitch += amount * 0.001
    this.pitch = Math.max(
      epsilon - ninetyDegrees,
      Math.min(this.pitch, ninetyDegrees - epsilon),
    )
  }
}
