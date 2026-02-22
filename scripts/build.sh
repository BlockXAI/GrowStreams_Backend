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
# The gear-wasm-builder produces optimized .opt.wasm in a nested path
OUTPUT_DIR="$PROJECT_ROOT/artifacts"
mkdir -p "$OUTPUT_DIR"

OPT_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/wasm32-unknown-unknown/release"

for contract in "${CONTRACTS[@]}"; do
    WASM_NAME="${contract//-/_}"
    OPT_PATH="$OPT_DIR/${WASM_NAME}.opt.wasm"
    RAW_PATH="$OPT_DIR/${WASM_NAME}.wasm"
    if [ -f "$OPT_PATH" ]; then
        cp "$OPT_PATH" "$OUTPUT_DIR/${WASM_NAME}.opt.wasm"
        echo "Artifact: artifacts/${WASM_NAME}.opt.wasm ($(du -h "$OPT_PATH" | cut -f1))"
    elif [ -f "$RAW_PATH" ]; then
        cp "$RAW_PATH" "$OUTPUT_DIR/${WASM_NAME}.wasm"
        echo "Artifact: artifacts/${WASM_NAME}.wasm ($(du -h "$RAW_PATH" | cut -f1))"
    else
        echo "Warning: No WASM found for $contract"
    fi
done

echo ""
echo "=== Build complete ==="
echo "WASM artifacts in: $OUTPUT_DIR"
