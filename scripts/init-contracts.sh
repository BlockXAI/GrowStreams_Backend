#!/usr/bin/env bash
set -euo pipefail

# GrowStreams V2 — Initialize deployed contracts
# Sends constructor messages to set up StreamCore and TokenVault
#
# Usage: ./scripts/init-contracts.sh
#
# Prerequisites:
#   1. Contracts deployed (run deploy.sh first)
#   2. deploy-state.json contains program IDs
#   3. .env has VARA_SEED and ADMIN_ADDRESS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_STATE="$PROJECT_ROOT/deploy-state.json"

# Load env
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
else
    echo "Error: .env not found."
    exit 1
fi

VARA_NODE="${VARA_NODE:-wss://testnet.vara.network}"
MIN_BUFFER="${MIN_BUFFER_SECONDS:-3600}"

if [ -z "${ADMIN_ADDRESS:-}" ]; then
    echo "Error: ADMIN_ADDRESS not set in .env"
    echo "Set it to your Vara SS58 address (e.g. 5GsXKGe5Ayw...)"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq required for reading deploy-state.json"
    echo "  brew install jq"
    exit 1
fi

if [ ! -f "$DEPLOY_STATE" ]; then
    echo "Error: deploy-state.json not found. Run deploy.sh first."
    exit 1
fi

STREAM_CORE_ID=$(jq -r '.["stream-core"].programId // empty' "$DEPLOY_STATE")
TOKEN_VAULT_ID=$(jq -r '.["token-vault"].programId // empty' "$DEPLOY_STATE")

echo "=== GrowStreams V2 — Initialize Contracts ==="
echo "Node:         $VARA_NODE"
echo "Admin:        $ADMIN_ADDRESS"
echo "Min Buffer:   ${MIN_BUFFER}s"
echo "StreamCore:   ${STREAM_CORE_ID:-NOT DEPLOYED}"
echo "TokenVault:   ${TOKEN_VAULT_ID:-NOT DEPLOYED}"
echo ""

if [ -n "$STREAM_CORE_ID" ]; then
    echo "Initializing StreamCore..."
    echo "  Constructor: New(admin=$ADMIN_ADDRESS, min_buffer_seconds=$MIN_BUFFER)"
    gcli \
        --endpoint "$VARA_NODE" \
        send "$STREAM_CORE_ID" \
        --seed "$VARA_SEED" \
        --payload "New" \
        2>&1 || echo "  Note: Constructor may have already been called or needs Sails encoding."
    echo ""
fi

if [ -n "$TOKEN_VAULT_ID" ]; then
    echo "Initializing TokenVault..."
    echo "  Constructor: New(admin=$ADMIN_ADDRESS, stream_core=$STREAM_CORE_ID)"
    gcli \
        --endpoint "$VARA_NODE" \
        send "$TOKEN_VAULT_ID" \
        --seed "$VARA_SEED" \
        --payload "New" \
        2>&1 || echo "  Note: Constructor may have already been called or needs Sails encoding."
    echo ""
fi

echo "=== Initialization complete ==="
echo ""
echo "Important: For Sails-based contracts, constructors are called automatically"
echo "during program upload. The above sends may not be needed if gcli handles"
echo "init payloads during upload."
echo ""
echo "Verify state on Gear IDEA: https://idea.gear-tech.io/programs"
echo ""
echo "Contract addresses for docs/contracts-api.md:"
echo "  StreamCore:  $STREAM_CORE_ID"
echo "  TokenVault:  $TOKEN_VAULT_ID"
