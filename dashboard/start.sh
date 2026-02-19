#!/bin/sh
# Start the wellness dashboard on port 8080
# Run alongside the OpenClaw gateway on port 3000

cd "$(dirname "$0")"

if [ -d ".next/standalone" ]; then
  PORT=8080 HOSTNAME=0.0.0.0 node .next/standalone/server.js
else
  npm run start
fi
