import Chunk from './Chunk'

onmessage = function (event: MessageEvent) {
  const chunk = new Chunk(event.data.x, event.data.y, event.data.z)

  postMessage(chunk.serialize())
}
