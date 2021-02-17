import { ObjectInfo } from './Renderer'

describe('ObjectInfo', () => {
  const fakeMesh = {
    thinInstanceSetBuffer: Sinon.stub(),
  }

  it('expands the internal buffer exponentially to fit new items')

  it('saves a record of data ranges for removal')

  it('allows removal of previously saved ranges', () => {
    let info

    info = new ObjectInfo(fakeMesh)
    info.addRange('a', new Float32Array([1, 2, 3]))
    info.addRange('b', new Float32Array([4, 5, 6]))
    info.removeRange('a')

    expect(info.bufferLength).to.equal(3)
    expect([...info.buffer.slice(0, 3)]).to.deep.equal([4, 5, 6])

    info = new ObjectInfo(fakeMesh)
    info.addRange('a', new Float32Array([1, 2]))
    info.addRange('b', new Float32Array([4, 5, 6, 7]))
    info.addRange('c', new Float32Array([8, 9, 10]))

    info.removeRange('a')

    expect(info.bufferLength).to.equal(7)
    expect([...info.buffer.slice(0, 7)]).to.deep.equal([4, 5, 6, 7, 8, 9, 10])

    info.removeRange('c')
    expect(info.bufferLength).to.equal(4)
    expect([...info.buffer.slice(0, 4)]).to.deep.equal([4, 5, 6, 7])

    info = new ObjectInfo(fakeMesh)
    info.addRange('a', new Float32Array([1, 2]))
    info.addRange('b', new Float32Array([4, 5, 6, 7]))
    info.addRange('c', new Float32Array([8, 9, 10]))

    info.removeRange('a')
    info.removeRange('b')

    expect(info.bufferLength).to.equal(3)
    expect([...info.buffer.slice(0, 3)]).to.deep.equal([8, 9, 10])
  })
})
