# Hydra-Box - Blog Example

Simple hydra-box blog application that stores the RDF data in a file store in the local file system.

Before you can run the example, you need to create an initial store.
Run the following command in the directory `examples/blog/`:

```bash
./init.sh
```

Now you can start the example with:

```bash
node server.js
```

The `client` folder contains some example requests based on [Alcaeus](https://github.com/wikibus/Alcaeus).
