# Security Considerations

Beast Companion runs on OpenClaw, which has deep system access. This document covers the security landscape and what you should do to protect yourself.

---

## The Reality

OpenClaw is powerful because it can:
- Read and write files on your system
- Execute shell commands
- Access the internet
- Run 24/7 autonomously

This power comes with risk. As of February 2026:

| Metric | Value | Source |
|--------|-------|--------|
| Internet-exposed instances | 135,000+ | SecurityScorecard |
| Classified as vulnerable | 63% | SecurityScorecard |
| Malicious skills on ClawHub | 230+ | AuthMind |
| High-severity CVEs | 3 | Public exploit code available |

---

## Beast Companion's Security Posture

**Good news**: Beast Companion is distributed directly, not through ClawHub. This means:

- You get code directly from our repository
- No supply chain risk from ClawHub marketplace
- You can audit the source before installation
- No third-party dependencies beyond OpenClaw itself

**What Beast Companion accesses**:
- Reads/writes to `~/.openclaw/data/beast-companion/` (your alerts, journal, wallet config)
- Makes HTTP requests to our scoring API (`129.158.41.81:3100`)
- Optionally calls OpenSea and Alchemy APIs (if you provide keys)

**What Beast Companion does NOT do**:
- Execute arbitrary shell commands
- Access files outside its data directory
- Send your data anywhere except the configured API
- Run background processes or crons

---

## Required: Pre-Flight Security Check

Before using OpenClaw with any plugins, run:

```bash
openclaw security audit --deep
```

This checks for:
- Exposed ports and services
- Overly permissive file access
- Skills with suspicious behavior
- Known vulnerable configurations

**Address all findings before proceeding.**

---

## Recommended: Security Hardening

### 1. Isolate OpenClaw

Don't run OpenClaw on your primary machine if you handle sensitive data. Options:

- **Dedicated Mac Mini**: Cheap, always-on, physically separate
- **Docker container**: Isolated environment
- **VPS**: Fully remote, disposable if compromised
- **VM**: Local isolation without hardware cost

### 2. Limit Network Exposure

OpenClaw should NOT be accessible from the internet. Check:

```bash
# Should return nothing or only localhost
netstat -an | grep 18789
```

If you see `0.0.0.0:18789` or your public IP, fix immediately.

### 3. Review Skills Before Installing

Every skill you install can:
- Read your conversations
- Access your file system
- Make network requests
- Modify OpenClaw's behavior

**Only install skills from trusted sources.** For each skill:
- Check the repository
- Read the code (especially `SKILL.md` and any `.ts`/`.js` files)
- Look for recent updates and issue resolution
- Verify the maintainer's reputation

### 4. Use Allowlists

In `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "allow": ["beast-companion"]
  },
  "skills": {
    "allow": ["qmd"]
  }
}
```

This prevents accidental loading of untrusted extensions.

### 5. Git-Version Your Config

```bash
cd ~/.openclaw
git init
git add openclaw.json
git commit -m "Initial config"
```

Commit before every change. This gives you:
- Rollback capability
- Audit trail
- Detection of unexpected changes

### 6. Monitor Token Usage

High token usage can indicate:
- Runaway agent loops
- Compromised skills exfiltrating data
- Misconfigured memory causing context explosion

Check the OpenClaw dashboard or your provider's usage page regularly.

---

## If You Suspect Compromise

1. **Stop OpenClaw immediately**: `pkill -f openclaw` or `pm2 stop all`
2. **Disconnect from network** if possible
3. **Review recent changes**: `git diff` in your config directory
4. **Check for unauthorized skills**: `ls ~/.openclaw/skills/`
5. **Rotate API keys**: All providers, OpenSea, Alchemy, etc.
6. **Review wallet activity**: Check for unauthorized transactions

---

## Reporting Security Issues

If you find a security issue in Beast Companion:

1. **Do not open a public issue**
2. Contact us privately via AKCB Discord (DM a moderator)
3. Include: description, reproduction steps, potential impact
4. We'll acknowledge within 48 hours

For OpenClaw core security issues, report to the OpenClaw team directly.

---

## Resources

- [AuthMind: Malicious Skills Analysis](https://www.authmind.com/post/openclaw-malicious-skills-agentic-ai-supply-chain)
- [Vitto Rivabella: Security-First OpenClaw Setup](https://x.com/VittoStack/status/2018326274440073499)
- [OpenClaw Security Docs](https://docs.openclaw.ai/security)

---

*Last updated: 2026-02-16*
