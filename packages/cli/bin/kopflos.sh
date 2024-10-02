#!/usr/bin/env bash

# find JS entrypoint
kopflos=$(node -e "console.log(require.resolve('kopflos/bin/index.js'))" 2> /dev/null)

# if ts-node exists in path
if command -v ts-node &> /dev/null
then
  echo "use ts-node"
  node --loader ts-node/esm/transpile-only --no-warnings "$kopflos" "$@"
else
  echo "use plain node"
  node "$kopflos" "$@"
fi
