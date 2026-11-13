/* eslint-disable promise/catch-or-return, promise/always-return */
import { fork } from 'node:child_process'
import * as fs from 'node:fs'
import url from 'node:url'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { expect } from 'chai'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import type { ServeArgs } from '../../../lib/command/serve.js'

const serve = new URL('../../../lib/command/serve.js', import.meta.url)
const fixturesDir = new URL('../../fixtures/temp/', import.meta.url)

describe('kopflos/lib/command/serve', function () {
  this.timeout(10000)

  let process: ReturnType<typeof fork>

  beforeEach(createEmpty)

  before(function () {
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir)
    }
  })

  beforeEach(function () {
    process = fork(serve, {
      execArgv: ['--import', 'tsx'],
    })
  })

  afterEach(async function () {
    if (process.exitCode !== null || process.signalCode !== null) return

    const exited = once(process, 'exit')
    process.kill()
    await exited
  })

  it('waits for 200 ms of quiet before requesting one restart for staggered saves', async function () {
    // Given
    const messages: unknown[] = []
    await start()
    process.on('message', message => messages.push(message))
    const restarted = once(process, 'message')

    // When
    fs.writeFileSync(new URL('./burst-a.txt', fixturesDir), '')
    await delay(120)

    // Then
    expect(messages).to.deep.equal([])

    // When
    fs.writeFileSync(new URL('./burst-b.txt', fixturesDir), '')
    await delay(120)

    // Then
    expect(messages).to.deep.equal([])

    // When
    await restarted
    await delay(250)

    // Then
    expect(messages).to.deep.equal(['restart'])
  })

  it('exits when the supervisor disconnects', async function () {
    // Given
    await start()
    const exited = once(process, 'exit')

    // When
    process.disconnect()
    const [code] = await exited

    // Then
    expect(code).to.equal(0)
  })

  it('exits cleanly on SIGTERM', async function () {
    // Given
    await start()
    const exited = once(process, 'exit')

    // When
    process.kill('SIGTERM')
    const [code] = await exited

    // Then
    expect(code).to.equal(0)
  })

  async function start() {
    const ready = once(process, 'message')
    process.send({
      config: url.fileURLToPath(new URL('../../kopflos.config.ts', import.meta.url)),
      variable: {},
      watch: true,
      port: 0,
      host: '127.0.0.1',
    })
    await ready
  }

  after(function () {
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
          }
          else {
            done(new Error(`Unexpected message: ${message}`))
          }
        })

        new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => {
            fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
          })
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
          }
          else {
            done(new Error(`Unexpected message: ${message}`))
          }
        })

        new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => {
            fs.writeFileSync(new URL('./file.txt', fixturesDir), '')
          })
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
      process.once('message', (payload) => {
        if (payload === 'ready') {
          action(() => {
            done()
          })
        }
        else {
          done(new Error(`Unexpected message: ${payload}`))
        }
      })

      process.send({ port: 0, host: '127.0.0.1', ...args })
    }
  }
})
