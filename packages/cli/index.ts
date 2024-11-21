import 'ulog'
import { fork } from 'node:child_process'
import { program } from 'commander'
import log from '@kopflos-cms/logger'
import { variable } from './lib/options.js'
import deploy from './lib/command/deploy.js'
import build from './lib/command/build.js'

program.name('kopflos')

program.command('serve')
  .description('Start the server')
  .option('-m, --mode <mode>', 'Mode to run in (default: "production")')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port to listen on (default: 1429)', parseInt)
  .option('-h, --host <host>', 'Host to bind to (default: "0.0.0.0")')
  .addOption(variable)
  .option('--trust-proxy [proxy]', 'Trust the X-Forwarded-Host header')
  .option('--watch', 'Enable watching for changes')
  .option('--no-watch', 'Disable watching for changes')
  .action((options) => {
    (function serve() {
      // running the server in a forked process to be able to restart it
      // child process is necessary to bypass node module caching
      const proc = fork(new URL('./lib/command/serve.js', import.meta.url))

      proc.send(options)

      proc.on('message', (message) => {
        if (message === 'restart') {
          proc.kill()
          serve()
        } else {
          log.error(`Unknown message: ${message}`)
        }
      })
    })()
  })

program.command('build')
  .option('-c, --config <config>', 'Path to config file')
  .action(build)

program.command('deploy')
  .option('-c, --config <config>', 'Path to config file')
  .action(deploy)

program.parse(process.argv)
