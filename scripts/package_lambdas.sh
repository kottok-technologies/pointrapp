#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "📦 Packaging WebSocket Lambdas..."

# Create node_modules with AWS SDK v3
echo "🧩 Installing dependencies..."
mkdir -p lambdas/dist
pushd lambdas > /dev/null
npm init -y --silent
npm install @aws-sdk/client-dynamodb @aws-sdk/client-apigatewaymanagementapi > /dev/null

# Create zips
for fn in onConnect onDisconnect broadcast; do
  echo "🗜️  Zipping $fn.js ..."
  zip -q -r "dist/$fn.zip" "$fn.js" node_modules package.json package-lock.json
done
popd > /dev/null

echo "✅ Done. Zips created in modules/websocket/lambdas/dist/"
