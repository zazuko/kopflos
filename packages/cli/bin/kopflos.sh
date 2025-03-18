#!/usr/bin/env sh

# find JS entrypoint
kopflos=$(node -e "console.log(require.resolve('kopflos/bin/index.js'))" 2> /dev/null)

# if tsx or ts-node exists in path, use them
if command -v tsx > /dev/null 2>&1
then
  node --import tsx --no-warnings "$kopflos" "$@"
elif command -v ts-node > /dev/null 2>&1
then
  node --loader ts-node/esm/transpile-only --no-warnings "$kopflos" "$@"
else
  node "$kopflos" "$@"
fi
