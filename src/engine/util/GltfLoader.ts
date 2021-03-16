enum LoaderState {
  Setup,
  Network,
  Parser,
  Finished,
  Failed,
}

enum GltfComponentType {
  Byte = 5120,
  UnsignedByte = 5121,
  Short = 5122,
  UnsignedShort = 5123,
  UnsignedInt = 5125,
  Float = 5126,
}

enum GltfAccessorType {
  Scalar = 'SCALAR',
  Vec2 = 'VEC2',
  Vec3 = 'VEC3',
  Vec4 = 'VEC4',
  Mat2 = 'MAT2',
  Mat3 = 'MAT3',
  Mat4 = 'MAT4',
}

enum GltfPrimitiveMode {
  Points = 0,
  Lines = 1,
  LineLoop = 2,
  LineStrip = 3,
  Triangles = 4,
  TriangleStrip = 5,
  TriangleFan = 6,
}

interface GltfAsset {
  version: string
  minVersion?: string
  generator?: string
  copyright?: string
}

interface GltfScene {
  name?: string
  nodes: number[]
}

interface GltfNode {
  name?: string
  children: number[]
  translation?: [number, number, number]
  rotation?: [number, number, number, number]
  scale?: [number, number, number]
  matrix?: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
}

interface GltfMaterial {}

interface GltfMesh {
  name?: string
  primitives: GltfPrimitive[]
  weights?: number[]
}

interface GltfPrimitive {
  attributes: Record<string, number>
  indices?: number
  material?: number
  mode: GltfPrimitiveMode
}

interface GltfTexture {}

interface GltfImage {
  uri?: string
  mimeType?: string
  bufferView?: number
  name?: string
}

interface GltfSampler {}

interface GltfAccessor {
  bufferView?: number
  byteOffset?: number
  componentType: GltfComponentType
  count: number
  name?: string
  normalized?: boolean
  min?: number[]
  max?: number[]
  type: GltfAccessorType
}

interface GltfBuffer {
  name?: string
  byteLength: number
  uri?: string
}

interface GltfBufferView {
  buffer: number
  byteOffset: number
  byteLength: number
  byteStride?: number
  target?: number
}

const gltfComponentConstructor = {
  [GltfComponentType.Byte]: Int8Array,
  [GltfComponentType.UnsignedByte]: Uint8Array,
  [GltfComponentType.Short]: Int16Array,
  [GltfComponentType.UnsignedShort]: Uint16Array,
  [GltfComponentType.UnsignedInt]: Uint32Array,
  [GltfComponentType.Float]: Float32Array,
}

const gltfByteLength = {
  [GltfComponentType.Byte]: 1,
  [GltfComponentType.UnsignedByte]: 1,
  [GltfComponentType.Short]: 2,
  [GltfComponentType.UnsignedShort]: 2,
  [GltfComponentType.UnsignedInt]: 4,
  [GltfComponentType.Float]: 4,
}

const gltfAccessorStride = {
  [GltfAccessorType.Scalar]: 1,
  [GltfAccessorType.Vec2]: 2,
  [GltfAccessorType.Vec3]: 3,
  [GltfAccessorType.Vec4]: 4,
  [GltfAccessorType.Mat2]: 4,
  [GltfAccessorType.Mat3]: 9,
  [GltfAccessorType.Mat4]: 16,
}

export default class GltfLoader {
  public meta = {
    valid: false,
    version: 0,
    size: 0,
    dataSize: 0,
    chunks: 0,
  }
  public asset!: GltfAsset
  public scenes!: GltfScene[]
  public nodes!: GltfNode[]
  public materials!: GltfMaterial[]
  public meshes!: GltfMesh[]
  public textures!: GltfTexture[]
  public images!: GltfImage[]
  public samplers!: GltfSampler[]
  public accessors!: GltfAccessor[]
  public buffers!: GltfBuffer[]
  public bufferViews!: GltfBufferView[]
  public bufferData!: ArrayBuffer[]

  private state = LoaderState.Setup
  private readyResolve: Function
  private readyPromise = new Promise(resolve => (this.readyResolve = resolve))

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

      let jsonChunk

      let i = 3
      while (i < uintData.length) {
        const size = uintData[i]
        const type = uintData[i + 1]
        const chunkData = new Uint8Array(byteData, (i + 2) * 4, size)

        if (type === 0x4e4f534a) {
          const decoder = new TextDecoder()
          const data = JSON.parse(decoder.decode(chunkData))

          jsonChunk = data

          this.meta.chunks++
        } else if (type === 0x004e4942) {
          const start = (i + 2) * 4
          this.bufferData = [byteData.slice(start, start + size)]

          this.meta.chunks++
        }

        i += size / 4 + 2
      }

      if (!jsonChunk) {
        this.state = LoaderState.Failed
        throw new Error(`File doesn't contain the required JSON chunk`)
      }

      this.asset = jsonChunk.asset
      this.scenes = jsonChunk.scenes
      this.nodes = jsonChunk.nodes
      this.materials = jsonChunk.materials
      this.meshes = jsonChunk.meshes
      this.textures = jsonChunk.textures
      this.images = jsonChunk.images
      this.accessors = jsonChunk.accessors
      this.buffers = jsonChunk.buffers
      this.bufferViews = jsonChunk.bufferViews

      if (this.buffers.length !== this.bufferData.length) {
        this.state = LoaderState.Failed
        throw new Error('Unsupported file: buffer specified but no bin chunk')
      }

      this.state = LoaderState.Finished
      this.readyResolve()
    } else {
      this.state = LoaderState.Failed
    }
  }

  public getAccessorData(index?: number) {
    if (index == null) return undefined

    const accessor = this.accessors[index]

    if (accessor.bufferView != null) {
      const bufferView = this.bufferViews[accessor.bufferView]
      const stride = gltfAccessorStride[accessor.type]
      const buffer = new gltfComponentConstructor[accessor.componentType](
        this.bufferData[bufferView.buffer],
        bufferView.byteOffset ?? 0,
        accessor.count * stride,
      )

      return {
        buffer,
        stride,
      }
    }

    return undefined
  }

  public getBuffers(meshIndex: number) {
    if (
      this.state !== LoaderState.Finished ||
      meshIndex > this.meshes.length - 1
    ) {
      return []
    }

    const mesh = this.meshes[meshIndex]
    const buffers = []

    mesh.primitives.forEach(primitive => {
      buffers.push({
        position: this.getAccessorData(primitive.attributes.POSITION),
        indices: this.getAccessorData(primitive.indices),
        normal: this.getAccessorData(primitive.attributes.NORMAL),
        tangent: this.getAccessorData(primitive.attributes.TANGENT),
        color: this.getAccessorData(primitive.attributes.COLOR_0),
        texcoord: this.getAccessorData(primitive.attributes.TEXCOORD_0),
        texcoord2: this.getAccessorData(primitive.attributes.TEXCOORD_1),
        joints: this.getAccessorData(primitive.attributes.JOINTS_0),
        weights: this.getAccessorData(primitive.attributes.WEIGHTS_0),
      })
    })

    return buffers
  }
}
