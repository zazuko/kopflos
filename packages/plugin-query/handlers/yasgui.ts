import type { RequestHandler } from 'express'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'

export interface Clients {
  stream: StreamClient
  parsed: ParsingClient
}

export default (sparql: Record<string, Clients>): RequestHandler => {
  return (req, res) => {
    const endpoints = Object.keys(sparql).map(name => ({
      name,
      endpoint: `${req.baseUrl}/-/query/${name}`,
    }))

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Kopflos Query</title>
    <link href="https://unpkg.com/@zazuko/yasgui/build/yasgui.min.css" rel="stylesheet" type="text/css" />
    <script src="https://unpkg.com/@zazuko/yasgui/build/yasgui.min.js"></script>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <div id="yasgui"></div>
    <script>
      const endpoints = ${JSON.stringify(endpoints)};
      const yasgui = new Yasgui(document.getElementById("yasgui"), {
        endpointCatalogueOptions: {
          getData: () => endpoints,
          keys: [],
        },
      });
    </script>
  </body>
</html>`
    res.send(html)
  }
}
