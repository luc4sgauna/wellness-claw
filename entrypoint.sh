#!/bin/sh
set -e

# Start the wellness dashboard on port 8080
cd /app/dashboard
PORT=8080 HOSTNAME=0.0.0.0 node server.js &

# Start OpenClaw gateway on port 3000
cd /app
exec openclaw gateway --port 3000 --bind lan
