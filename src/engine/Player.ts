import Input from './Input'
import Mobile from './Mobile'

export default class Player extends Mobile {
  public jumpIntent = false
  
  public update() {
    this.velocity.set(0, 0, 0)
    this.moveRight(Input.getAxis('MoveH'))
    this.moveForward(Input.getAxis('MoveV'))
    this.lookRight(Input.getAxis('ViewH'))
    this.lookUp(Input.getAxis('ViewV'))
    this.jumpIntent = Input.getButton('Jump')
  }
}
