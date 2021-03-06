import VoxelUtil from './VoxelUtil'

describe('VoxelUtil', () => {
  describe('can find the hit location of a ray cast in the voxel world', () => {
    it('exits immediately on solid', () => {
      const isSolid = Sinon.stub().returns(true)
      expect(VoxelUtil.rayCast(0, 0, 0, 1, 0, 0, isSolid)).to.eql([0, 0, 0])
    })

    it('iterates along the shortest axis')

    it('finds the correct voxel')

    it('returns an exact hit location')
  })

  describe('can find the hit location of a bounding box in the voxel world', () => {
    it('uses the leading edge')

    it('iterates along the shortest axis')

    it('finds the correct voxel')

    it('accounts for large boxes')

    it('can slide using the remaining velocity')
  })
})
