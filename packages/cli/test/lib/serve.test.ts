import { EventEmitter } from 'node:events'
import type { ChildProcess } from 'node:child_process'
import { mock } from 'node:test'
import { expect } from 'chai'
import { serve } from '../../lib/serve.js'

class Child extends EventEmitter {
  signals: NodeJS.Signals[] = []
  options: unknown

  kill(signal: NodeJS.Signals) {
    this.signals.push(signal)
    return true
  }

  send(options: unknown) {
    this.options = options
  }
}

function setup() {
  const children: Child[] = []
  const runtime = Object.assign(new EventEmitter(), { exitCode: undefined as NodeJS.Process['exitCode'] })
  const options = { variable: {}, watch: true }
  serve(options, {
    runtime,
    spawn() {
      const child = new Child()
      children.push(child)
      return child as unknown as ChildProcess
    },
  })
  return { children, runtime, options }
}

describe('kopflos/lib/serve', function () {
  beforeEach(function () {
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(function () {
    mock.timers.reset()
  })

  it('sends the options to the server child', function () {
    // Given
    const { children, options } = setup()

    // When
    const [child] = children

    // Then
    expect(child.options).to.equal(options)
  })

  it('coalesces restart requests and waits for the old child to exit', function () {
    // Given
    const { children } = setup()
    const [child] = children

    // When
    child.emit('message', 'restart')
    child.emit('message', 'restart')

    // Then
    expect(child.signals).to.deep.equal(['SIGTERM'])
    expect(children).to.have.length(1)

    // When
    child.emit('close', 0, null)
    mock.timers.tick(5000)

    // Then
    expect(children).to.have.length(2)
    expect(children[1].signals).to.deep.equal([])
  })

  it('kills an unresponsive child before starting a replacement', function () {
    // Given
    const { children } = setup()
    const [child] = children

    // When
    child.emit('message', 'restart')
    mock.timers.tick(5000)

    // Then
    expect(child.signals).to.deep.equal(['SIGTERM', 'SIGKILL'])
    expect(children).to.have.length(1)

    // When
    child.emit('close', null, 'SIGKILL')

    // Then
    expect(children).to.have.length(2)
  })

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    it(`stops the server when the supervisor receives ${signal}`, function () {
      // Given
      const { children, runtime } = setup()
      const [child] = children

      // When
      runtime.emit(signal)
      child.emit('message', 'restart')
      child.emit('close', 0, null)
      mock.timers.tick(5000)

      // Then
      expect(child.signals).to.deep.equal(['SIGTERM'])
      expect(children).to.have.length(1)
      expect(runtime.listenerCount(signal)).to.equal(0)
      expect(runtime.exitCode).to.equal(0)
    })
  }

  it('cancels a pending restart when stopping', function () {
    // Given
    const { children, runtime } = setup()
    const [child] = children
    child.emit('message', 'restart')

    // When
    runtime.emit('SIGTERM')
    child.emit('close', 0, null)

    // Then
    expect(children).to.have.length(1)
    expect(child.signals).to.deep.equal(['SIGTERM'])
  })

  it('force kills the child if shutdown hangs', function () {
    // Given
    const { children, runtime } = setup()
    const [child] = children

    // When
    runtime.emit('SIGTERM')
    runtime.emit('SIGTERM')
    mock.timers.tick(5000)

    // Then
    expect(child.signals).to.deep.equal(['SIGTERM', 'SIGKILL'])
    expect(children).to.have.length(1)
  })

  it('propagates unexpected server failures without restarting', function () {
    // Given
    const { children, runtime } = setup()
    const [child] = children

    // When
    child.emit('close', 1, null)

    // Then
    expect(runtime.exitCode).to.equal(1)
    expect(children).to.have.length(1)
    expect(runtime.listenerCount('SIGTERM')).to.equal(0)
  })
})
