import Chunk from '../voxel/Chunk'
import Mobile from '../Mobile'
import Player from '../Player'
import Vector from '../math/Vector'
import Renderer from '../graphics/Renderer'
import AmmoModule, { Ammo as AmmoType } from 'ammo.js'
import Game from '../../Game'

let Ammo: typeof AmmoType

export default class Physics {
  private static aimedBlock: Vector | null = new Vector()
  private static world: AmmoType.btDiscreteDynamicsWorld
  private static playerTransform: AmmoType.btTransform
  private static playerController: AmmoType.btKinematicCharacterController

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
    this.updateAimedVoxel()
    this.world.stepSimulation(Game.deltaTimeMs)
  }

  public static addChunk(chunk: Chunk) {
    // BabylonImplementation.physicsAddChunk(chunk)
  }

  public static updateChunk(chunk: Chunk) {
    // BabylonImplementation.physicsUpdateChunk(chunk)
  }

  public static remChunk(chunk: Chunk) {
    // BabylonImplementation.physicsRemChunk(chunk)
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

  public static updateAimedVoxel() {
    const position = Renderer.getViewPosition()
    const direction = Renderer.getViewDirection()

    const from = new Ammo.btVector3(position.x, position.y, position.z)
    const to = new Ammo.btVector3(
      position.x + direction.x,
      position.y + direction.y,
      position.z + direction.z,
    )
    const rayCastResult = new Ammo.ClosestRayResultCallback(from, to)
    rayCastResult.set_m_collisionFilterMask(2 | 4)
    rayCastResult.set_m_collisionFilterGroup(2 | 4)
    this.world.rayTest(from, to, rayCastResult)

    if (rayCastResult.hasHit()) {
      const normal = rayCastResult.get_m_hitNormalWorld()
      const f = rayCastResult.get_m_closestHitFraction() - 0.0001

      const result = new Vector(
        Math.floor(position.x + direction.x * f - normal.x()),
        Math.floor(position.y + direction.y * f - normal.y()),
        Math.floor(position.z + direction.z * f - normal.z()),
      )

      return result
    }

    return null
  }

  public static getAimedVoxel() {
    return this.aimedBlock
  }

  public static addMobile(mob: Mobile) {}

  public static remMobile(mob: Mobile) {}
}
