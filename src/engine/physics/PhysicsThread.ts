import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'
import Vector from '../math/Vector'
import AmmoModule, { Ammo as AmmoType } from 'ammo.js'
import PhysicsDecomposer from './PhysicsDecomposer'

let Ammo: typeof AmmoType

type ChunkBody = Array<{
  body: AmmoType.btRigidBody
  motionState: AmmoType.btDefaultMotionState
}>

export default class PhysicsThread {
  private static aimedBlock: Vector | null = null
  private static world: AmmoType.btDiscreteDynamicsWorld
  private static playerTransform: AmmoType.btTransform
  private static playerController: AmmoType.btKinematicCharacterController
  private static chunkObjects = new Map<number, ChunkBody>()

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
  }

  public static addChunk(chunk: Chunk) {
    const key = chunk.key

    if (this.chunkObjects.has(key)) return
    this.chunkObjects.set(key, [])

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
    body.setCollisionFlags(1)
    this.world.addRigidBody(body, 2 | 32, 2 | 32)

    refs.push({
      body,
      motionState,
    })
    Ammo.destroy(constInfo)

    this.chunkObjects.set(key, refs)

    // Clean up
    Ammo.destroy(transform)
  }

  public static updateChunk(chunk: Chunk) {
    this.remChunk(chunk)
    this.addChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    const key = chunk.key
    const refs = this.chunkObjects.get(key)

    if (!refs) return

    refs.forEach(ref => {
      this.world.removeRigidBody(ref.body)
      // TODO: For some reason this crashes
      // Ammo.destroy(ref.motionState)
    })

    this.chunkObjects.delete(key)
  }

  public static addPlayer(position: Vector) {
    const shape = new Ammo.btCapsuleShape(0.6 / 2, 1.7 / 2)

    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z))

    const ghost = new Ammo.btPairCachingGhostObject()
    ghost.setWorldTransform(transform)
    ghost.setCollisionShape(shape)
    ghost.setCollisionFlags(16)

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

    this.world.addCollisionObject(ghost, 32, 1 | 2)
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

    this.playerController.setGravity(fly ? 0 : 9.87)
    this.playerController.setWalkDirection(
      new Ammo.btVector3(velocity.x, velocity.y, velocity.z),
    )

    if (jumpIntent) {
      this.playerController.jump()
    }

    const pos = this.playerTransform.getOrigin()

    return new Vector(pos.x(), pos.y(), pos.z())
  }

  public static updateAimedVoxel(position: Vector, direction: Vector) {
    const from = new Ammo.btVector3(position.x, position.y, position.z)
    const to = new Ammo.btVector3(
      position.x + direction.x * 10,
      position.y + direction.y * 10,
      position.z + direction.z * 10,
    )
    const rayCastResult = new Ammo.ClosestRayResultCallback(from, to)
    rayCastResult.set_m_collisionFilterMask(2 | 4)
    rayCastResult.set_m_collisionFilterGroup(2 | 4)
    this.world.rayTest(from, to, rayCastResult)

    if (rayCastResult.hasHit()) {
      const hit = rayCastResult.get_m_hitPointWorld()
      const normal = rayCastResult.get_m_hitNormalWorld()

      postMessage({
        type: 'updateAimedVoxel',
        result: [
          Math.floor(hit.x() - normal.x() * 0.5),
          Math.floor(hit.y() - normal.y() * 0.5),
          Math.floor(hit.z() - normal.z() * 0.5),
        ],
      })
    } else {
      postMessage({
        type: 'updateAimedVoxel',
        result: null,
      })
    }
  }

  public static getAimedVoxel() {
    return this.aimedBlock
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
