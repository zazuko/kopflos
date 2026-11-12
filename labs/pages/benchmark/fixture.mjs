export const scenarios = [
  { name: 'small', resources: 100, routes: 1, properties: 4 },
  { name: 'single-route', resources: 1000, routes: 1, properties: 4 },
  { name: 'many-routes', resources: 1000, routes: 20, properties: 4 },
  { name: 'wide-resources', resources: 500, routes: 20, properties: 16 },
]

export function fixture(env, scenario) {
  const pages = Array.from({ length: scenario.routes }, (_, route) => ({
    path: env.ns.schema.mainEntity,
    resourcePattern: env.literal(`^http://example.org/resource/type-${route}/(?<id>[0-9]+)$`),
    pagePattern: env.literal(`^http://example.org/page/type-${route}/(?<id>[0-9]+).html$`),
  }))
  const dataset = env.dataset()
  const expected = env.dataset()
  for (let id = 0; id < scenario.resources; id++) {
    const route = id % scenario.routes
    const resource = env.namedNode(`http://example.org/resource/type-${route}/${id}`)
    const page = env.namedNode(`http://example.org/page/type-${route}/${id}.html`)
    const type = env.quad(resource, env.ns.rdf.type, env.ns.schema.Thing)
    dataset.add(type)
    expected.add(type)
    for (let property = 0; property < scenario.properties; property++) {
      const quad = env.quad(resource, env.namedNode(`urn:property:${property}`), env.literal(`value-${id}-${property}`))
      dataset.add(quad)
      expected.add(quad)
    }
    expected.add(env.quad(resource, env.ns.schema.mainEntityOfPage, page))
  }
  return { pages, dataset, expected }
}

export function query(kind) {
  return `PREFIX schema: <http://schema.org/>
PREFIX kopflos: <https://kopflos.described.at/>
CONSTRUCT {
  ?resource ?predicate ?object ; schema:mainEntityOfPage ?page .
}
WHERE {
  ?resource a schema:Thing ; ?predicate ?object .
  ${kind === 'legacy'
    ? 'SERVICE kopflos:Pages { ?resource schema:mainEntityOfPage ?page }'
    : 'BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)'}
}`
}
