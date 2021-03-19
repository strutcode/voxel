import Chunk from '../voxel/Chunk'
import Mobile from '../world/Mobile'
import Player from '../world/Player'
import Game from '../../Game'
import Doodad from '../world/Doodad'

interface AimedVoxel {
  type: 'voxel'
  position: [number, number, number]
}

interface AimedObject {
  type: 'object'
  id: number
}

type AimedItem = AimedVoxel | AimedObject | null

export default class Physics {
  public static activeDistance = 2

  private static aimedItem: AimedItem = null
  private static activeChunks = new Set<number>()
  private static workerThread = new Worker('./PhysicsThread.worker.ts')

  public static async init() {
    this.workerThread.addEventListener('message', (ev: MessageEvent) => {
      switch (ev.data.type) {
        case 'syncPlayer':
          Game.player.position.set(
            ev.data.position[0],
            ev.data.position[1],
            ev.data.position[2],
          )
          break
        case 'objectSync':
          ev.data.objects.forEach(object => {
            const doodad = Doodad.fromId(object.id)

            if (doodad) {
              doodad.position.set(
                object.position[0],
                object.position[1],
                object.position[2],
              )
              doodad.rotation.set(
                object.rotation[0],
                object.rotation[1],
                object.rotation[2],
              )
            }
          })
          break
        case 'updateAimedItem':
          this.aimedItem = ev.data.result
          break
      }
    })

    return new Promise<void>(resolve => {
      const messageHandler = (ev: MessageEvent) => {
        this.workerThread.removeEventListener('message', messageHandler)
        resolve()
      }

      this.workerThread.addEventListener('message', messageHandler)
    })
  }

  public static update() {}

  public static addChunk(chunk: Chunk) {
    const key = chunk.key

    if (this.activeChunks.has(key)) return
    this.activeChunks.add(key)

    this.workerThread.postMessage({
      type: 'addChunk',
      chunk: chunk.serialize(),
    })
  }

  public static updateChunk(chunk: Chunk) {
    this.workerThread.postMessage({
      type: 'updateChunk',
      chunk: chunk.serialize(),
    })
  }

  public static remChunk(chunk: Chunk) {
    const key = chunk.key

    if (!this.activeChunks.has(key)) return
    this.activeChunks.delete(key)

    this.workerThread.postMessage({
      type: 'remChunk',
      chunk: chunk.serialize(),
    })
  }

  public static addPlayer(player: Player) {
    this.workerThread.postMessage({
      type: 'addPlayer',
      position: player.position.asArray,
    })
  }

  public static syncPlayer(player: Player) {
    this.workerThread.postMessage({
      type: 'syncPlayer',
      velocity: player.velocity.asArray,
      direction: player.direction.asArray,
      fly: player.fly,
      jumpIntent: player.jumpIntent,
    })
  }

  public static updateAimedItem() {}

  public static getAimedItem() {
    return this.aimedItem
  }

  public static makeObjectActive(object: Doodad) {
    this.workerThread.postMessage({
      type: 'makeObjectActive',
      id: object.id,
    })
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
