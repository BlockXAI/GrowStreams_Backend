#!/usr/bin/env bash
set -euo pipefail

# GrowStreams V2 — Build contracts to WASM
# Usage: ./scripts/build.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"

echo "=== GrowStreams V2 — Contract Build ==="
echo ""

# Check toolchain
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo not found. Install Rust: https://rustup.rs"
    exit 1
fi

if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Build each contract
CONTRACTS=("stream-core" "token-vault")

for contract in "${CONTRACTS[@]}"; do
    CONTRACT_DIR="$CONTRACTS_DIR/$contract"
    if [ -d "$CONTRACT_DIR" ]; then
        echo "Building $contract..."
        cargo build \
            --manifest-path "$CONTRACT_DIR/Cargo.toml" \
            --target wasm32-unknown-unknown \
            --release
        echo "  Done: $contract"
    else
        echo "  Warning: $CONTRACT_DIR not found, skipping"
    fi
done

# Copy WASM artifacts to a central output dir
OUTPUT_DIR="$PROJECT_ROOT/artifacts"
mkdir -p "$OUTPUT_DIR"

for contract in "${CONTRACTS[@]}"; do
    WASM_NAME="${contract//-/_}"
    WASM_PATH="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release/${WASM_NAME}.wasm"
    if [ -f "$WASM_PATH" ]; then
        cp "$WASM_PATH" "$OUTPUT_DIR/"
        echo "Artifact: artifacts/${WASM_NAME}.wasm"
    fi
done

echo ""
echo "=== Build complete ==="
echo "WASM artifacts in: $OUTPUT_DIR"
