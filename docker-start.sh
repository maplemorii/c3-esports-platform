#!/bin/sh
set -e

# Call the prisma CLI from its real package location, not node_modules/.bin/.
# When Docker copies a symlink as a regular file, __dirname resolves to .bin/
# and prisma can't find its sibling WASM files. Using the package entry directly
# keeps __dirname inside node_modules/prisma/dist/ where the WASM lives.
PRISMA_BIN=$(node -e "
  const p = require('./node_modules/prisma/package.json');
  const bin = typeof p.bin === 'string' ? p.bin : p.bin.prisma;
  process.stdout.write('./node_modules/prisma/' + bin);
")

echo "Running migrations..."
node "$PRISMA_BIN" migrate deploy

echo "Starting server..."
exec node server.js
