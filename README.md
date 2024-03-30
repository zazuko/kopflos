# @kopflos-cms/core

[Hydra](http://www.hydra-cg.com/spec/latest/core/) is a machine readable description for APIs.
Kopflos extends the API description with links to the actual code, which provides the API.
Kopflos will use such an API description to create an express middleware which provides the API and dynamically loads the required code for it.

## Usage

### Application

`@kopflos-cms/core` uses an object that implements the [RDF/JS Store interface](http://rdf.js.org/stream-spec/#store-interface) to read resources and find types of resources to identify matching operations.
The resource is read using the IRI as named graph filter.

Here an example for a store on the local file system using `rdf-store-fs`:

```javascript
import FlatMultiFileStore from 'rdf-store-fs/FlatMultiFileStore.js'

const store = new FlatMultiFileStore({
  baseIRI: 'http://localhost:9000/',
  path: 'store'
})
```

An `Api` object contains the dataset of the API documentation, where to find it and where to find the code.
The static method `.fromFile` reads the dataset from the given file and creates an `Api` object with the given options.

```javascript
import rdf from '@zazuko/env-node'

const api = await Api.fromFile('api.ttl', {
  factory: rdf,
  path: '/api',
  codePath: __dirname
})
```

The `factory` parameter is required, and must be an [RDF/JS Environment](https://npm.im/@rdfjs/environment), providing the following factories compatible with the following:

- [DatasetCoreFactory](https://npm.im/@rdfjs/dataset)
- [DataFactory](https://npm.im/@rdfjs/data-model)
- [NamespaceFactory](https://npm.im/@rdfjs/namespace)
- [TermSetFactory](https://npm.im/@rdfjs/term-set)
- [ClownfaceFactory](https://npm.im/clownface)
- [NsBuildersFactory](https://npm.im/@tpluscode/rdf-ns-builders)
- [FsUtilsFactory](https://npm.im/@rdfjs/@zazuko/rdf-utils-fs)

Once both objects are created, the middleware can be used:

```javascript
const app = express()
app.use(hydraBox(api, store))
app.listen(9000)
```

### Operation

The operations must implement a [Express routing handler](http://expressjs.com/en/starter/basic-routing.html) interface (`(req, res, next) => {}`).
@kopflos-cms/core adds the [@rdfjs/express-handler](https://github.com/rdfjs-base/express-handler) to handle incoming and outgoing RDF data.
For `GET` requests with a matching IRI Template, the `.dataset()` and `.quadStream()` as defined by `express-handler` are also available to read the given variables.
Additionally, there is a `hydra` property assigned to `req` that contains more data about the request: 

```javascript
  req.hydra = {
    // Api object given as argument to the middleware
    api,
 
    // RDF/JS Store object given as argument to the middleware
    store,
 
    // requested URL as RDF/JS NamedNode
    term,
    
    // the selected hydra:Operation as Graph Pointer
    operation,

    // resource this request is about
    // This can be the requested URL for the case that a class operation is called.
    // For the case that a property operation is called, this is the subject of the triple used to link to the property.
    resource: {

      // IRI of the resource as RDF/JS NamedNode
      term,

      // content of the resource read from the store as RDF/JS Dataset 
      dataset,

      // rdf:types of the resource as @rdfjs/term-set
      types
    }
  }
```
