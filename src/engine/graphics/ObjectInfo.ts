import { Mesh } from '@babylonjs/core'

export default class ObjectInfo {
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
