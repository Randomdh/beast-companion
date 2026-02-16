#!/bin/bash
# =============================================================================
# Beast Companion + OpenClaw Setup Script
# Run this on your Oracle Cloud VM (129.158.41.81)
# =============================================================================

set -e

echo "=== Beast Companion + OpenClaw Setup ==="
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check system resources
# -----------------------------------------------------------------------------
echo "=== Step 1: Checking system resources ==="
echo "CPUs: $(nproc)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $4}') available"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Install Node.js 22+ if needed
# -----------------------------------------------------------------------------
echo "=== Step 2: Checking Node.js ==="
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "Node.js found: $(node -v)"
    if [ "$NODE_VERSION" -lt 22 ]; then
        echo "Node.js 22+ required, upgrading..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Install OpenClaw
# -----------------------------------------------------------------------------
echo "=== Step 3: Installing OpenClaw ==="
if command -v openclaw &> /dev/null; then
    echo "OpenClaw already installed: $(openclaw --version)"
else
    echo "Installing OpenClaw..."
    curl -fsSL https://openclaw.ai/install.sh | bash
fi
echo ""

# -----------------------------------------------------------------------------
# Step 4: Create extensions directory
# -----------------------------------------------------------------------------
echo "=== Step 4: Setting up extensions directory ==="
mkdir -p ~/.openclaw/extensions
cd ~/.openclaw/extensions
echo ""

# -----------------------------------------------------------------------------
# Step 5: Clone Beast Companion plugin
# -----------------------------------------------------------------------------
echo "=== Step 5: Installing Beast Companion plugin ==="
if [ -d "beast-companion" ]; then
    echo "beast-companion directory exists, pulling latest..."
    cd beast-companion
    git pull
else
    echo "Cloning beast-companion..."
    git clone https://github.com/Randomdh/beast-companion.git
    cd beast-companion
fi

echo "Installing dependencies..."
npm install

echo "Building..."
npm run build
echo ""

# -----------------------------------------------------------------------------
# Step 6: Create OpenClaw config
# -----------------------------------------------------------------------------
echo "=== Step 6: Configuring OpenClaw ==="

CONFIG_FILE="$HOME/.openclaw/openclaw.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "Config exists at $CONFIG_FILE"
    echo "You may need to manually add the beast-companion plugin config."
else
    echo "Creating initial config..."
    cat > "$CONFIG_FILE" << 'CONFIGEOF'
{
  "providers": {
    "openrouter": {
      "apiKey": "YOUR_OPENROUTER_API_KEY_HERE"
    }
  },
  "defaults": {
    "model": "moonshotai/kimi-k2.5"
  },
  "plugins": {
    "beast-companion": {
      "enabled": true,
      "dataSource": "remote",
      "dataApiUrl": "http://127.0.0.1:3100",
      "walletAddresses": []
    }
  }
}
CONFIGEOF
    echo "Created $CONFIG_FILE"
    echo ""
    echo "IMPORTANT: Edit this file to add:"
    echo "  1. Your OpenRouter API key (get from openrouter.ai)"
    echo "  2. Your wallet addresses"
fi
echo ""

# -----------------------------------------------------------------------------
# Step 7: Verify API is running
# -----------------------------------------------------------------------------
echo "=== Step 7: Verifying Beast Companion API ==="
if curl -s http://127.0.0.1:3100/health | grep -q '"status":"ok"'; then
    echo "API is running!"
    curl -s http://127.0.0.1:3100/v1/stats | head -c 200
    echo ""
else
    echo "WARNING: API not responding on port 3100"
    echo "Check: pm2 list"
fi
echo ""

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Get an OpenRouter API key from https://openrouter.ai"
echo "     (Pay-as-you-go, no subscription required)"
echo "  2. Edit ~/.openclaw/openclaw.json with your API key and wallet"
echo "  3. Run: openclaw onboard"
echo "  4. Start OpenClaw: openclaw start"
echo "  5. Test: openclaw chat"
echo ""
echo "Beast Companion tools available:"
echo "  - akcb_portfolio_analyze"
echo "  - akcb_find_listings"
echo "  - akcb_evaluate_beast"
echo "  - akcb_track_alert"
echo "  - akcb_market_brief"
echo "  - akcb_journal"
echo ""
