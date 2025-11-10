#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${WORKSPACE:-dev}"  # or $ENVIRONMENT if you export that

log() { echo -e "\033[1;36m$1\033[0m"; }

# --- Secrets ---
log "📦 Fetching secrets..."
if ! aws secretsmanager get-secret-value \
    --secret-id "pointrapp-app-secrets-$ENVIRONMENT" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text > secrets.json; then
  log "❌ Failed to retrieve secrets"
else
  jq -r 'to_entries | map("\(.key)=\(.value)") | .[]' secrets.json > .env.production
  rm -f secrets.json

  log "✅ .env.production ready for environment: $ENVIRONMENT"
fi
