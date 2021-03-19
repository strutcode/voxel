import Vector from '../math/Vector'

let gid = 1

export default class Doodad {
  private static byId = new Map<number, Doodad>()
  public static fromId(id: number) {
    return this.byId.get(id)
  }

  public id = gid++
  public position = new Vector()
  public rotation = 0

  constructor(public name: string) {
    Doodad.byId.set(this.id, this)
  }
}
