import {
  AmmoJSPlugin,
  Buffer,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  FreeCamera,
  GlowLayer,
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
  SSAORenderingPipeline,
  StandardMaterial,
  TargetCamera,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF/2.0'
import vs from '../graphics/vs.glsl'
import fs from '../graphics/fs.glsl'
import Chunk from '../voxel/Chunk'
import AmmoModule, { Ammo as AmmoType } from 'ammo.js'
import ObjectInfo from '../graphics/ObjectInfo'
import Player from '../Player'
import Mobile from '../Mobile'
import Game from '../../Game'
import Vector from '../math/Vector'

let Ammo: typeof AmmoType
let rayCastResult: AmmoType.ClosestRayResultCallback

export default class BabylonImplementation {
  private static engine: Engine
  private static scene: Scene
  private static camera: FreeCamera
  private static blockMaterial: ShaderMaterial
  private static meshWorker = new Worker('../voxel/ChunkMesher.worker.ts')
  private static deleteQueue = new Set<string>()
  private static objects: Record<string, ObjectInfo> = {}
  private static _init = false
  private static chunkMesh: Record<string, Mesh> = {}
  private static physicsWorld: AmmoType.btSoftRigidDynamicsWorld
  private static playerTransform: AmmoType.btTransform
  private static playerController: AmmoType.btKinematicCharacterController
  private static aimedVoxelIndicator: Mesh

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
    scene.fogEnd = 16 * 32
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

    const img = await new Promise<Image>(resolve => {
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

    this.aimedVoxelIndicator = MeshBuilder.CreateBox('', { size: 1.01 })
    this.aimedVoxelIndicator.alwaysSelectAsActiveMesh = true
    this.aimedVoxelIndicator.isPickable = false
    const mat = new StandardMaterial('', scene)
    mat.disableLighting = true
    mat.emissiveColor = Color3.White()
    mat.alphaMode = Engine.ALPHA_ADD
    mat.alpha = 0.1
    this.aimedVoxelIndicator.material = mat

    // And made it move
    Ammo = await AmmoModule()
    const physicsPlugin = new AmmoJSPlugin(undefined, Ammo)
    this.physicsWorld = physicsPlugin.world
    rayCastResult = new Ammo.ClosestRayResultCallback()
    scene.enablePhysics(new Vector3(0, -9.87, 0), physicsPlugin)

    // And all was good
    window.addEventListener('keydown', ev => {
      if (ev.key === 'b') {
        const mesh = MeshBuilder.CreateBox('', {}, scene)
        mesh.position = (scene.activeCamera as TargetCamera).getTarget()
        mesh.isPickable = false
        mesh.physicsImpostor = new PhysicsImpostor(
          mesh,
          PhysicsImpostor.BoxImpostor,
          { mass: 1, group: 32, mask: 32 },
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

      const firstMesh = scene.meshes.find(mesh => mesh.name !== '__root__')

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
    await loadAsset('tree2')
    await loadAsset('pumpkin')
    await loadAsset('fox')
    await loadAsset('ocelot')
    await loadAsset('grass2')
    await loadAsset('cactus')
  }

  public static setViewPosition(player: Player) {
    const camera = this.scene.activeCamera as TargetCamera

    camera.position.x = player.position.x
    camera.position.y = player.position.y + 0.8
    camera.position.z = player.position.z

    const result = new Vector3()
    Vector3.Forward().rotateByQuaternionToRef(
      Quaternion.RotationYawPitchRoll(player.yaw, player.pitch, 0),
      result,
    )
    camera.setTarget(camera.position.add(result))
  }

  public static getViewPosition() {
    return this.scene.activeCamera.position
  }

  public static setAimedVoxel(target: Vector | null) {
    if (target == null) {
      this.aimedVoxelIndicator.isVisible = false
      return
    }

    this.aimedVoxelIndicator.isVisible = true
    this.aimedVoxelIndicator.position.x = target.x + 0.5
    this.aimedVoxelIndicator.position.y = target.y + 0.5
    this.aimedVoxelIndicator.position.z = target.z + 0.5
  }

  public static async renderAddChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static async renderUpdateChunk(chunk: Chunk) {
    this.meshWorker.postMessage(chunk.serialize())
  }

  public static async renderRemChunk(chunk: Chunk) {
    this.deleteQueue.add(`${chunk.x},${chunk.y},${chunk.z}`)
  }

  public static async renderAddPlayer(player: Player) {
    const camera = new TargetCamera('', Vector3.Zero(), this.scene)
    camera.minZ = 0.1
    camera.maxZ = 1000
    this.scene.activeCamera = camera

    const ssao = new SSAORenderingPipeline('ssao', this.scene, {
      ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
      combineRatio: 1.0, // Ratio of the combine post-process (combines the SSAO and the scene)
    })
    ssao.fallOff = 0.00001
    ssao.area = 1
    ssao.radius = 0.001
    ssao.totalStrength = 1.0
    ssao.base = 0.5

    this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
      'ssao',
      camera,
    )
  }

  public static async renderAddMob(mob: Mobile) {}

  public static async renderDelMob(mob: Mobile) {}

  public static async physicsAddChunk(chunk: Chunk | Mesh) {
    const mesh = chunk instanceof Mesh ? chunk : this.getChunkMesh(chunk)

    if (mesh && !mesh.physicsImpostor) {
      const original = mesh.getChildMeshes
      mesh.getChildMeshes = () => []

      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        PhysicsImpostor.MeshImpostor,
        { mass: 0, move: false, group: 2 | 32, mask: 2 | 32 },
        this.scene,
      )
      mesh.physicsImpostor.physicsBody.setCollisionFlags(1)
      // mesh.showBoundingBox = true

      mesh.getChildMeshes = original
    }
  }

  public static async physicsUpdateChunk(chunk: Chunk) {
    // Handled by the mesher
  }

  public static async physicsRemChunk(chunk: Chunk | Mesh) {
    const mesh = chunk instanceof Mesh ? chunk : this.getChunkMesh(chunk)

    if (mesh && mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose()
      mesh.physicsImpostor = null
      // mesh.showBoundingBox = false
    }
  }

  public static async physicsAddPlayer(player: Player) {
    const shape = new Ammo.btCapsuleShape(0.6 / 2, 1.7 / 2)
    const transform = new Ammo.btTransform()

    transform.setIdentity()
    transform.setOrigin(
      new Ammo.btVector3(
        player.position.x,
        player.position.y,
        player.position.z,
      ),
    )

    const ghost = new Ammo.btPairCachingGhostObject()
    ghost.setWorldTransform(transform)
    ghost.setCollisionShape(shape)
    ghost.setCollisionFlags(16)
    this.physicsWorld
      .getPairCache()
      .setInternalGhostPairCallback(new Ammo.btGhostPairCallback())

    this.playerTransform = ghost.getWorldTransform()
    this.playerController = new Ammo.btKinematicCharacterController(
      ghost,
      shape,
      1,
    )

    this.physicsWorld.addCollisionObject(ghost, 32, 1 | 2)
    this.physicsWorld.addAction(this.playerController)
  }

  private static lastFly = false
  public static physicsSyncPlayer(player: Player) {
    if (!this.playerController) return

    // Kill velocity when switching to fly mode
    if (player.fly && !this.lastFly) {
      this.playerController.setVelocityForTimeInterval(
        new Ammo.btVector3(0, 0, 0),
        1000,
      )
    }
    this.lastFly = player.fly

    this.playerController.setGravity(player.fly ? 0 : 9.87)
    this.playerController.setWalkDirection(
      new Ammo.btVector3(
        player.velocity.x,
        player.velocity.y,
        player.velocity.z,
      ),
    )

    const pos = this.playerTransform.getOrigin()
    player.position.x = pos.x()
    player.position.y = pos.y()
    player.position.z = pos.z()

    if (player.jumpIntent) {
      this.playerController.jump()
    }
  }

  public static physicsGetAimedVoxel(): Vector | null {
    const camera = this.scene.activeCamera as TargetCamera
    const direction = camera.target
      .subtract(camera.position)
      .multiplyByFloats(10, 10, 10)

    const from = new Ammo.btVector3(
      camera.position.x,
      camera.position.y,
      camera.position.z,
    )
    const to = new Ammo.btVector3(
      camera.position.x + direction.x,
      camera.position.y + direction.y,
      camera.position.z + direction.z,
    )
    rayCastResult = new Ammo.ClosestRayResultCallback(from, to)
    rayCastResult.set_m_collisionFilterMask(2 | 4)
    rayCastResult.set_m_collisionFilterGroup(2 | 4)
    this.physicsWorld.rayTest(from, to, rayCastResult)

    if (rayCastResult.hasHit()) {
      const normal = rayCastResult.get_m_hitNormalWorld()
      const f = rayCastResult.get_m_closestHitFraction() - 0.0001

      const result = new Vector(
        Math.floor(camera.position.x + direction.x * f - normal.x()),
        Math.floor(camera.position.y + direction.y * f - normal.y()),
        Math.floor(camera.position.z + direction.z * f - normal.z()),
      )

      return result
    }

    return null
  }

  public static async physicsAddMob(mob: Mobile) {}

  public static async physicsDelMob(mob: Mobile) {}

  public static render() {
    this.engine.beginFrame()

    this.blockMaterial.setVector3(
      'viewPosition',
      this.scene.activeCamera.position,
    )

    this.deleteQueue.forEach(key => {
      this.deleteChunkMesh(key)
    })

    this.scene.render()

    this.engine.endFrame()
  }

  private static initMeshWorker() {
    this.meshWorker.onmessage = (event: MessageEvent) => {
      const { x, y, z, attributes, objects } = event.data

      if (!attributes.positions.length) return

      const key = `${x},${y},${z}`

      let mesh: Mesh = this.getChunkMesh(key)

      if (!mesh) {
        mesh = new Mesh(key, this.scene)
        this.setChunkMesh(key, mesh)
      }

      const vertData = new VertexData()
      vertData.positions = attributes.positions
      vertData.indices = attributes.indices
      vertData.uvs = attributes.uvs
      vertData.applyToMesh(mesh)

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

      if (mesh.physicsImpostor) {
        this.physicsRemChunk(mesh)
        this.physicsAddChunk(mesh)
      }

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

            // const transform = new Ammo.btTransform()
            // transform.setIdentity()
            // transform.setOrigin(
            //   new Ammo.btVector3(
            //     x * Chunk.size + object.x + 0.5, // Inverse because of gltf coordinates
            //     y * Chunk.size + object.y + 1,
            //     z * Chunk.size + object.z + 0.5,
            //   ),
            // )
            // const info = new Ammo.btRigidBodyConstructionInfo(
            //   0,
            //   new Ammo.btDefaultMotionState(transform),
            //   new Ammo.btBoxShape(new Ammo.btVector3(0.5, 1, 0.5)),
            // )
            // const body = new Ammo.btRigidBody(info)
            // this.physicsWorld.addRigidBody(body, 4 | 32, 4 | 32)
          })

          objInfo.addRange(key, buffer)
        }
      })
    }
  }

  private static getChunkMesh(chunk: Chunk | string) {
    if (chunk instanceof Chunk) {
      return this.chunkMesh[`${chunk.x},${chunk.y},${chunk.z}`]
    }

    return this.chunkMesh[chunk]
  }

  private static setChunkMesh(key: string, mesh: Mesh) {
    this.chunkMesh[key] = mesh
  }

  private static deleteChunkMesh(key: string) {
    const mesh = this.getChunkMesh(key)

    if (mesh) {
      mesh.dispose()
      this.deleteQueue.delete(key)
      delete this.chunkMesh[key]
    }

    Object.values(this.objects).forEach(objInfo => {
      objInfo.removeRange(key)
    })
  }
}
