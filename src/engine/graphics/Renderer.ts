import BabylonImplementation from '../external/BabylonImplementation'
import Chunk from '../voxel/Chunk'
import Vector from '../math/Vector'
import Player from '../Player'
import Game from '../../Game'
import Physics from '../physics/Physics'
import {
  addExtensionsToContext,
  BufferInfo,
  createBufferInfoFromArrays,
  createProgramInfo,
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
import vs from './shaders/basic.vs.glsl'
import fs from './shaders/basic.fs.glsl'

interface ChunkMesh {
  x: number
  y: number
  z: number
  bufferInfo: BufferInfo
}

export default class Renderer {
  private static camera = new Camera()
  private static context: WebGLRenderingContext
  private static chunkMeshes = new Map<number, ChunkMesh>()
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static basicShader: ProgramInfo
  private static sphere: BufferInfo

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

    this.camera.aspect = this.width / this.height
    this.camera.position.set(0, 0, 0)
    this.camera.direction.set(0, 0, 1)

    this.basicShader = createProgramInfo(this.context, [vs, fs])

    this.sphere = primitives.createSphereBufferInfo(this.context, 1, 16, 16)

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
      this.camera.direction.set(
        Math.sin(Game.player.yaw) * Math.cos(Game.player.pitch),
        -Math.sin(Game.player.pitch),
        Math.cos(Game.player.yaw) * Math.cos(Game.player.pitch),
      )
    }

    // const aimPos = Physics.getAimedVoxel()

    // gl.enable(gl.DEPTH_TEST)
    // gl.enable(gl.CULL_FACE)
    gl.viewport(0, 0, this.width, this.height)

    // Render color/depth
    gl.clearColor(0.7, 0.8, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.camera.render()

    gl.useProgram(this.basicShader.program)
    const uniforms = {
      world: m4.translation([0, 0, 0]),
      viewProjection: this.camera.viewProjection,
      viewPosition: this.camera.position.asArray,
    }

    setBuffersAndAttributes(gl, this.basicShader, this.sphere)
    setUniforms(this.basicShader, uniforms)
    drawBufferInfo(gl, this.sphere)

    for (let chunk of this.chunkMeshes.values()) {
      uniforms.world = m4.translation([
        chunk.x * Chunk.size,
        chunk.y * Chunk.size,
        chunk.z * Chunk.size,
      ])
      setBuffersAndAttributes(gl, this.basicShader, chunk.bufferInfo)
      setUniforms(this.basicShader, uniforms)
      drawBufferInfo(gl, chunk.bufferInfo)
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
          uvs: {
            data: attributes.uvs,
            numComponents: 2,
          },
          colors: attributes.colors,
          normals: attributes.normals,
          texInd: {
            data: attributes.texInds,
            numComponents: 1,
          },
        }),
      })
    }
  }
}
