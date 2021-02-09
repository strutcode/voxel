import {
  AbstractMesh,
  Color3,
  DirectionalLight,
  Engine,
  FreeCamera,
  Mesh,
  Scene,
  StandardMaterial,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import Chunk from './Chunk'
import ChunkMesher from './ChunkMesher'

export default class Renderer {
  private static scene: Scene

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

    // Lights...
    const sun = new DirectionalLight('sun', new Vector3(1, -1, 0.5), scene)

    // Camera...
    scene.createDefaultCamera(false)
    scene.activeCamera?.attachControl(canvas)

    const camera = scene.activeCamera as FreeCamera
    camera.position = new Vector3(32 * 16, 34, 32 * 16)
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
    vertData.applyToMesh(mesh)

    const mat = new StandardMaterial('', this.scene)
    mat.diffuseColor = new Color3(0.258545, 0.157138, 0.061421)
    mat.ambientColor = new Color3(0.113, 0.036, 0.014)
    mesh.material = mat

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
