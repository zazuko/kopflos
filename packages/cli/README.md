# kopflos CLI

Command line interface for Kopflos.

## Usage

### serve

```
> npx kopflos serve --help

Usage: kopflos serve [options]

Start the server

Options:
  --base-iri <baseIri>   Base IRI for the server and its resources
  -c, --config <config>  Path to config file
  -p, --port <port>      Port to listen on (default: 1429)
  -h, --host <host>      Host to bind to (default: "0.0.0.0")
  --deploy <paths...>    Resource paths to be deployed
  --auto-deploy          Deploy resources from the resources directory (default: true)
  --no-auto-deploy       Disable auto deployment
  --help                 display help for command
```

## Configuration
