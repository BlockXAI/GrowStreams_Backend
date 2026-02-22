#!/usr/bin/env bash
set -euo pipefail

# GrowStreams V2 — Deploy contracts to Vara Testnet
# Usage: ./scripts/deploy.sh [contract_name]
#
# Prerequisites:
#   1. Copy .env.example to .env and fill in VARA_SEED + ADMIN_ADDRESS
#   2. Install gcli: cargo install gcli
#   3. Run ./scripts/build.sh first
#   4. Get testnet VARA tokens from faucet

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ARTIFACTS_DIR="$PROJECT_ROOT/artifacts"
DEPLOY_STATE="$PROJECT_ROOT/deploy-state.json"

# Load env
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
else
    echo "Error: .env file not found. Copy .env.example to .env and fill in your values."
    echo "  cp .env.example .env"
    exit 1
fi

# Validate env
if [ -z "${VARA_SEED:-}" ] || [ "$VARA_SEED" = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12" ]; then
    echo "Error: VARA_SEED not set or still contains placeholder."
    echo "Edit .env and set your actual seed phrase."
    exit 1
fi

VARA_NODE="${VARA_NODE:-wss://testnet.vara.network}"

# Check gcli
if ! command -v gcli &> /dev/null; then
    echo "Error: gcli not found. Install with:"
    echo "  cargo install gcli"
    exit 1
fi

# Check artifacts
if [ ! -d "$ARTIFACTS_DIR" ]; then
    echo "Error: No artifacts/ directory. Run ./scripts/build.sh first."
    exit 1
fi

# Init deploy state file
if [ ! -f "$DEPLOY_STATE" ]; then
    echo '{}' > "$DEPLOY_STATE"
fi

echo "=== GrowStreams V2 — Deploy to Vara Testnet ==="
echo "Node: $VARA_NODE"
echo ""

deploy_contract() {
    local name="$1"
    local wasm_name="${name//-/_}"
    local wasm_path="$ARTIFACTS_DIR/${wasm_name}.wasm"

    if [ ! -f "$wasm_path" ]; then
        echo "Error: $wasm_path not found. Build first."
        return 1
    fi

    echo "Deploying $name..."
    echo "  WASM: $wasm_path"

    # Upload and create program
    local result
    result=$(gcli \
        --endpoint "$VARA_NODE" \
        upload "$wasm_path" \
        --seed "$VARA_SEED" \
        2>&1) || {
        echo "  Deploy failed:"
        echo "  $result"
        return 1
    }

    echo "  Result: $result"

    # Try to extract program ID from output
    local program_id
    program_id=$(echo "$result" | grep -oE '0x[a-fA-F0-9]{64}' | head -1 || echo "")

    if [ -n "$program_id" ]; then
        echo "  Program ID: $program_id"
        # Save to deploy state
        local tmp
        tmp=$(mktemp)
        if command -v jq &> /dev/null; then
            jq --arg name "$name" --arg id "$program_id" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                '.[$name] = {"programId": $id, "deployedAt": $time, "network": "vara-testnet"}' \
                "$DEPLOY_STATE" > "$tmp" && mv "$tmp" "$DEPLOY_STATE"
        else
            echo "  (Install jq to auto-save program IDs to deploy-state.json)"
        fi
    else
        echo "  Could not extract program ID from output."
        echo "  Check Vara explorer or gcli output above."
    fi

    echo "  Done: $name"
    echo ""
}

# Deploy specific contract or all
CONTRACT="${1:-all}"

if [ "$CONTRACT" = "all" ]; then
    deploy_contract "stream-core"
    deploy_contract "token-vault"
elif [ "$CONTRACT" = "stream-core" ] || [ "$CONTRACT" = "token-vault" ]; then
    deploy_contract "$CONTRACT"
else
    echo "Unknown contract: $CONTRACT"
    echo "Usage: ./scripts/deploy.sh [stream-core|token-vault|all]"
    exit 1
fi

echo "=== Deployment complete ==="
echo "State saved to: $DEPLOY_STATE"
echo ""
echo "Next steps:"
echo "  1. Verify on Vara explorer: https://idea.gear-tech.io/programs"
echo "  2. Initialize contracts by sending constructor messages"
echo "  3. Update docs/contracts-api.md with program IDs"
