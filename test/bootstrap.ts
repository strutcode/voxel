import Chai from 'chai'
import Sinon from 'sinon'
import SinonChai from 'sinon-chai'

Chai.use(SinonChai)

Object.assign(global, {
  expect: Chai.expect,
  Sinon,
  Worker: class MockWorker {},
})

afterEach(() => {
  Sinon.reset()
})
