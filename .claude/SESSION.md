# Beast Companion — Session State

## Current Task
GCP setup script ready — user signing up for Google Cloud

## Status
PIVOTED: Oracle free tier too slow for OpenClaw compilation, moving to GCP $300 trial

## What's Done
1. Plugin scaffold with 6 agent tools
2. Data API deployed on VM (port 3100)
3. OpenClaw ecosystem research
4. Research documentation
5. **User-facing README** (comprehensive)
6. **Security guide** (docs/SECURITY.md)

## Documentation Summary

### README.md
- Two setup paths: Kimi Claw (zero setup) vs self-hosted
- Critical setup section with non-negotiables
- Cost estimates by usage tier
- Step-by-step installation
- Rich usage examples
- Tools reference
- Configuration options
- Troubleshooting guide

### docs/SECURITY.md
- Threat landscape context
- Beast Companion's security posture
- Pre-flight checklist
- Hardening recommendations
- Incident response

### docs/OPENCLAW_RESEARCH.md
- Full research findings (internal reference)
- Sources index
- Decision log

## File Structure
```
beast-companion/
├── README.md                    # User guide
├── docs/
│   ├── SECURITY.md              # Security hardening
│   └── OPENCLAW_RESEARCH.md     # Research findings
├── src/
│   ├── index.ts
│   ├── tools/
│   ├── data/
│   └── state/
├── openclaw.plugin.json         # Updated with VM API URL
├── .claude/
│   └── SESSION.md
└── package.json
```

## Next Steps
1. **GCP Setup**: User signs up for Google Cloud ($300/90 days trial)
2. **Create VM**: e2-medium (2 vCPU, 4GB RAM) with Ubuntu 22.04
3. **Run script**: `bash setup-gcp-openclaw.sh`
4. **Configure**: Add OpenRouter API key to config
5. **Test**: Verify Beast Companion tools work

## Architecture

```
Beast Companion Plugin                    VM (129.158.41.81)
┌─────────────────────┐                  ┌──────────────────┐
│  User's OpenClaw    │ ── REST ────────►│ :3100 API        │
│  instance           │                  │ (beast-companion │
└─────────────────────┘                  │  -api)           │
                                         └──────────────────┘
```

## Commits
- `a297482` — Beast Companion plugin scaffold
- `d77afcd` — Beast Companion API initial
- `1a8fa9a` — Fix data loader for object-keyed JSON
- `3059577` — User documentation (README, SECURITY.md, research docs)

## Architecture Change

**Old plan**: Run everything on Oracle free tier VM
**New plan**:
- Oracle VM (129.158.41.81): Beast Companion API only (:3100)
- GCP VM: OpenClaw + Beast Companion plugin

**Why**: Oracle E2.1.Micro (1GB RAM, 73% CPU throttling) couldn't compile node-llama-cpp in reasonable time.

## Scripts
- `scripts/setup-vm-openclaw.sh` — Oracle VM (deprecated)
- `scripts/setup-gcp-openclaw.sh` — GCP setup (current)

## Last Updated
2026-02-16 (Pivoted to GCP)
