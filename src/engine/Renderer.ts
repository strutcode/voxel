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
  RawTexture2DArray,
  Scene,
  SceneLoader,
  ShaderMaterial,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF/2.0'
import vs from './vs.glsl'
import fs from './fs.glsl'
import Chunk from './Chunk'
import Ammo from '../../ammojs/builds/ammo.wasm.js'

export class ObjectInfo {
  ranges: { key: string; start: number; end: number; length: number }[] = []
  buffer = new Float32Array(1024)
  bufferLength = 0

  constructor(public mesh: Mesh) {}

  public addRange(key: string, newBuffer: Float32Array) {
    const start = this.bufferLength
    const length = newBuffer.length

    if (start + length > this.buffer.length) {
      // Expand buffer
      const oldBuffer = this.buffer
      let newLength = oldBuffer.length * 2

      while (start + length > newLength) newLength *= 2

      this.buffer = new Float32Array(newLength)
      this.buffer.set(oldBuffer, 0)
    }

    this.buffer.set(newBuffer, start)
    this.ranges.push({
      key,
      start,
      end: start + length,
      length,
    })
    this.bufferLength += length

    this.mesh.thinInstanceSetBuffer('matrix', this.buffer, 16, true)
  }

  public removeRange(key) {
    const index = this.ranges.findIndex((r) => r.key === key)
    const range = this.ranges[index]

    if (index === -1) return

    // Shift left
    let lastStart = range.start
    for (let i = index + 1; i < this.ranges.length; i++) {
      this.buffer.copyWithin(
        lastStart,
        this.ranges[i].start,
        this.ranges[i].end,
      )

      this.ranges[i].start -= range.length
      this.ranges[i].end -= range.length
      lastStart += this.ranges[i].length
    }

    this.bufferLength -= range.length
    this.ranges.splice(index, 1)
  }
}

export default class Renderer {
  private static engine: Engine
  private static scene: Scene
  private static camera: FreeCamera
  private static blockMaterial: ShaderMaterial
  private static meshWorker = new Worker('./ChunkMesher.worker.ts')
  private static deleteQueue = new Set<string>()
  private static objects: Record<string, ObjectInfo> = {}

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
    const engine = (this.engine = new Engine(canvas))
    const scene = (this.scene = new Scene(engine))

    scene.ambientColor = Color3.White()
    scene.clearColor = new Color4(0.7, 0.8, 1, 1)
    scene.fogEnabled = true
    scene.fogEnd = 10 * 32
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
        attributes: ['position', 'uv', 'texInd'],
        uniforms: [
          'world',
          'view',
          'projection',
          'viewProjection',
          'worldViewProjection',
          'viewPosition',
        ],
      },
    )
    this.blockMaterial.setFloat('fogStart', scene.fogStart)
    this.blockMaterial.setFloat('fogEnd', scene.fogEnd)
    this.blockMaterial.setArray3('fogColor', [
      scene.fogColor.r,
      scene.fogColor.g,
      scene.fogColor.b,
    ])

    // new RawTexture2DArray(new Uint8Array(), 32, 32, 24, 0, scene)
    this.blockMaterial.setTextureArray('blockTex', [
      new Texture(
        'grass.png',
        scene,
        false,
        false,
        Texture.NEAREST_SAMPLINGMODE,
      ),
      new Texture(
        'dirtgrass.png',
        scene,
        false,
        false,
        Texture.NEAREST_SAMPLINGMODE,
      ),
      new Texture(
        'dirt.png',
        scene,
        false,
        false,
        Texture.NEAREST_SAMPLINGMODE,
      ),
    ])

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

        if (name == 'grass') {
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
    await loadAsset('grass')

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

  public static disablePhysics(chunk: Chunk) {
    const mesh = this.scene.getMeshByName(`${chunk.x},${chunk.y},${chunk.z}`)
    if (mesh && mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose()
      mesh.physicsImpostor = null
      // mesh.showBoundingBox = false
    }
  }

  public static update() {
    this.render()
  }

  private static render() {
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
