import {
  ArcRotateCamera,
  CascadedShadowGenerator,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Material,
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

    // Lights...
    const sky = new HemisphericLight('sky', Vector3.Up(), scene)
    sky.diffuse = Color3.FromHexString('#ABB9BC')
    sky.groundColor = Color3.FromHexString('#492A13')
    sky.intensity = 0.5
    const sun = new DirectionalLight('sun', new Vector3(1, -1, 1), scene)
    // const shadow = new CascadedShadowGenerator(1024, sun, true)

    // sun.autoUpdateExtends = true
    // sun.autoCalcShadowZBounds = true
    // shadow.bias = 0.001
    // shadow.normalBias = 0.01
    // setTimeout(() => {
    //   shadow.autoCalcDepthBounds = true
    //   shadow.autoCalcDepthBoundsRefreshRate = 2
    // })

    // Camera...
    scene.createDefaultCamera(true)
    scene.activeCamera?.attachControl(canvas)
    ;(scene.activeCamera as ArcRotateCamera).radius = 32

    // MeshBuilder.CreateBox('', {}, scene)

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
    mat.backFaceCulling = false
    // mat.alpha = 0.5
    // mat.alphaMode = Material.MATERIAL_ALPHABLEND
    mesh.material = mat
  }

  public static delChunk(chunk: Chunk) {}
}
