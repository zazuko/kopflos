const { Hydra } = require('alcaeus')

const baseUrl = 'http://localhost:9000/'

async function main () {
  const resources = await Hydra.loadResource(baseUrl)
  const table = resources.root

  const createRow = table.findOperations({ byMethod: 'POST' })[0]

  const response0 = await createRow.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Row',
    'http://localhost:9000/api/schema/operatorNumber': '101',
    'http://localhost:9000/api/schema/registrationNumber': '255100391',
    'http://localhost:9000/api/schema/name': 'Elektrizitätswerk der Stadt Zürich'
  }))

  console.log(`row created: ${response0.xhr.ok}`)
  console.log(`IRI: ${response0.xhr.headers.get('location')}`)

  const response1 = await createRow.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Row',
    'http://localhost:9000/api/schema/operatorNumber': '102',
    'http://localhost:9000/api/schema/registrationNumber': '2000526',
    'http://localhost:9000/api/schema/name': 'Sankt Galler Stadtwerke'
  }))

  console.log(`row created: ${response1.xhr.ok}`)
  console.log(`IRI: ${response1.xhr.headers.get('location')}`)

  const rowResources = await Hydra.loadResource(response1.xhr.headers.get('location'))
  const row = rowResources.root

  const updateRow = row.findOperations({ byMethod: 'PUT' })[0]

  const response2 = await updateRow.invoke(JSON.stringify({
    '@id': row['@id'],
    '@type': 'http://localhost:9000/api/schema/Row',
    'http://localhost:9000/api/schema/operatorNumber': '102',
    'http://localhost:9000/api/schema/registrationNumber': '2000526',
    'http://localhost:9000/api/schema/name': 'Sankt Galler Stadtwerke (Update)'
  }))

  console.log(`row updated: ${response2.xhr.ok}`)
}

main()
