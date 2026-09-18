/* eslint-disable import/no-extraneous-dependencies */
import { esbuildPlugin } from '@web/dev-server-esbuild'
import { chromeLauncher } from '@web/test-runner'

export default {
  files: 'test/**/*.browser.test.ts',
  nodeResolve: true,
  concurrency: 1,
  coverage: true,
  coverageConfig: {
    include: [
      'runtime/**/*.ts',
    ],
  },
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto' }),
  ],
  browsers: [
    chromeLauncher({
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
      },
    }),
  ],
}
