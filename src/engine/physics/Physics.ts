import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'
import Player from '../Player'
import Vector from '../math/Vector'
import Renderer from '../graphics/Renderer'
import AmmoModule, { Ammo as AmmoType } from 'ammo.js'
import Game from '../../Game'

let Ammo: typeof AmmoType

interface ChunkBody {
  mesh: AmmoType.btTriangleMesh
  shape: AmmoType.btBvhTriangleMeshShape
  body: AmmoType.btRigidBody
  motionState: AmmoType.btDefaultMotionState
}

export default class Physics {
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
    this.updateAimedVoxel()
  }

  public static addChunk(chunk: Chunk) {
    const key = chunk.key

    if (this.chunkObjects.has(key)) return

    const buffers = Renderer.getChunkAttributes(key)
    if (!buffers) return
    if (!buffers.positions.length) return

    const mesh = new Ammo.btTriangleMesh()
    const indices = buffers.indices
    const vertices = buffers.positions
    const pointA = new Ammo.btVector3()
    const pointB = new Ammo.btVector3()
    const pointC = new Ammo.btVector3()

    let a, b, c, i
    for (i = 0; i < indices.length; i++) {
      a = indices[i] * 3
      b = indices[i + 1] * 3
      c = indices[i + 2] * 3

      pointA.setValue(vertices[a], vertices[a + 1], vertices[a + 2])
      pointB.setValue(vertices[b], vertices[b + 1], vertices[b + 2])
      pointC.setValue(vertices[c], vertices[c + 1], vertices[c + 2])

      mesh.addTriangle(pointA, pointB, pointC)
    }

    const shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true)
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(
      new Ammo.btVector3(
        chunk.x * Chunk.size,
        chunk.y * Chunk.size,
        chunk.z * Chunk.size,
      ),
    )
    const motionState = new Ammo.btDefaultMotionState(transform)
    const constInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      motionState,
      shape,
    )
    const body = new Ammo.btRigidBody(constInfo)
    body.setCollisionFlags(1)
    this.world.addRigidBody(body, 2 | 32, 2 | 32)

    this.chunkObjects.set(key, {
      mesh,
      shape,
      body,
      motionState,
    })

    // Clean up
    Ammo.destroy(transform)
    Ammo.destroy(constInfo)
    Ammo.destroy(pointA)
    Ammo.destroy(pointB)
    Ammo.destroy(pointC)
  }

  public static updateChunk(chunk: Chunk) {
    this.remChunk(chunk)
    this.addChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    const ref = this.chunkObjects.get(chunk.key)

    if (!ref) return

    this.world.removeRigidBody(ref.body)

    // Clean up
    // TODO: For some reason these all crash because the objects don't have destructors?
    // Ammo.destroy(ref.mesh)
    // Ammo.destroy(ref.shape)
    // Ammo.destroy(ref.body)
    // Ammo.destroy(ref.motionState)

    this.chunkObjects.delete(chunk.key)
  }

  public static addPlayer(player: Player) {
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
    this.world
      .getPairCache()
      .setInternalGhostPairCallback(new Ammo.btGhostPairCallback())
    this.playerTransform = ghost.getWorldTransform()
    this.playerController = new Ammo.btKinematicCharacterController(
      ghost,
      shape,
      1,
    )
    this.world.addCollisionObject(ghost, 32, 1 | 2)
    this.world.addAction(this.playerController)
  }

  private static lastFly = false
  public static syncPlayer(player: Player) {
    if (!this.playerController) return

    // Kill velocity when switching to fly mode
    if (player.fly && !this.lastFly) {
      this.playerController.setVelocityForTimeInterval(
        new Ammo.btVector3(0, 0, 0),
        0,
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

  public static updateAimedVoxel() {
    const position = Renderer.getViewPosition()
    const direction = Renderer.getViewDirection()

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

      this.aimedBlock = new Vector(
        Math.floor(hit.x() - normal.x() * 0.5),
        Math.floor(hit.y() - normal.y() * 0.5),
        Math.floor(hit.z() - normal.z() * 0.5),
      )
    } else {
      this.aimedBlock = null
    }
  }

  public static getAimedVoxel() {
    return this.aimedBlock
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
