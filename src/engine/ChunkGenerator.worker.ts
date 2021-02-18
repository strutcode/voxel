import Chunk from './Chunk'
import ChunkGenerator from './ChunkGenerator'

const generator = new ChunkGenerator()

onmessage = function (event: MessageEvent) {
  const chunk = new Chunk(event.data.x, event.data.y, event.data.z)
  generator.perlin(chunk)

  postMessage(chunk.serialize())
}
