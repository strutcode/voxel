import {
  AmmoJSPlugin,
  Buffer,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  FreeCamera,
  Material,
  Matrix,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PhysicsImpostor,
  Quaternion,
  RawTexture2DArray,
  Scene,
  SceneLoader,
  ShaderMaterial,
  TargetCamera,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF/2.0'
import vs from '../graphics/vs.glsl'
import fs from '../graphics/fs.glsl'
import Chunk from '../voxel/Chunk'
import Ammo from '../../../ammojs/builds/ammo.wasm.js'
import ObjectInfo from '../graphics/ObjectInfo'
import Player from '../Player'
import Mobile from '../Mobile'

export default class BabylonImplementation {
  private static engine: Engine
  private static scene: Scene
  private static camera: FreeCamera
  private static blockMaterial: ShaderMaterial
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static deleteQueue = new Set<string>()
  private static objects: Record<string, ObjectInfo> = {}
  private static _init = false

  public static async init() {
    if (this._init) return
    this._init = true

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
    const engine = (this.engine = new Engine(canvas, false))
    const scene = (this.scene = new Scene(engine))

    scene.ambientColor = Color3.White()
    scene.clearColor = new Color4(0.7, 0.8, 1, 1)
    scene.fogEnabled = true
    scene.fogEnd = 11 * 32
    scene.fogStart = scene.fogEnd * 0.75
    scene.fogMode = Scene.FOGMODE_LINEAR
    scene.fogColor.set(
      scene.clearColor.r,
      scene.clearColor.g,
      scene.clearColor.b,
    )
    scene['_skipFrustumClipping'] = true // Force this because it's too slow

    // Then formed the earth from dust
    this.blockMaterial = new ShaderMaterial(
      '',
      scene,
      { vertexSource: vs, fragmentSource: fs },
      {
        attributes: ['position', 'uv', 'texInd', 'shade'],
        uniforms: ['world', 'view', 'worldViewProjection', 'viewPosition'],
      },
    )
    this.blockMaterial.setFloat('fogStart', scene.fogStart)
    this.blockMaterial.setFloat('fogEnd', scene.fogEnd)
    this.blockMaterial.setArray3('fogColor', [
      scene.fogColor.r,
      scene.fogColor.g,
      scene.fogColor.b,
    ])

    const img = await new Promise<Image>((resolve) => {
      const img = new Image()
      img.src = '/tileset.png'
      img.onload = () => resolve(img)
    })
    const data = await createImageBitmap(img)
    const textureArray = new RawTexture2DArray(
      data,
      16,
      16,
      data.height / 16,
      Engine.TEXTUREFORMAT_RGBA,
      scene,
      false,
      false,
      Texture.NEAREST_LINEAR_MIPLINEAR,
    )

    textureArray.wrapU = Texture.CLAMP_ADDRESSMODE
    textureArray.wrapV = Texture.CLAMP_ADDRESSMODE
    textureArray.wrapR = Texture.CLAMP_ADDRESSMODE

    this.blockMaterial.setTexture('tiles', textureArray)

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

    await this.loadAssets()

    // Lights...
    const sun = new DirectionalLight('sun', new Vector3(1, -1, 0.5), scene)

    // Camera...
    scene.createDefaultCamera(false)
    scene.activeCamera?.attachControl(canvas)

    const camera = (this.camera = scene.activeCamera as FreeCamera)
    camera.speed = 0.5
    camera.position.y = 40

    // Action!
    this.initMeshWorker()

    engine.runRenderLoop(() => {
      //   this.render()
    })

    window.addEventListener('resize', () => {
      engine.resize()
    })
  }

  public static async loadAssets() {
    const loadAsset = async (name: string) => {
      const scene = await SceneLoader.ImportMeshAsync(
        undefined,
        '/',
        `${name}.glb`,
      )

      const firstMesh = scene.meshes.find((mesh) => mesh.name !== '__root__')

      firstMesh.isVisible = true
      firstMesh.alwaysSelectAsActiveMesh = true

      const material = firstMesh.material as PBRMaterial | null
      if (material) {
        material.ambientColor = Color3.White()
        material.albedoTexture.wrapU = Texture.CLAMP_ADDRESSMODE
        material.albedoTexture.wrapV = Texture.CLAMP_ADDRESSMODE

        if (name == 'grass2') {
          material.albedoTexture.hasAlpha = true
          material.transparencyMode = Material.MATERIAL_ALPHATEST
          material.alphaCutOff = 0.5
        }
      }

      this.objects[name] = new ObjectInfo(firstMesh as Mesh)
    }

    await loadAsset('tree')
    await loadAsset('pumpkin')
    await loadAsset('fox')
    await loadAsset('ocelot')
    await loadAsset('grass2')
    await loadAsset('cactus')
  }

  public static setViewPosition(player: Player) {
    const camera = this.scene.activeCamera as TargetCamera

    camera.position.x = player.position.x
    camera.position.y = player.position.y
    camera.position.z = player.position.z

    const result = new Vector3()
    Vector3.Forward().rotateByQuaternionToRef(
      Quaternion.RotationYawPitchRoll(player.yaw, player.pitch, 0),
      result,
    )
    camera.setTarget(camera.position.add(result))
  }

  public static getViewPosition() {
    return this.camera.position
  }

  public static async renderAddChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static async renderRemChunk(chunk: Chunk) {
    this.deleteQueue.add(`${chunk.x},${chunk.y},${chunk.z}`)
  }

  public static async renderAddPlayer(player: Player) {
    this.scene.activeCamera = new TargetCamera('', Vector3.Zero(), this.scene)
  }

  public static async renderAddMob(mob: Mobile) {}

  public static async renderDelMob(mob: Mobile) {}

  public static async physicsAddChunk(chunk: Chunk) {
    const mesh = this.scene.getMeshByName(`${chunk.x},${chunk.y},${chunk.z}`)
    if (mesh && !mesh.physicsImpostor) {
      const original = mesh.getChildMeshes
      mesh.getChildMeshes = () => []

      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        PhysicsImpostor.MeshImpostor,
        { mass: 0 },
        this.scene,
      )
      // mesh.showBoundingBox = true

      mesh.getChildMeshes = original
    }
  }

  public static async physicsRemChunk(chunk: Chunk) {
    const mesh = this.scene.getMeshByName(`${chunk.x},${chunk.y},${chunk.z}`)
    if (mesh && mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose()
      mesh.physicsImpostor = null
      // mesh.showBoundingBox = false
    }
  }

  public static async physicsAddPlayer(player: Player) {
    const mesh = MeshBuilder.CreateBox('', {
      width: 0.8,
      depth: 0.8,
      height: 1.7,
    })

    mesh.position.x = player.position.x
    mesh.position.y = player.position.y
    mesh.position.z = player.position.z

    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.CapsuleImpostor,
      { mass: 1 },
    )
  }

  public static async physicsAddMob(mob: Mobile) {}

  public static async physicsDelMob(mob: Mobile) {}

  public static render() {
    this.blockMaterial.setVector3(
      'viewPosition',
      this.scene.activeCamera.position,
    )

    this.deleteQueue.forEach((key) => {
      const mesh = this.scene.getMeshByName(key)

      if (mesh) {
        mesh.dispose()
        this.deleteQueue.delete(key)
      }

      Object.values(this.objects).forEach((objInfo) => {
        objInfo.removeRange(key)
      })
    })

    this.scene.render()
  }

  private static initMeshWorker() {
    this.meshWorker.onmessage = (event: MessageEvent) => {
      const { x, y, z, attributes, objects } = event.data

      const key = `${x},${y},${z}`

      const mesh = new Mesh(key, this.scene)
      const vertData = new VertexData()
      vertData.positions = attributes.positions
      vertData.indices = attributes.indices
      vertData.uvs = attributes.uvs
      mesh.setVerticesBuffer(
        new Buffer(this.engine, attributes.texInd, false, 1).createVertexBuffer(
          'texInd',
          0,
          1,
        ),
      )
      mesh.setVerticesBuffer(
        new Buffer(this.engine, attributes.colors, false, 1).createVertexBuffer(
          'shade',
          0,
          1,
        ),
      )
      vertData.applyToMesh(mesh)

      mesh.material = this.blockMaterial

      mesh.position = new Vector3(
        x * Chunk.size,
        y * Chunk.size,
        z * Chunk.size,
      )

      mesh.isPickable = false
      mesh.alwaysSelectAsActiveMesh = true

      Object.entries(objects).forEach(([name, objects]) => {
        const objInfo = this.objects[name]

        if (objInfo) {
          const buffer = new Float32Array(objects.length * 16)

          objects.forEach((object, i) => {
            const scale = object.scale ?? 1
            const rotRadians = (object.rotation ?? 0) * 0.0174533
            const mat = Matrix.Scaling(scale, scale, scale)
              .multiply(Matrix.RotationY(rotRadians))
              .setTranslationFromFloats(
                -x * Chunk.size - object.x - 0.5, // Inverse because of gltf coordinates
                y * Chunk.size + object.y,
                z * Chunk.size + object.z + 0.5,
              )

            for (let c = 0; c < 16; c++) {
              buffer[i * 16 + c] = mat.m[c]
            }
          })

          objInfo.addRange(key, buffer)
        }
      })
    }
  }
}
