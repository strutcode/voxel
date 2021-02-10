import Chunk from './Chunk'
import ChunkMesher from './ChunkMesher'

onmessage = function (event: MessageEvent) {
  const chunk = Chunk.deserialize(event.data)
  const attributes = ChunkMesher.createMesh(chunk)
  postMessage({
    x: event.data.x,
    y: event.data.y,
    z: event.data.z,
    attributes,
  })
}
