# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.3.0](https://github.com/zazuko/hydra-box/compare/v0.2.2...v0.3.0) (2019-07-19)

### Features

* Handle multiple SPARQL queries servicing a single operation
* Use [rdf-native-loader](https://github.com/zazuko/rdf-native-loader-code) for SparqlView
* Inject environment variables into SparqlView ([#31](https://github.com/zazuko/hydra-box/pull/31))

### Docs

* added quickstart to readme

### [0.2.2](https://github.com/zazuko/hydra-box/compare/v0.2.1...v0.2.2) (2019-03-27)

### Bug fixes

* upgrade rdf-ext to new optimized dataset ([c60b435](https://github.com/zazuko/hydra-box/commit/c60b4357cc1c1d30f1cc81ea29e337cec427e4c2))

### [0.2.1](https://github.com/zazuko/hydra-box/compare/v0.2.0...v0.2.1) (2018-03-02)

### Features

* forward authentication option ([0b78a3e](https://github.com/zazuko/hydra-box/commit/0b78a3e358f3f36026e06927ed2e7503350667e7))

### [0.2.0](https://github.com/zazuko/hydra-box/compare/v0.1.1...v0.2.0) (2018-03-01)

### Features

* added basic authentication ([fef829c](https://github.com/zazuko/hydra-box/commit/fef829cb54857f39a15e32ab059fd86dda8521ed))

### [0.1.1](https://github.com/zazuko/hydra-box/compare/v0.1.0...v0.1.1) (2018-03-01)

### Bug fixes

* send 204 if the endpoint doesn't send a quad response ([8bcde59](https://github.com/zazuko/hydra-box/commit/8bcde59524dd2645fa8a8bfa87a5a7ab670231ff))

### Tests

* added initial SparqlView tests ([65da7cc](https://github.com/zazuko/hydra-box/commit/65da7cc68526494cad11b5f2df429f1c423093f5))

### [0.1.0](https://github.com/zazuko/hydra-box/compare/v0.1.0...v0.1.0) (2018-01-22)

### Features

* forward locals as this to sparql es6 template engine ([3adf2bd](https://github.com/zazuko/hydra-box/commit/3adf2bd0f4f12e1bcd1a181b04ae94daf6e0573b))
* added supportedProperty support ([128a20c](https://github.com/zazuko/hydra-box/commit/128a20c85d1036e5e34d2f410fd42fb01e2fef20))
