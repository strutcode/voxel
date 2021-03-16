import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'
import Player from '../Player'
import Vector from '../math/Vector'
import Game from '../../Game'

export default class Physics {
  private static aimedBlock: Vector | null = null
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
        case 'updateAimedVoxel':
          if (ev.data.result) {
            this.aimedBlock = new Vector(
              ev.data.result[0],
              ev.data.result[1],
              ev.data.result[2],
            )
          } else {
            this.aimedBlock = null
          }
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

  public static updateAimedVoxel() {}

  public static getAimedVoxel() {
    return this.aimedBlock
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
