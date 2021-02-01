import { SinonStatic } from 'sinon'
import Chai from 'chai'

declare global {
  const Sinon: SinonStatic
  const expect: Chai.ExpectStatic
}
