import BabylonImplementation from '../external/BabylonImplementation'
import Chunk from '../voxel/Chunk'
import Vector from '../math/Vector'
import Player from '../Player'
import Game from '../../Game'
import Physics from '../physics/Physics'
import {
  BufferInfo,
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  getContext,
  m4,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from 'twgl.js'
import Camera from './Camera'
import { digitKey } from '../math/Bitwise'
import vs from './vs.glsl'
import fs from './fs.glsl'

interface ChunkMesh {
  x: number
  y: number
  z: number
  bufferInfo: BufferInfo
}

export default class Renderer {
  private static viewPos = new Vector()
  private static camera = new Camera()
  private static context: WebGLRenderingContext
  private static chunkMeshes = new Map<number, ChunkMesh>()
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static basicShader

  public static async init() {
    const container = document.getElementById('app')
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
    this.camera.aspect = this.width / this.height

    this.basicShader = createProgramInfo(this.context, [vs, fs])

    resizeCanvasToDisplaySize(canvas)

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
      this.camera.position = Game.player.position
    }

    // const aimPos = Physics.getAimedVoxel()

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.viewport(0, 0, this.width, this.height)

    // Render color/depth
    gl.clearColor(0.7, 0.8, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.camera.render(gl)

    gl.useProgram(this.basicShader.program)
    const uniforms = {
      world: m4.identity(),
      viewProjection: this.camera.viewProjection,
      viewPosition: this.camera.position.asArray,
    }

    for (let chunk of this.chunkMeshes.values()) {
      uniforms.world = m4.translation([chunk.x, chunk.y, chunk.z])
      setBuffersAndAttributes(gl, this.basicShader, chunk.bufferInfo)
      setUniforms(this.basicShader, uniforms)
      drawBufferInfo(gl, chunk.bufferInfo)
    }
  }

  public static async addChunk(chunk: Chunk) {
    // await BabylonImplementation.renderAddChunk(chunk)
  }

  public static async updateChunk(chunk: Chunk) {
    // await BabylonImplementation.renderUpdateChunk(chunk)
  }

  public static async remChunk(chunk: Chunk) {
    // await BabylonImplementation.renderRemChunk(chunk)
  }

  public static addPlayer(player: Player) {
    // BabylonImplementation.renderAddPlayer(player)
  }

  public static getViewPosition() {
    return this.camera.position
  }

  public static getViewDirection() {
    return this.camera.direction
  }

  private static initWorker() {
    this.meshWorker.onmessage = (event: MessageEvent) => {
      const { x, y, z, attributes, objects } = event.data

      if (!attributes.positions.length) return

      this.chunkMeshes.set(digitKey(x, y, z), {
        x,
        y,
        z,
        bufferInfo: createBufferInfoFromArrays(this.context, {
          positions: attributes.positions,
          indices: attributes.indices,
          uvs: attributes.uvs,
          colors: attributes.colors,
          texInd: attributes.texInds,
        }),
      })
    }
  }
}
