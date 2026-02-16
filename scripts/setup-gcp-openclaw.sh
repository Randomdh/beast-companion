#!/bin/bash
# =============================================================================
# Beast Companion + OpenClaw Setup for Google Cloud
# Run this on a fresh GCP e2-medium (2 vCPU, 4GB RAM) with Ubuntu 22.04
# =============================================================================

set -e

echo "=== Beast Companion + OpenClaw Setup (GCP) ==="
echo ""

# -----------------------------------------------------------------------------
# Step 1: System info
# -----------------------------------------------------------------------------
echo "=== Step 1: System check ==="
echo "CPUs: $(nproc)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $4}') available"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Install Node.js 22
# -----------------------------------------------------------------------------
echo "=== Step 2: Installing Node.js 22 ==="
if command -v node &> /dev/null && [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -ge 22 ]; then
    echo "Node.js $(node -v) already installed"
else
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Install build tools (for node-llama-cpp)
# -----------------------------------------------------------------------------
echo "=== Step 3: Installing build tools ==="
sudo apt-get update -qq
sudo apt-get install -y build-essential cmake git
echo "CMake: $(cmake --version | head -1)"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Configure npm for user-local installs
# -----------------------------------------------------------------------------
echo "=== Step 4: Configuring npm ==="
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
export PATH=~/.npm-global/bin:$PATH
echo ""

# -----------------------------------------------------------------------------
# Step 5: Install OpenClaw
# -----------------------------------------------------------------------------
echo "=== Step 5: Installing OpenClaw ==="
curl -fsSL https://openclaw.ai/install.sh | bash
echo ""

# Ensure PATH is set
export PATH=~/.npm-global/bin:$PATH

# Verify
if command -v openclaw &> /dev/null; then
    echo "OpenClaw installed: $(openclaw --version)"
else
    echo "ERROR: OpenClaw not found in PATH"
    echo "Try: source ~/.bashrc && openclaw --version"
    exit 1
fi
echo ""

# -----------------------------------------------------------------------------
# Step 6: Install Beast Companion plugin
# -----------------------------------------------------------------------------
echo "=== Step 6: Installing Beast Companion plugin ==="
mkdir -p ~/.openclaw/extensions
cd ~/.openclaw/extensions

if [ -d "beast-companion" ]; then
    echo "Updating existing beast-companion..."
    cd beast-companion
    git pull
else
    echo "Cloning beast-companion..."
    git clone https://github.com/Randomdh/beast-companion.git
    cd beast-companion
fi

npm install
npm run build
echo ""

# -----------------------------------------------------------------------------
# Step 7: Create OpenClaw config
# -----------------------------------------------------------------------------
echo "=== Step 7: Creating config ==="
CONFIG_FILE="$HOME/.openclaw/openclaw.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "Config exists - backing up to openclaw.json.bak"
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
fi

cat > "$CONFIG_FILE" << 'EOF'
{
  "providers": {
    "openrouter": {
      "apiKey": "YOUR_OPENROUTER_API_KEY"
    }
  },
  "defaults": {
    "model": "moonshotai/kimi-k2.5"
  },
  "plugins": {
    "beast-companion": {
      "enabled": true,
      "dataSource": "remote",
      "dataApiUrl": "http://129.158.41.81:3100",
      "walletAddresses": []
    }
  }
}
EOF

echo "Created $CONFIG_FILE"
echo ""

# -----------------------------------------------------------------------------
# Step 8: Test API connectivity
# -----------------------------------------------------------------------------
echo "=== Step 8: Testing Beast Companion API ==="
if curl -s --connect-timeout 5 http://129.158.41.81:3100/health | grep -q '"status":"ok"'; then
    echo "API is reachable!"
else
    echo "WARNING: API not responding - check if Oracle VM is running"
fi
echo ""

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
echo "=============================================="
echo "=== Setup Complete! ==="
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Edit ~/.openclaw/openclaw.json"
echo "     - Add your OpenRouter API key (get from openrouter.ai)"
echo "     - Add your wallet address(es)"
echo ""
echo "  2. Run: source ~/.bashrc"
echo ""
echo "  3. Start OpenClaw: openclaw chat"
echo ""
echo "  4. Test: 'What beasts are in my wallet?'"
echo ""
echo "Beast Companion tools:"
echo "  - akcb_portfolio_analyze"
echo "  - akcb_find_listings"
echo "  - akcb_evaluate_beast"
echo "  - akcb_track_alert"
echo "  - akcb_market_brief"
echo "  - akcb_journal"
echo ""
