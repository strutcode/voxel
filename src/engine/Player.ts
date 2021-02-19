import Input from './Input'
import Mobile from './Mobile'

export default class Player extends Mobile {
  public update() {
    this.moveRight(Input.getAxis('MoveH'))
    this.moveForward(Input.getAxis('MoveV'))
    this.lookRight(Input.getAxis('ViewH'))
    this.lookUp(Input.getAxis('ViewV'))
  }
}
