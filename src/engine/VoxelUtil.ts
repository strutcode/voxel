export default class VoxelUtil {
  public static rayCast(
    x: number,
    y: number,
    z: number,
    dx: number,
    dy: number,
    dz: number,
    isSolid: (x: number, y: number, z: number) => boolean,
  ): [number, number, number] | null {
    if (isSolid(x, y, z)) return [x, y, z]

    return null
  }

  public static boxCast(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    dx: number,
    dy: number,
    dz: number,
  ): [number, number, number] | null {
    return null
  }
}
