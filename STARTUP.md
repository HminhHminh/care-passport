# Quickstart: How to Run Care Passport & Tools

This guide explains how to start and test each component in this repository.

---

## 1. Care Passport Prototype (`care-passport`)

Care Passport is a zero-knowledge medical records exchange powered by TideCloak.

### Prerequisites
- **Node.js** v18+
- **Python 3**

### Step-by-Step
1. **Start the Web Application**:
   ```bash
   cd care-passport
   npm start
   ```
2. **Access the UI**:
   Open your browser to:
   👉 **`http://localhost:8088`**

3. **Run the Automated Test Suites**:
   In another terminal (or while the server is active):
   ```bash
   cd care-passport

   # 1. Automated Webpage & Persona Journey Test (8 Tests)
   npm run test:webpage

   # 2. Cryptographic Security Invariant Test Suite (10 Tests)
   npm test
   ```
   *Expected output*: `🎉 ALL 10 COMPLIANCE & INTEGRATION TESTS PASSED (100% SUCCESS)`.

### 📖 Full Interactive Testing Walkthrough
For the complete step-by-step demonstration and manual testing guide across all personas, see:
👉 [care-passport/TESTING_WALKTHROUGH.md](care-passport/TESTING_WALKTHROUGH.md)

### Key Interactive Flows to Try
- **Patient Dashboard**: Sarah Connor reviews records and grants access to Dr. Marcus Chen (Cardiology) or CardioScan-AI.
- **Clinician Dashboard**: Dr. Chen decrypts the granted Cardiology report client-side. Attempting to view ungranted psychiatric records triggers an immediate `0/20 ORK Quorum Refusal`.
- **Autonomous AI Persona (CardioScan-AI)**: Ephemeral 1-hour volatile RAM inference with 0 training retention, and strict mathematical blocking of lateral data exfiltration attempts.
- **Zero-Delay Revocation**: Sarah revokes the grant in real time; access is immediately revoked and persists across page refreshes.
- **Rogue DB Admin & Subpoena Simulator**: Inspect raw server database ciphertext and trigger server root override to prove server access does not grant decryption authority.

---

## 2. Tide AI Agent MCP (`.agents`)

The `.agents/mcp_config.json` file configures the Tide Model Context Protocol server.

### Connecting in Antigravity IDE / Cursor / Claude Code
- **Antigravity IDE**: Automatically loaded from `.agents/mcp_config.json`.
- **Endpoint**: `https://mcp.tide.org/mcp`
- **Capabilities**: Enables AI assistants to invoke Tide tools like `tide_doctor`, `tide_bootstrap`, `tide_scaffold`, and `tide_dpop_asset` directly during coding sessions.

---

## 3. Tide Developer Pack (`.tide-pack`)

Starter templates and diagnostic utilities for TideCloak development.

### Running System Diagnostics (`tide-doctor`)
```bash
bash .tide-pack/templates/shared/tide-doctor.sh
```

### Checking DPoP Assets
```bash
bash .tide-pack/scripts/check-dpop-asset.sh
```

### Running Starter Templates
For example, to run the React + Vite Internal Dashboard:
```bash
cd .tide-pack/templates/react-vite-internal-dashboard
npm install
npm run dev
```
Accessible at `http://localhost:5173`.
