import { log, type SubjectHandler } from './index.js'

export function getCoreRepresentation(): SubjectHandler {
  log.warn('Using @kopflos-cms/handlers.js#getCoreRepresentation is not equivalent to skipping the handler altogether because it materiliazes the dataset. This is not recommended for large resources.')

  return ({ subject }) => {
    return {
      status: 200,
      body: subject.dataset.toStream(),
    }
  }
}
