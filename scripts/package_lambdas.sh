#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (script is in /scripts)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAMBDA_DIR="$ROOT_DIR/lambdas"
DIST_DIR="$ROOT_DIR/terraform/modules/infra/lambdas/dist"

echo "📦 Packaging WebSocket Lambdas..."
echo "Root directory: $ROOT_DIR"
echo "Lambda source directory: $LAMBDA_DIR"
echo "Output directory: $DIST_DIR"

mkdir -p "$DIST_DIR"

pushd "$LAMBDA_DIR" > /dev/null

echo "🧩 Installing dependencies..."
npm install --no-audit --no-fund --silent @aws-sdk/client-dynamodb @aws-sdk/client-apigatewaymanagementapi

for fn in onConnect onDisconnect broadcast onRegister onPing; do
  echo "🗜️  Zipping $fn.js ..."
  zip -q -r "$DIST_DIR/$fn.zip" "$fn.js" node_modules package.json package-lock.json
done

popd > /dev/null
echo "✅ Done. Zips created in $DIST_DIR"
