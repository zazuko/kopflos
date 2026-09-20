module.exports = {
  'extension': [
    'ts',
  ],
  'node-option': [
    'import=tsx',
    'no-experimental-require-module',
  ],
  'require': [require.resolve('./mocha-setup.js')],
}
