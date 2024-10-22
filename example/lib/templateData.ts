import type { TemplateDataFunc } from '@kopflos-labs/html-template'

export const describe = (resourcePath: string): TemplateDataFunc => ({ env }) => {
  return env.sparql.default.stream.query.construct(`
BASE <${env.kopflos.config.baseIri}>
DESCRIBE <${resourcePath}>`)
}
