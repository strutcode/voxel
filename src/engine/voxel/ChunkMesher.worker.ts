import Chunk from './Chunk'
import ChunkMesher from './ChunkMesher'
import Database from '../Database'

import biomeInfo from '../../data/biomeInfo'
import blockInfo from '../../data/blockInfo'
import itemInfo from '../../data/itemInfo'
import objectInfo from '../../data/objectInfo'

Database.init(biomeInfo, blockInfo, itemInfo, objectInfo)

onmessage = function(event: MessageEvent) {
  const chunk = Chunk.deserialize(event.data)

  const attributes = ChunkMesher.createMesh(chunk)

  postMessage({
    x: event.data.x,
    y: event.data.y,
    z: event.data.z,
    objects: chunk.objects,
    attributes,
  })
}
