import parent, { Environment } from '@zazuko/env-node'
import alcaeus from 'alcaeus'

export default new Environment([...alcaeus()], { parent })
