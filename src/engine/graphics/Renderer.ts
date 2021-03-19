import Chunk from '../voxel/Chunk'
import Player from '../world/Player'
import Game from '../../Game'
import Vector from '../math/Vector'
import Physics from '../physics/Physics'
import {
  addExtensionsToContext,
  BufferInfo,
  createBufferInfoFromArrays,
  createProgramInfo,
  createTexture,
  drawBufferInfo,
  getContext,
  m4,
  primitives,
  ProgramInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from 'twgl.js'
import GltfLoader from '../util/GltfLoader'
import Camera from './Camera'
import { digitKey } from '../math/Bitwise'
import vsChunk from './shaders/chunk.vs.glsl'
import fsChunk from './shaders/chunk.fs.glsl'
import vsBasic from './shaders/basic.vs.glsl'
import fsBasic from './shaders/basic.fs.glsl'
import vsObject from './shaders/object.vs.glsl'
import fsObject from './shaders/object.fs.glsl'
import Doodad from '../world/Doodad'

interface ChunkMesh {
  x: number
  y: number
  z: number
  objects: Record<string, Chunk['objects']>
  bufferInfo: BufferInfo
}

interface ChunkAttributes {
  positions: Uint8Array
  indices: Uint32Array
}

interface ObjectModel {
  bufferInfo: BufferInfo
  texture?: WebGLTexture
  alphaCutoff?: number
}

export default class Renderer {
  public static viewDistance = 8

  private static camera = new Camera()
  private static context: WebGLRenderingContext
  private static chunkMeshes = new Map<number, ChunkMesh>()
  private static chunkAttrs = new Map<number, ChunkAttributes>()
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static basicShader: ProgramInfo
  private static chunkShader: ProgramInfo
  private static objectShader: ProgramInfo
  private static blockHighlight = {
    world: m4.identity(),
    bufferInfo: (null as unknown) as BufferInfo,
  }
  private static tileTexture: WebGLTexture
  private static noTexture: WebGLTexture
  private static uniforms = {
    world: m4.identity(),
    tiles: Renderer.noTexture,
    viewProjection: m4.identity(),
    viewPosition: new Float32Array(3),
    fogEnd: (Renderer.viewDistance - 1) * Chunk.size,
    fogStart: (Renderer.viewDistance - 1) * Chunk.size * 0.75,
    fogColor: new Float32Array([0.7, 0.8, 1]),
    color: new Float32Array([0.1, 0.1, 0.1, 1]),
  }
  private static models: Record<string, ObjectModel> = {}

  public static async init() {
    const container = document.getElementById('game')
    const canvas = document.createElement('canvas')
    Object.assign(container?.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    })
    Object.assign(canvas.style, {
      width: '100%',
      height: '100%',
    })
    container?.appendChild(canvas)

    this.context = getContext(canvas)
    addExtensionsToContext(this.context)
    resizeCanvasToDisplaySize(canvas)

    const gl = this.context

    this.camera.aspect = this.width / this.height
    this.camera.far = 32 * 17
    this.camera.position.set(0, 0, 0)
    this.camera.direction.set(0, 0, 1)

    this.basicShader = createProgramInfo(gl, [vsBasic, fsBasic])
    this.objectShader = createProgramInfo(
      gl,
      [vsObject, fsObject],
      ['position', 'indices', 'uv'],
    )
    this.chunkShader = createProgramInfo(
      gl,
      [vsChunk, fsChunk],
      ['position', 'indices', 'uv', 'shade', 'texInd'],
    )
    this.tileTexture = createTexture(gl, {
      src: '/tileset.png',
      target: gl.TEXTURE_2D_ARRAY,
      min: gl.LINEAR,
      mag: gl.NEAREST,
      width: 16,
      height: 16,
    })
    this.noTexture = createTexture(gl, {
      src: [255, 0, 255, 255],
    })

    this.blockHighlight.bufferInfo = primitives.createCubeBufferInfo(gl, 1.005)

    window.addEventListener('resize', () => {
      this.camera.aspect = this.width / this.height
      this.camera.updateProjection()
      resizeCanvasToDisplaySize(canvas)
    })

    this.initWorker()

    await this.loadModels()
  }

  public static get width() {
    return this.context.canvas.width
  }

  public static get height() {
    return this.context.canvas.height
  }

  public static render() {
    const gl = this.context

    if (Game.player) {
      this.camera.position.set(
        Game.player.position.x,
        Game.player.position.y + 0.8,
        Game.player.position.z,
      )
      this.camera.direction.set(
        Game.player.direction.x,
        Game.player.direction.y,
        Game.player.direction.z,
      )
    }

    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.viewport(0, 0, this.width, this.height)

    // Render color/depth
    gl.clearColor(0.7, 0.8, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.camera.render()
    ;(this.uniforms.fogEnd = (Renderer.viewDistance - 1) * Chunk.size),
      (this.uniforms.fogStart =
        (Renderer.viewDistance - 1) * Chunk.size * 0.75),
      (this.uniforms.tiles = this.tileTexture)
    m4.copy(this.camera.viewProjection, this.uniforms.viewProjection)
    this.uniforms.viewPosition[0] = this.camera.position.x
    this.uniforms.viewPosition[1] = this.camera.position.y
    this.uniforms.viewPosition[2] = this.camera.position.z

    const chunkDir = new Vector()
    const chunkHalfSize = Chunk.size / 2
    const chunkUniforms = {
      world: m4.identity(),
    }
    const chunkVisible = () => {
      // Checks if the center of any of the four cardinal planes are in front of the camera, if so assume the chunk is visible
      chunkDir.x += chunkHalfSize
      if (this.camera.direction.dot(chunkDir) >= 0) return true
      chunkDir.x -= Chunk.size
      if (this.camera.direction.dot(chunkDir) >= 0) return true
      chunkDir.x += chunkHalfSize
      chunkDir.z += chunkHalfSize
      if (this.camera.direction.dot(chunkDir) >= 0) return true
      chunkDir.z -= Chunk.size
      if (this.camera.direction.dot(chunkDir) >= 0) return true

      return false
    }
    const drawObject = (object: Doodad, highlight: boolean) => {
      const model = this.models[object.name]

      if (model) {
        gl.useProgram(this.objectShader.program)
        setBuffersAndAttributes(gl, this.objectShader, model.bufferInfo)
        setUniforms(this.objectShader, {
          ...this.uniforms,
          diffuse: model.texture,
          alphaCutoff: model.alphaCutoff ?? 1,
          flags: highlight ? 1 : 0,
          world: m4.translation([
            object.position.x,
            object.position.y,
            object.position.z,
          ]),
        })
        drawBufferInfo(gl, model.bufferInfo)
      }
    }

    const aimed = Physics.getAimedItem()

    this.chunkMeshes.forEach(chunk => {
      chunkDir.set(
        chunk.x * Chunk.size + Chunk.size / 2 - this.camera.position.x,
        chunk.y * Chunk.size + Chunk.size / 2 - this.camera.position.y,
        chunk.z * Chunk.size + Chunk.size / 2 - this.camera.position.z,
      )

      if (!chunkVisible()) return

      gl.useProgram(this.chunkShader.program)
      setUniforms(this.chunkShader, this.uniforms)
      m4.translation(
        [chunk.x * Chunk.size, chunk.y * Chunk.size, chunk.z * Chunk.size],
        chunkUniforms.world,
      )
      setBuffersAndAttributes(gl, this.chunkShader, chunk.bufferInfo)
      setUniforms(this.chunkShader, chunkUniforms)
      drawBufferInfo(gl, chunk.bufferInfo)

      gl.disable(gl.CULL_FACE)
      for (let name in chunk.objects) {
        chunk.objects[name].forEach(object => {
          const doodad = Doodad.fromId(object.id)
          const highlight = aimed?.type === 'object' && aimed.id === object.id

          if (doodad) drawObject(doodad, highlight)
        })
      }
      gl.enable(gl.CULL_FACE)
    })

    if (aimed?.type === 'voxel') {
      m4.translation(
        [
          aimed.position[0] + 0.5,
          aimed.position[1] + 0.5,
          aimed.position[2] + 0.5,
        ],
        this.uniforms.world,
      )

      gl.enable(gl.BLEND)
      gl.disable(gl.CULL_FACE)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(this.basicShader.program)
      setBuffersAndAttributes(
        gl,
        this.basicShader,
        this.blockHighlight.bufferInfo,
      )
      setUniforms(this.basicShader, this.uniforms)
      drawBufferInfo(gl, this.blockHighlight.bufferInfo)
    }
  }

  public static async addChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static async updateChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static async remChunk(chunk: Chunk) {
    this.chunkMeshes.delete(chunk.key)
  }

  public static addPlayer(player: Player) {}

  public static getViewPosition() {
    return this.camera.position
  }

  public static getViewDirection() {
    return this.camera.direction
  }

  private static async loadModel(name: string) {
    const loader = new GltfLoader(`/${name}.glb`)
    await loader.ready

    const buffers = loader.getBuffers(0)[0]
    const arrays = Object.entries(buffers).reduce((acc, entry) => {
      if (entry[1]) {
        acc[entry[0]] = entry[1].buffer
      }

      return acc
    }, {})

    this.models[name] = {
      bufferInfo: createBufferInfoFromArrays(this.context, arrays),
    }

    const textureData = loader.getTextureData(0)
    if (textureData) {
      const texture = createTexture(this.context, {
        src: `data:${textureData.mimeType};base64,${btoa(
          String.fromCharCode.apply(null, textureData.buffer),
        )}`,
        min: this.context.LINEAR,
        mag: this.context.NEAREST,
      })

      this.models[name].texture = texture

      if ('tree grass'.includes(name)) {
        this.models[name].alphaCutoff = 0.5
      }
    } else {
      this.models[name].texture = this.noTexture
    }
  }

  private static async loadModels() {
    await Promise.all([
      this.loadModel('tree'),
      this.loadModel('tree2'),
      this.loadModel('pumpkin'),
      this.loadModel('fox'),
      this.loadModel('ocelot'),
      this.loadModel('grass2'),
      this.loadModel('cactus'),
    ])
  }

  private static initWorker() {
    const gl = this.context

    this.meshWorker.onmessage = (event: MessageEvent) => {
      const { x, y, z, attributes, objects } = event.data

      if (!attributes.positions.length) return

      const key = digitKey(x, y, z)
      this.chunkAttrs.set(key, attributes)

      this.chunkMeshes.set(key, {
        x,
        y,
        z,
        objects,
        bufferInfo: createBufferInfoFromArrays(this.context, {
          position: {
            data: attributes.positions,
            type: (gl.UNSIGNED_BYTE as unknown) as Function,
            numComponents: 3,
            normalize: false,
          },
          indices: attributes.indices,
          uv: {
            data: attributes.uvs,
            type: (gl.UNSIGNED_BYTE as unknown) as Function,
            normalize: false,
            numComponents: 2,
          },
          shade: {
            data: attributes.colors,
            type: (gl.UNSIGNED_BYTE as unknown) as Function,
            normalize: false,
            numComponents: 1,
          },
          // normal: attributes.normals,
          texInd: {
            data: attributes.texInds,
            type: (gl.UNSIGNED_BYTE as unknown) as Function,
            normalize: false,
            numComponents: 1,
          },
        }),
      })
    }
  }

  public static getChunkAttributes(key: number) {
    return this.chunkAttrs.get(key)
  }
}
