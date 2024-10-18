import type { Handler } from '@kopflos-cms/core'

export default (): Handler => () => {
  return {
    status: 200,
    body: 'handler',
  }
}
