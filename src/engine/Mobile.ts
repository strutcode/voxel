import Game from '../Game'
import Vector from './math/Vector'

const rightOffset = Math.PI / 2

export default class Mobile {
  public position = new Vector()
  public yaw = 0
  public pitch = 0
  public speed = 8

  public moveForward(amount: number) {
    const speed = this.speed * Game.deltaTime
    this.position.x += Math.sin(this.yaw) * amount * speed
    this.position.z += Math.cos(this.yaw) * amount * speed
  }

  public moveRight(amount: number) {
    const speed = this.speed * Game.deltaTime
    this.position.x += Math.sin(this.yaw + rightOffset) * amount * speed
    this.position.z += Math.cos(this.yaw + rightOffset) * amount * speed
  }

  public lookRight(amount: number) {
    this.yaw += amount * 0.001
  }

  public lookUp(amount: number) {
    this.pitch += amount * 0.001
  }
}
