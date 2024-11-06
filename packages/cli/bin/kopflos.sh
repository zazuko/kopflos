#!/usr/bin/env bash

# find JS entrypoint
kopflos=$(node -e "console.log(require.resolve('kopflos/bin/index.js'))" 2> /dev/null)

# if ts-node exists in path
if command -v ts-node &> /dev/null
then
  node --loader ts-node/esm/transpile-only --no-warnings "$kopflos" "$@"
else
  node "$kopflos" "$@"
fi
