import {
  AbstractMesh,
  Color3,
  DirectionalLight,
  Engine,
  FreeCamera,
  Mesh,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import vs from './vs.glsl'
import fs from './fs.glsl'
import Chunk from './Chunk'
import ChunkMesher from './ChunkMesher'
import World from './World'

export default class Renderer {
  private static scene: Scene
  private static blockMaterial: ShaderMaterial

  public static init() {
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

    const engine = new Engine(canvas)
    const scene = (this.scene = new Scene(engine))

    scene.ambientColor = Color3.White()

    const mat = (this.blockMaterial = new ShaderMaterial(
      '',
      scene,
      { vertexSource: vs, fragmentSource: fs },
      { attributes: ['position', 'normal'], uniforms: ['worldViewProjection'] },
    ))

    const mainTexture = new Texture(
      'grass.png',
      scene,
      true,
      false,
      Texture.NEAREST_SAMPLINGMODE,
    )
    mat.setTexture('mainTex', mainTexture)

    // Lights...
    const sun = new DirectionalLight('sun', new Vector3(1, -1, 0.5), scene)

    // Camera...
    scene.createDefaultCamera(false)
    scene.activeCamera?.attachControl(canvas)

    const camera = scene.activeCamera as FreeCamera
    camera.position = new Vector3(
      (World.size * Chunk.size) / 2,
      Chunk.size,
      (World.size * Chunk.size) / 2,
    )
    camera.target = camera.position.add(Vector3.Backward())
    camera.speed = 10

    // Action!
    engine.runRenderLoop(() => {
      scene.render()
    })

    window.addEventListener('resize', () => {
      engine.resize()
    })
  }

  public static newChunk(chunk: Chunk) {
    const mesh = new Mesh('', this.scene)
    const data = ChunkMesher.createMesh(chunk)
    const vertData = new VertexData()
    vertData.positions = data.positions
    vertData.indices = data.indices
    vertData.normals = data.normals
    vertData.applyToMesh(mesh)

    mesh.material = this.blockMaterial

    mesh.position = new Vector3(
      chunk.x * Chunk.size,
      chunk.y * Chunk.size,
      chunk.z * Chunk.size,
    )

    mesh.isPickable = false
    mesh.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
  }

  public static delChunk(chunk: Chunk) {}
}
