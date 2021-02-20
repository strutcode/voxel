import Input from './ui/Input'
import Mobile from './Mobile'

export default class Player extends Mobile {
  public jumpIntent = false
  private autoMove = false

  public inventory: { id: number; amount: number }[] = []

  public update() {
    this.velocity.set(0, 0, 0)

    this.moveRight(Input.getAxis('MoveH'))
    this.moveForward(this.autoMove ? 1 : Input.getAxis('MoveV'))
    this.lookRight(Input.getAxis('ViewH'))
    this.lookUp(Input.getAxis('ViewV'))

    if (Input.getButton('AutoMove')) {
      this.autoMove = !this.autoMove
    }
    this.jumpIntent = Input.getButton('Jump')
  }

  public addItem(id: number) {
    const existing = this.inventory.find((i) => i.id === id)

    if (existing) {
      existing.amount++
    } else {
      this.inventory.push({
        id,
        amount: 1,
      })
    }
  }
}
