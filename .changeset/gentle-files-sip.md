---
"@kopflos-cms/core": minor
"@kopflos-cms/plugin-deploy-resources": minor
"@kopflos-cms/express": minor
"@kopflos-cms/hydra": minor
"@kopflos-cms/shacl": minor
"@kopflos-cms/vite": minor
"kopflos": patch
---

Removed the type `KopflosPluginConstructor` and now all plugins are exported as classes directly and their options are passed to the constructor
