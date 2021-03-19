import Chunk from '../voxel/Chunk'
import Mobile from '../world/Mobile'
import Vector from '../math/Vector'
import AmmoModule, { Ammo as AmmoType } from 'ammo.js'
import PhysicsDecomposer from './PhysicsDecomposer'
import Database from '../Database'

let Ammo: typeof AmmoType

type ChunkBody = Array<{
  body: AmmoType.btRigidBody
  motionState: AmmoType.btDefaultMotionState
}>

type ObjectBody = Array<{
  body: AmmoType.btRigidBody
  motionState: AmmoType.btDefaultMotionState
}>

type ObjectSync = {
  id: number
  position: [number, number, number]
  rotation: [number, number, number, number]
}

enum CollisionFlags {
  None = 0,
  Static = 1,
  Kinematic = 2,
  NoContactResponse = 4,
  CustomMaterialCallback = 8,
  CharacterObject = 16,
  DisableVisualize = 32,
  DisableSpuProcessing = 64,
  HasContactStiffnessDamping = 128,
  HasCustomDebugColor = 256,
  HasFrictionAnchor = 512,
  HasCollisionSoundTrigger = 1024,
}

enum PhysicsFilter {
  Ground = 0b10,
  Object = 0b100,
  Player = 0b100000,
}

export default class PhysicsThread {
  private static world: AmmoType.btDiscreteDynamicsWorld
  private static playerTransform: AmmoType.btTransform
  private static playerController: AmmoType.btKinematicCharacterController
  private static chunkColliders = new Map<number, ChunkBody>()
  private static chunkObjects = new Map<number, ObjectBody>()
  private static objects = new Map<number, any>()
  private static activeObjects = new Map<number, any>()

  public static async init() {
    Ammo = await AmmoModule()

    const collisionConfig = new Ammo.btDefaultCollisionConfiguration()
    this.world = new Ammo.btDiscreteDynamicsWorld(
      new Ammo.btCollisionDispatcher(collisionConfig),
      new Ammo.btDbvtBroadphase(),
      new Ammo.btSequentialImpulseConstraintSolver(),
      collisionConfig,
    )
  }

  public static update() {
    this.world.stepSimulation(0.016666666666666666, 0)

    const objects: ObjectSync[] = []

    this.activeObjects.forEach((body, id) => {
      const transform = body.getWorldTransform()
      const position = transform.getOrigin()
      const rotation = transform.getRotation()

      objects.push({
        id,
        position: [position.x(), position.y(), position.z()],
        rotation: [rotation.x(), rotation.y(), rotation.z(), rotation.w()],
      })
    })

    postMessage({
      type: 'objectSync',
      objects,
    })
  }

  public static addChunk(chunk: Chunk) {
    const key = chunk.key

    if (this.chunkColliders.has(key)) return
    this.chunkColliders.set(key, [])

    if (chunk.isEmpty) return

    const transform = new Ammo.btTransform()
    const refs = [] as ChunkBody

    let shape

    if (chunk.isFull) {
      shape = new Ammo.btBoxShape(
        new Ammo.btVector3(Chunk.size / 2, Chunk.size / 2, Chunk.size / 2),
      )

      transform.setIdentity()
      transform.setOrigin(
        new Ammo.btVector3(
          chunk.x * Chunk.size + Chunk.size / 2,
          chunk.y * Chunk.size + Chunk.size / 2,
          chunk.z * Chunk.size + Chunk.size / 2,
        ),
      )
    } else {
      const mesh = PhysicsDecomposer.meshDecomposition(chunk, Ammo)

      shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true)

      transform.setIdentity()
      transform.setOrigin(
        new Ammo.btVector3(
          chunk.x * Chunk.size,
          chunk.y * Chunk.size,
          chunk.z * Chunk.size,
        ),
      )
    }

    const motionState = new Ammo.btDefaultMotionState(transform)
    const constInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      motionState,
      shape,
    )
    const body = new Ammo.btRigidBody(constInfo)
    body.setCollisionFlags(CollisionFlags.Static)
    this.world.addRigidBody(
      body,
      PhysicsFilter.Ground,
      PhysicsFilter.Ground | PhysicsFilter.Player,
    )

    refs.push({
      body,
      motionState,
    })
    Ammo.destroy(constInfo)

    this.chunkColliders.set(key, refs)

    const chunkObjects: ObjectBody = []

    for (let name in chunk.objects) {
      chunk.objects[name].forEach(object => {
        const info = Database.objectInfo(name)

        info.colliders.forEach(collider => {
          shape = new Ammo.btBoxShape(
            new Ammo.btVector3(collider.sizeX, collider.sizeY, collider.sizeZ),
          )

          transform.setIdentity()
          transform.setOrigin(
            new Ammo.btVector3(
              chunk.x * Chunk.size + object.x + collider.x,
              chunk.y * Chunk.size + object.y + 1 + collider.y,
              chunk.z * Chunk.size + object.z + collider.z,
            ),
          )

          const motionState = new Ammo.btDefaultMotionState(transform)
          const constInfo = new Ammo.btRigidBodyConstructionInfo(
            0,
            motionState,
            shape,
          )
          const body = new Ammo.btRigidBody(constInfo)

          body.setCollisionFlags(CollisionFlags.Static)
          body.setUserIndex(object.id)
          this.objects.set(object.id ?? 0, body)

          this.world.addRigidBody(
            body,
            PhysicsFilter.Object | PhysicsFilter.Ground,
            PhysicsFilter.Object | PhysicsFilter.Ground | PhysicsFilter.Player,
          )

          chunkObjects.push({
            body,
            motionState,
          })
          Ammo.destroy(constInfo)
        })
      })
    }
    this.chunkObjects.set(key, chunkObjects)

    // Clean up
    Ammo.destroy(transform)
  }

  public static updateChunk(chunk: Chunk) {
    this.remChunk(chunk)
    this.addChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    const key = chunk.key
    const refs = this.chunkColliders.get(key)

    if (!refs) return

    refs.forEach(ref => {
      this.world.removeRigidBody(ref.body)
      // TODO: For some reason this crashes
      // Ammo.destroy(ref.motionState)
    })

    const objs = this.chunkObjects.get(key)
    if (objs) {
      objs.forEach(obj => {
        this.world.removeRigidBody(obj.body)
      })
    }

    this.chunkColliders.delete(key)
  }

  public static addPlayer(position: Vector) {
    const shape = new Ammo.btCapsuleShape(0.6 / 2, 1.7 / 2)

    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z))

    const ghost = new Ammo.btPairCachingGhostObject()
    ghost.setWorldTransform(transform)
    ghost.setCollisionShape(shape)
    ghost.setCollisionFlags(CollisionFlags.CharacterObject)

    this.world
      .getPairCache()
      .setInternalGhostPairCallback(new Ammo.btGhostPairCallback())

    this.playerTransform = ghost.getWorldTransform()
    this.playerController = new Ammo.btKinematicCharacterController(
      ghost,
      shape,
      1.1,
    )
    this.playerController.setGravity(0)
    this.playerController.setJumpSpeed(30)

    this.world.addCollisionObject(
      ghost,
      PhysicsFilter.Player,
      PhysicsFilter.Ground | PhysicsFilter.Object,
    )
    this.world.addAction(this.playerController)
  }

  private static lastFly = false
  public static syncPlayer(
    velocity: Vector,
    fly: boolean,
    jumpIntent: boolean,
  ) {
    if (!this.playerController) return

    // Kill velocity when switching to fly mode
    if (fly && !this.lastFly) {
      this.playerController.setVelocityForTimeInterval(
        new Ammo.btVector3(0, 0, 0),
        1000,
      )
    }
    this.lastFly = fly

    this.playerController.setGravity(fly ? 0 : 9.87 ** 2)
    this.playerController.setWalkDirection(
      new Ammo.btVector3(velocity.x, velocity.y, velocity.z),
    )

    if (jumpIntent) {
      this.playerController.jump()
    }

    const pos = this.playerTransform.getOrigin()

    return new Vector(pos.x(), pos.y(), pos.z())
  }

  public static updateAimedItem(position: Vector, direction: Vector) {
    const from = new Ammo.btVector3(position.x, position.y, position.z)
    const to = new Ammo.btVector3(
      position.x + direction.x * 10,
      position.y + direction.y * 10,
      position.z + direction.z * 10,
    )
    const rayCastResult = new Ammo.ClosestRayResultCallback(from, to)
    rayCastResult.set_m_collisionFilterMask(
      PhysicsFilter.Ground | PhysicsFilter.Object,
    )
    rayCastResult.set_m_collisionFilterGroup(
      PhysicsFilter.Ground | PhysicsFilter.Object,
    )
    rayCastResult.set_m_flags(1 << 2)
    this.world.rayTest(from, to, rayCastResult)

    if (rayCastResult.hasHit()) {
      const hit = rayCastResult.get_m_hitPointWorld()
      const normal = rayCastResult.get_m_hitNormalWorld()
      const objectId = rayCastResult.get_m_collisionObject().getUserIndex()

      if (objectId) {
        postMessage({
          type: 'updateAimedItem',
          result: {
            type: 'object',
            id: objectId,
          },
        })
      } else {
        postMessage({
          type: 'updateAimedItem',
          result: {
            type: 'voxel',
            position: [
              Math.floor(hit.x() - normal.x() * 0.5),
              Math.floor(hit.y() - normal.y() * 0.5),
              Math.floor(hit.z() - normal.z() * 0.5),
            ],
          },
        })
      }
    } else {
      postMessage({
        type: 'updateAimedItem',
        result: null,
      })
    }
  }

  public static makeObjectActive(id: number) {
    const body = this.objects.get(id)

    if (body) {
      const shape = new Ammo.btCapsuleShape(0.5, 1, 0.5)
      const localInertia = new Ammo.btVector3(0, 0, 0)
      shape.calculateLocalInertia(1, localInertia)

      const oldOrigin = body.getWorldTransform().getOrigin()
      const transform = new Ammo.btTransform()
      transform.setIdentity()
      transform.setOrigin(
        new Ammo.btVector3(oldOrigin.x(), oldOrigin.y(), oldOrigin.z()),
      )

      const motionState = new Ammo.btDefaultMotionState(transform)
      const constInfo = new Ammo.btRigidBodyConstructionInfo(
        1,
        motionState,
        shape,
        localInertia,
      )
      const newBody = new Ammo.btRigidBody(constInfo)

      newBody.setUserIndex(id)
      this.objects.set(id, newBody)
      this.activeObjects.set(id, newBody)

      this.world.addRigidBody(
        newBody,
        PhysicsFilter.Player | PhysicsFilter.Object | PhysicsFilter.Ground,
        PhysicsFilter.Player | PhysicsFilter.Object | PhysicsFilter.Ground,
      )

      this.world.removeRigidBody(body)
    } else {
      console.log("it ain't no body")
    }
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
