import {
  AbstractMesh,
  AmmoJSPlugin,
  CannonJSPlugin,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  FreeCamera,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import vs from './vs.glsl'
import fs from './fs.glsl'
import Chunk from './Chunk'
import Ammo from 'ammo.js/builds/ammo.js'

export default class Renderer {
  private static scene: Scene
  private static camera: FreeCamera
  private static blockMaterial: ShaderMaterial
  private static meshWorker = new Worker('./ChunkMesher.worker.ts')
  private static deleteQueue = new Set<string>()

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

    // First the programmer gods created the engine
    const engine = new Engine(canvas)
    const scene = (this.scene = new Scene(engine))

    scene.ambientColor = Color3.White()
    scene.clearColor = new Color4(0.7, 0.8, 1, 1)

    // Then formed the earth from dust
    this.blockMaterial = new ShaderMaterial(
      '',
      scene,
      { vertexSource: vs, fragmentSource: fs },
      { attributes: ['position', 'normal'], uniforms: ['worldViewProjection'] },
    )

    const mainTexture = new Texture(
      'grass.png',
      scene,
      false,
      false,
      Texture.NEAREST_SAMPLINGMODE,
    )
    this.blockMaterial.setTexture('mainTex', mainTexture)

    // And made it move
    scene.enablePhysics(
      new Vector3(0, -9.87, 0),
      new AmmoJSPlugin(undefined, await Ammo()),
    )

    // And all was good
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'b') {
        const mesh = MeshBuilder.CreateBox('', {}, scene)
        mesh.position = camera.getTarget()
        mesh.isPickable = false
        mesh.physicsImpostor = new PhysicsImpostor(
          mesh,
          PhysicsImpostor.BoxImpostor,
          { mass: 1 },
          scene,
        )
        mesh.onAfterRenderObservable.add(() => {
          if (mesh.position.y < -10) {
            mesh.dispose()
          }
        })
      }
    })

    // Lights...
    const sun = new DirectionalLight('sun', new Vector3(1, -1, 0.5), scene)

    // Camera...
    scene.createDefaultCamera(false)
    scene.activeCamera?.attachControl(canvas)

    const camera = (this.camera = scene.activeCamera as FreeCamera)
    camera.speed = 5
    camera.position.y = 40

    // Action!
    this.initMeshWorker()

    engine.runRenderLoop(() => {
      this.render()
    })

    window.addEventListener('resize', () => {
      engine.resize()
    })
  }

  public static getViewPosition() {
    return this.camera.position
  }

  public static newChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static delChunk(chunk: Chunk) {
    this.deleteQueue.add(`${chunk.x},${chunk.y},${chunk.z}`)
  }

  public static enablePhysics(chunk: Chunk) {
    const mesh = this.scene.getMeshByName(`${chunk.x},${chunk.y},${chunk.z}`)

    if (mesh && !mesh.physicsImpostor) {
      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        PhysicsImpostor.MeshImpostor,
        { mass: 0 },
        this.scene,
      )
    }
  }

  public static disablePhysics(chunk: Chunk) {
    const mesh = this.scene.getMeshByName(`${chunk.x},${chunk.y},${chunk.z}`)

    if (mesh && mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose()
    }
  }

  private static render() {
    this.deleteQueue.forEach((key) => {
      const mesh = this.scene.getMeshByName(key)

      if (mesh) {
        mesh.dispose()
        this.deleteQueue.delete(key)
      }
    })

    this.scene.render()
  }

  private static initMeshWorker() {
    this.meshWorker.onmessage = (event: MessageEvent) => {
      const { x, y, z, attributes } = event.data

      const mesh = new Mesh(`${x},${y},${z}`, this.scene)
      const vertData = new VertexData()
      vertData.positions = attributes.positions
      vertData.indices = attributes.indices
      vertData.normals = attributes.normals
      vertData.applyToMesh(mesh)

      mesh.material = this.blockMaterial

      mesh.position = new Vector3(
        x * Chunk.size,
        y * Chunk.size,
        z * Chunk.size,
      )

      mesh.isPickable = false
      mesh.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
    }
  }
}
