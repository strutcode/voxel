import Chunk from '../voxel/Chunk'
import Player from '../Player'
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
import Camera from './Camera'
import { digitKey } from '../math/Bitwise'
import vs from './vs.glsl'
import fs from './fs.glsl'
import vsBasic from './shaders/basic.vs.glsl'
import fsBasic from './shaders/basic.fs.glsl'
import World from '../World'

interface ChunkMesh {
  x: number
  y: number
  z: number
  bufferInfo: BufferInfo
}

interface ChunkAttributes {
  positions: Uint8Array
  indices: Uint32Array
}

export default class Renderer {
  private static camera = new Camera()
  private static context: WebGLRenderingContext
  private static chunkMeshes = new Map<number, ChunkMesh>()
  private static chunkAttrs = new Map<number, ChunkAttributes>()
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static basicShader: ProgramInfo
  private static chunkShader: ProgramInfo
  private static blockHighlight = {
    world: m4.identity(),
    bufferInfo: null,
  }
  private static texture: WebGLTexture
  private static uniforms = {
    world: m4.identity(),
    tiles: null,
    viewProjection: m4.identity(),
    viewPosition: new Float32Array(3),
    fogEnd: (World.viewDistance - 1) * Chunk.size,
    fogStart: (World.viewDistance - 1) * Chunk.size * 0.75,
    fogColor: new Float32Array([0.7, 0.8, 1]),
    color: new Float32Array([0.1, 0.1, 0.1, 1]),
  }

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
    this.chunkShader = createProgramInfo(
      gl,
      [vs, fs],
      ['position', 'indices', 'uv', 'shade', 'normal', 'texInd'],
    )
    this.texture = createTexture(gl, {
      src: '/tileset.png',
      target: gl.TEXTURE_2D_ARRAY,
      min: gl.LINEAR,
      mag: gl.NEAREST,
      width: 16,
      height: 16,
    })

    this.blockHighlight.bufferInfo = primitives.createCubeBufferInfo(gl, 1.005)

    window.addEventListener('resize', () => {
      this.camera.aspect = this.width / this.height
      this.camera.updateProjection()
    })

    this.initWorker()
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

    this.uniforms.tiles = this.texture
    m4.copy(this.camera.viewProjection, this.uniforms.viewProjection)
    this.uniforms.viewPosition[0] = this.camera.position.x
    this.uniforms.viewPosition[1] = this.camera.position.y
    this.uniforms.viewPosition[2] = this.camera.position.z

    gl.useProgram(this.chunkShader.program)
    setUniforms(this.chunkShader, this.uniforms)

    const chunkDir = new Vector()

    this.chunkMeshes.forEach(chunk => {
      chunkDir.set(
        chunk.x * Chunk.size + Chunk.size / 2 - this.camera.position.x,
        chunk.y * Chunk.size + Chunk.size / 2 - this.camera.position.y,
        chunk.z * Chunk.size + Chunk.size / 2 - this.camera.position.z,
      )
      chunkDir.normalize()

      if (this.camera.direction.dot(chunkDir) <= 0) {
        return
      }

      m4.translation(
        [chunk.x * Chunk.size, chunk.y * Chunk.size, chunk.z * Chunk.size],
        this.uniforms.world,
      )
      setBuffersAndAttributes(gl, this.chunkShader, chunk.bufferInfo)
      setUniforms(this.chunkShader, {
        world: this.uniforms.world,
      })
      drawBufferInfo(gl, chunk.bufferInfo)
    })

    const aimPos = Physics.getAimedVoxel()

    if (aimPos) {
      m4.translation(
        [aimPos.x + 0.5, aimPos.y + 0.5, aimPos.z + 0.5],
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
            type: (gl.BYTE as unknown) as Function,
            normalize: false,
            numComponents: 2,
          },
          shade: {
            data: attributes.colors,
            type: (gl.BYTE as unknown) as Function,
            normalize: false,
            numComponents: 1,
          },
          normal: attributes.normals,
          texInd: {
            data: attributes.texInds,
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
