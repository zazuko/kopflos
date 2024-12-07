import 'ulog'
import { program } from 'commander'
import { variable } from './lib/options.js'
import deploy from './lib/command/deploy.js'
import build from './lib/command/build.js'
import serve from './lib/command/serve.js'

program.name('kopflos')

program.command('serve')
  .description('Start the server')
  .option('-m, --mode <mode>', 'Mode to run in (default: "production")')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port to listen on (default: 1429)', parseInt)
  .option('-h, --host <host>', 'Host to bind to (default: "0.0.0.0")')
  .addOption(variable)
  .option('--trust-proxy [proxy]', 'Trust the X-Forwarded-Host header')
  .action(serve)

program.command('build')
  .option('-c, --config <config>', 'Path to config file')
  .action(build)

program.command('deploy')
  .option('-c, --config <config>', 'Path to config file')
  .action(deploy)

program.parse(process.argv)
