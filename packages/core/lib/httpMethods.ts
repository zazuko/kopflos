const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'] as const

export default HTTP_METHODS
export type HttpMethod = (typeof HTTP_METHODS)[number]
