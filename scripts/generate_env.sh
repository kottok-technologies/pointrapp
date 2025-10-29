#!/usr/bin/env bash
set -euo pipefail

SECRET_NAME="${SECRET_NAME:-pointrapp-app-secrets}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${WORKSPACE:-dev}"  # or $ENVIRONMENT if you export that

log() { echo -e "\033[1;36m$1\033[0m"; }

# --- Secrets ---
log "📦 Fetching secrets..."
if ! aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text > secrets.json; then
  log "❌ Failed to retrieve secrets"
else
  jq -r 'to_entries | map("\(.key)=\(.value)") | .[]' secrets.json > .env.production
  rm -f secrets.json

  # 🌐 Dynamically pick NEXTAUTH_URL
  if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "production" ]]; then
    NEXTAUTH_URL="https://www.pointrapp.com"
  else
    NEXTAUTH_URL="https://dev.pointrapp.com"
  fi

  {
    echo "NEXTAUTH_URL=$NEXTAUTH_URL"
  } >> .env.production

  log "✅ .env.production ready for environment: $ENVIRONMENT"
fi
