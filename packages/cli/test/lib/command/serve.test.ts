import { fork } from 'node:child_process'
import * as fs from 'node:fs'
import url from 'node:url'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import type { ServeArgs } from '../../../lib/command/serve.js'

const serve = new URL('../../../lib/command/serve.js', import.meta.url)
const fixturesDir = new URL('../../fixtures/temp/', import.meta.url)

describe('kopflos/lib/command/serve', function () {
  this.timeout(10000)

  let process: ReturnType<typeof fork>

  beforeEach(createEmpty)

  beforeEach(function () {
    process = fork(serve)
    fs.mkdirSync(fixturesDir)
  })

  afterEach(function () {
    process.kill()
    fs.rmSync(fixturesDir, { recursive: true, force: true })
  })

  context('development mode', function () {
    context('watch enabled by default', function () {
      it('sends message to parent process when watched files change', runTest({
        config: url.fileURLToPath(new URL('../../kopflos.config.ts', import.meta.url)),
        variable: {},
        mode: 'development',
      }, function (done) {
        process.on('message', (message) => {
          if (message === 'restart') {
            done()
          } else {
            done(new Error(`Unexpected message: ${message}`))
          }
        })

        fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
      }))
    })

    context('watch disabled', function () {
      it('ignores filesystem changes', runTest({
        config: url.fileURLToPath(new URL('../../kopflos.config.ts', import.meta.url)),
        variable: {},
        mode: 'development',
        watch: false,
      }, function (done) {
        process.on('message', (message) => {
          done(new Error(`Unexpected message: ${message}`))
        })

        fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
        setTimeout(done, 1000)
      }))
    })
  })

  context('production mode', function () {
    context('watch enabled', function () {
      it('sends message to parent process when watched files change', runTest({
        config: url.fileURLToPath(new URL('../../kopflos.config.ts', import.meta.url)),
        variable: {},
        mode: 'production',
        watch: true,
      }, function (done) {
        process.on('message', (message) => {
          if (message === 'restart') {
            done()
          } else {
            done(new Error(`Unexpected message: ${message}`))
          }
        })

        fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
      }))
    })

    context('watch disabled by default', function () {
      it('ignores filesystem changes', runTest({
        config: url.fileURLToPath(new URL('../../kopflos.config.ts', import.meta.url)),
        variable: {},
        mode: 'production',
      }, function (done) {
        process.on('message', (message) => {
          done(new Error(`Unexpected message: ${message}`))
        })

        fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
        setTimeout(done, 1000)
      }))
    })
  })

  function runTest(args: ServeArgs, action: (done: Mocha.Done) => void): Mocha.Func {
    return function (done) {
      process.once('message', payload => {
        if (payload === 'ready') {
          action(() => {
            done()
            process.kill()
          })
        } else {
          done(new Error(`Unexpected message: ${payload}`))
        }
      })

      process.send(args)
    }
  }
})
