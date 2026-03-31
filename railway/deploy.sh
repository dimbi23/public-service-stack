#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=${PROJECT_NAME:-public-service-stack-poc}
REPO=${REPO:-dimbi23/public-service-stack}

echo "Creating Railway project: ${PROJECT_NAME}"
railway init

echo "Adding services from repo: ${REPO}"
echo "You will be prompted to name each service."
railway add --repo "${REPO}"
railway add --repo "${REPO}"
railway add --repo "${REPO}"
railway add --repo "${REPO}"

echo "Adding Postgres (portal)"
railway add --database postgres

echo "Adding Postgres (case-api)"
railway add --database postgres

echo "Adding Redis (interactive)"
railway add

echo "Done. Now set env vars per service and configure build/start commands."
echo "See railway/README.md for the exact values."
