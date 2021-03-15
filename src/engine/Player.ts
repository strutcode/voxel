import Input from './ui/Input'
import Mobile from './Mobile'
import Database from './Database'

export default class Player extends Mobile {
  public jumpIntent = false
  private autoMove = false

  public inventory: { id: number; name: string; amount: number }[] = []
  public recents: {
    id: number
    key: number
    name: string
    amount: number
  }[] = []

  public update() {
    this.velocity.set(0, 0, 0)
    this.speed = Input.getButtonDown('Run') ? 12 : 6
    this.speed = Input.getButtonDown('Warp') ? 22 : this.speed

    this.moveRight(Input.getAxis('MoveH'))
    this.moveForward(this.autoMove ? 1 : Input.getAxis('MoveV'))
    this.lookRight(Input.getAxis('ViewH'))
    this.lookUp(Input.getAxis('ViewV'))

    if (Input.getButton('AutoMove')) {
      this.autoMove = !this.autoMove
    }

    this.jumpIntent = Input.getButtonDown('Jump')

    if (Input.getButton('Fly')) {
      this.fly = !this.fly
    }
  }

  public addItem(id: number, amount?: number): void
  public addItem(name: string, amount?: number): void
  public addItem(input: string | number, amount = 1) {
    const id = typeof input === 'number' ? input : Database.itemId(input)
    const name = Database.itemInfo(id).name
    const existing = this.inventory.find(i => i.id === id)
    const item = existing ?? {
      id,
      name,
      amount,
    }

    if (existing) {
      existing.amount += amount
    } else {
      this.inventory.push(item)
    }

    this.recents.push({
      id,
      key: performance.now(),
      name,
      amount,
    })

    setTimeout(() => {
      this.recents.shift()
    }, 2000)
  }
}
