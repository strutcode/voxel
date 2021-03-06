import Chunk from './Chunk'
import ChunkGenerator from './ChunkGenerator'
import WorldMap from '../world/WorldMap'
import Database from '../Database'

import biomeInfo from '../../data/biomeInfo'
import blockInfo from '../../data/blockInfo'
import itemInfo from '../../data/itemInfo'
import objectInfo from '../../data/objectInfo'

Database.init(biomeInfo, blockInfo, itemInfo, objectInfo)

let map: WorldMap
const generator = new ChunkGenerator()

onmessage = function(event: MessageEvent) {
  if (event.data.type === 'map') {
    map = WorldMap.deserialize(event.data.map)
  }

  if (event.data.type === 'chunk') {
    const chunk = new Chunk(event.data.x, event.data.y, event.data.z)
    generator.overworldBiome(chunk, map)

    postMessage(chunk.serialize())
  }
}
