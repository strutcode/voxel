import Vector from '../math/Vector'
import Chunk from '../voxel/Chunk'
import PhysicsThread from './PhysicsThread'

interface ChunkMessage extends MessageEvent {
  data: {
    type: 'addChunk' | 'updateChunk' | 'remChunk'
    chunk: ReturnType<Chunk['serialize']>
  }
}

interface AddPlayerMessage extends MessageEvent {
  data: {
    type: 'addPlayer'
    position: [number, number, number]
  }
}

interface SyncPlayerMessage extends MessageEvent {
  data: {
    type: 'syncPlayer'
    velocity: [number, number, number]
    fly: boolean
    jumpIntent: boolean
  }
}

type PhysicsMessage = ChunkMessage | AddPlayerMessage | SyncPlayerMessage

onmessage = function(event: PhysicsMessage) {
  switch (event.data.type) {
    case 'addChunk':
    case 'updateChunk':
    case 'remChunk':
      const chunk = Chunk.deserialize(event.data.chunk)

      PhysicsThread[event.data.type].call(PhysicsThread, chunk)
      break
    case 'addPlayer':
      PhysicsThread.addPlayer(
        new Vector(
          event.data.position[0],
          event.data.position[1],
          event.data.position[2],
        ),
      )
      break
    case 'syncPlayer':
      const result = PhysicsThread.syncPlayer(
        new Vector(
          event.data.velocity[0],
          event.data.velocity[1],
          event.data.velocity[2],
        ),
        event.data.fly,
        event.data.jumpIntent,
      )

      if (result) {
        postMessage({
          type: 'syncPlayer',
          position: [result.x, result.y, result.z],
        })
      }

      break
  }
}

async function start() {
  await PhysicsThread.init()

  postMessage('ready')

  setInterval(() => {
    PhysicsThread.update()
    // PhysicsThread.updateAimedVoxel(position, direction)
  }, 1000 / 60)
}

start()
