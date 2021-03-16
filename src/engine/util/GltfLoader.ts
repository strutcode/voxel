enum LoaderState {
  Setup,
  Network,
  Parser,
  Finished,
  Failed,
}

export default class GltfLoader {
  public meta = {
    valid: false,
    version: 0,
    size: 0,
    dataSize: 0,
    chunks: [],
  }

  private state = LoaderState.Setup
  private readyResolve: Function
  private readyPromise = new Promise(resolve => (this.readyResolve = resolve))
  private jsonChunk?: Record<string, unknown>
  private binChunk?: Uint8Array

  constructor(input: string) {
    this.loadFromNetwork(input)
  }

  public get ready() {
    return this.readyPromise
  }

  private async loadFromNetwork(url: string) {
    this.state = LoaderState.Network
    const res = await fetch(url)

    if (res.ok) {
      this.state = LoaderState.Parser
      const byteData = await res.arrayBuffer()
      const uintData = new Uint32Array(byteData)

      this.meta.size = byteData.byteLength

      // Magic check
      if (uintData[0] === 0x46546c67) {
        this.meta.valid = true
      } else {
        this.state = LoaderState.Failed
        throw new Error('Not a valid gltf file')
      }

      this.meta.version = uintData[1]
      this.meta.dataSize = uintData[2]

      if (this.meta.size !== this.meta.dataSize) {
        this.state = LoaderState.Failed
        throw new Error(
          `File is corrupted (actual length ${this.meta.size} < expected length ${this.meta.dataSize}`,
        )
      }

      let i = 3
      while (i < uintData.length) {
        const size = uintData[i]
        const type = uintData[i + 1]
        const chunkData = new Uint8Array(byteData, (i + 2) * 4, size)

        if (type === 0x4e4f534a) {
          const decoder = new TextDecoder()
          const data = JSON.parse(decoder.decode(chunkData))

          this.meta.chunks.push({
            size,
            type: 'JSON',
            data,
          })

          this.jsonChunk = data
        } else if (type === 0x004e4942) {
          this.meta.chunks.push({
            size,
            type: 'BIN',
            data: chunkData,
          })

          this.binChunk = chunkData
        }

        i += size / 4 + 2
      }

      this.state = LoaderState.Finished
      this.readyResolve()
    } else {
      this.state = LoaderState.Failed
    }
  }
}
