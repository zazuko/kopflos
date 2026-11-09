# kopflos CLI

Command line interface for Kopflos.

## AI skill

The package includes [kopflos-app](skills/kopflos-app/SKILL.md), an agent skill for configuring and running applications and defining RDF APIs. It is shipped in `node_modules/kopflos/skills/kopflos-app`; point your agent at its `SKILL.md` or copy the folder into your agent's skills directory.

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
  --help                 display help for command
```

## Configuration
