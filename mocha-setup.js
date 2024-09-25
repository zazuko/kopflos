import 'anylogger-console'
import * as chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import rdfPlugin from 'mocha-chai-rdf/matchers.js'

chai.use(rdfPlugin)
chai.use(sinonChai)
chai.use(chaiAsPromised)
