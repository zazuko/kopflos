// Distinguish the configured source from explicit SERVICE targets.
export const clientSourceUrl = 'https://kopflos.invalid/query-source'

export async function sparqlRequest(input: Parameters<typeof fetch>[0], init?: RequestInit) {
  const request = input instanceof Request ? input : undefined
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  // Comunica 4 appends ?query= even when a SERVICE IRI already has selectors.
  if (!url.searchParams.has('query') && url.search.includes('?query=')) {
    url.search = url.search.replace('?query=', '&query=')
    input = request ? new Request(url, request) : url.href
  }
  const headers = new Headers(init?.headers ?? request?.headers)
  const body = init?.body != null
    ? await new Response(init.body).text()
    : request && request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().text() : ''
  const query = url.searchParams.get('query')
    ?? (headers.get('content-type')?.startsWith('application/sparql-query') ? body : new URLSearchParams(body).get('query'))
  const source = new URL(url)
  source.searchParams.delete('query')
  source.searchParams.sort()
  return { input, headers, query, source: source.href }
}
