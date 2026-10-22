# Care Passport 🩺🔐 & TideCloak Ecosystem

A complete, sovereign patient-governed medical records exchange built with **TideCloak Emergent Authority**, alongside the **Tide Pack** developer toolset and AI agent configuration.

---

## 📂 Repository Structure

| Directory / File | Description |
| :--- | :--- |
| [`care-passport/`](care-passport/) | **Working Hackathon Prototype**: Patient-governed medical records exchange where health records are encrypted client-side and decrypted only when patient consent and clinician DPoP credentials align across Tide ORK nodes. Decryption keys never exist on the server. |
| [`.agents/`](.agents/) | **Agent MCP Config**: Model Context Protocol configuration connecting AI coding agents (Antigravity, Cursor, Claude Code) to the live Tide MCP server (`https://mcp.tide.org/mcp`). |
| [`.tide-pack/`](.tide-pack/) | **TideCloak Starter Kits & Tools**: Collection of production templates (Next.js, Vite, Vanilla JS), Forseti smart contract harnesses, and verification scripts. |
| [`CARE_PASSPORT_TIDECLOAK_PLAN.md`](CARE_PASSPORT_TIDECLOAK_PLAN.md) | **Architecture & Implementation Plan**: Full security invariants, Emergent Authority mechanics, threat models, and RMIT hackathon challenge alignment. |
| [`STARTUP.md`](STARTUP.md) | **Quick Start Guide**: Compact step-by-step instructions on running the prototype, test suite, and diagnostic scripts. |
| [`care-passport/TESTING_WALKTHROUGH.md`](care-passport/TESTING_WALKTHROUGH.md) | **Interactive Testing Walkthrough**: Step-by-step judge and evaluator guide for testing all 5 personas on `localhost:8088`. |

---

## 🚀 Quick Start: Running Care Passport

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python 3** (for the automated test suites)

### 2. Launch the Application
```bash
# Navigate to the care-passport directory
cd care-passport

# Start the web server
npm start
```
The application will launch on:
👉 **`http://localhost:8088`**

### 3. Run Automated Integration & Webpage Tests
In a separate terminal (with the server running):
```bash
cd care-passport

# 1. Run the Localhost Webpage & Journey Verification Suite (8 Tests)
npm run test:webpage

# 2. Run the Cryptographic Security & Invariant Suite (10 Tests)
npm test
```

#### Test Suite Highlights:
1. **Live TideCloak Adapter**: Confirms realm configuration, vendor ID, verification key (`obQrxIm38q9...`), and 14/20 Home ORK quorum.
2. **DPoP Relay & Framing**: Verifies RFC 9449 relay endpoint, `Allow-CSP-From: *`, and byte-exact SHA256 integrity.
3. **Ciphertext at Rest**: Confirms all records on disk and in transit are pure AES-256-GCM ciphertext blobs.
4. **RelationshipAttestation:1 Policy Engine**: Validates binary policy serialization and parsing using `@tideorg/js` Models.Policy.
5. **Rogue Admin Override Blocked**: Proves server root/DBA privileges cannot decrypt records without patient policy (Invariant I-09, HTTP 403).
6. **Zero Server Keys & Client Enclave**: Asserts zero key material exists in served bundles or static assets (Invariant I-01 & I-11).
7. **Dynamic Delegation & Revocation**: Tests real-time policy grant, zero-delay revocation, and disk persistence across page reloads.
8. **Autonomous AI Persona & Quarantine**: Verifies 1-hour ephemeral inference in volatile RAM, non-ingestion guarantee, and mathematical lateral crawl refusal.

---

## 🖥️ Exploring the Prototype Features

Open **`http://localhost:8088`** in your browser to experience the 5 interactive persona flows:

1. **Patient Sovereignty (Sarah Connor)**:
   - View encrypted health records (Lipid Panel, Cardiology Angiogram, Psychiatric Evaluation).
   - Selectively delegate access to Dr. Marcus Chen (Cardiologist) or CardioScan-AI.
   - Keep Psychiatric Evaluation sealed under zero-knowledge encryption.
   - Execute zero-delay cryptographic revocation that persists across browser reloads.

2. **Clinician Access & Refusal (Dr. Marcus Chen & Dr. Sarah Marcus)**:
   - Switch to Dr. Marcus Chen (Cardiologist).
   - Decrypt the authorized **Cardiology Angiogram** client-side — watch the **20/20 ORK Consensus Engine** illuminate green nodes.
   - Attempt to access the ungranted Psychiatric Evaluation — witness immediate **Tide Fabric Cryptographic Refusal** (`0/20 ORK Quorum`).

3. **Autonomous AI Diagnostic Agent (🤖 CardioScan-AI)**:
   - Switch to the **🤖 CardioScan-AI** persona.
   - Run **Autonomous Inference (Volatile RAM)** on the granted Angiogram — inspect real-time neural biomarker metrics (LAD Stenosis, Plaque Calcification, Hemodynamic Flow).
   - Enforce the **Non-Ingestion Guarantee**: data is processed strictly in volatile memory with zero model fine-tuning retention.
   - Attempt lateral data scraping on ungranted records — Tide Fabric mathematically halts the request.

4. **Rogue Database Administrator Simulator**:
   - Switch to the **Rogue Database Administrator** panel.
   - Inspect the raw database records stored on the server disk.
   - Trigger a simulated root administrative override — observe real cryptographic failure as the server lacks the decentralized threshold quorum keys.

5. **Decentralized ORK Consensus Visualizers & Audit Log**:
   - Multi-view 20-node interactive Tide Fabric Consensus meters visible in Clinician View, AI View, Decrypted Viewer modal, Refusal modal, and Admin panel.
   - Live immutable cryptographic audit trail tracking all grants, decryptions, refusals, and revocations.

---

## 📖 Step-by-Step Testing Walkthrough
For the complete, illustrated judge's walkthrough guide, see:
👉 [care-passport/TESTING_WALKTHROUGH.md](care-passport/TESTING_WALKTHROUGH.md)

---

## 🤖 Using `.agents` (MCP Configuration)

The [`.agents/mcp_config.json`](.agents/mcp_config.json) file configures the **Tide Model Context Protocol (MCP)** server:

```json
{
  "mcpServers": {
    "tide": {
      "serverUrl": "https://mcp.tide.org/mcp"
    }
  }
}
```

### Supported IDEs & AI Agents:
- **Google Antigravity IDE**: Automatically detects `.agents/mcp_config.json` in the workspace root.
- **Cursor**: Configure under *Cursor Settings > Features > MCP*.
- **Claude Code**: Add using `claude mcp add tide https://mcp.tide.org/mcp`.

### Available MCP Tools:
- `tide_list`: List available Tide recipes, templates, and patterns.
- `tide_doctor`: Run preflight environment and realm diagnostics.
- `tide_bootstrap`: Generate and deploy TideCloak realm configurations.
- `tide_dpop_asset`: Generate and verify DPoP-bound client credentials.
- `tide_scaffold`: Generate new Tide-enabled application templates.

---

## 🛠️ Using `.tide-pack` (Starter Templates & Tools)

The [`.tide-pack/`](.tide-pack/) directory contains production-ready boilerplates and verification scripts:

### 1. Run Environment Diagnostics
Verify your machine's environment and Tide network reachability:
```bash
bash .tide-pack/templates/shared/tide-doctor.sh
```

### 2. Available Starter Templates

| Template | Path | Description |
| :--- | :--- | :--- |
| **Next.js E2EE Vault** | [`.tide-pack/templates/nextjs-e2ee-vault`](.tide-pack/templates/nextjs-e2ee-vault) | Zero-knowledge client-side encryption vault with Next.js App Router. |
| **React + Vite Dashboard** | [`.tide-pack/templates/react-vite-internal-dashboard`](.tide-pack/templates/react-vite-internal-dashboard) | High-performance internal staff portal with TideCloak IAM. |
| **Vanilla JS Secure Form** | [`.tide-pack/templates/vanilla-js-secure-form`](.tide-pack/templates/vanilla-js-secure-form) | Minimal dependency-free form with DPoP authentication. |
| **Forseti Compile Harness** | [`.tide-pack/templates/forseti-compile-harness`](.tide-pack/templates/forseti-compile-harness) | C# smart contract harness for authoring Tide Fabric contracts. |
| **DPoP Verification** | [`.tide-pack/templates/dpop-verify`](.tide-pack/templates/dpop-verify) | Reusable TypeScript utilities for validating DPoP proof headers. |

To run any template (e.g., React + Vite):
```bash
cd .tide-pack/templates/react-vite-internal-dashboard
npm install
npm run dev
```

---

## 📜 License & Acknowledgments

- **Built with TideCloak** — [Tide Foundation](https://tide.org)
- Developed for the **RMIT UNLOCKED Hackathon 2026 (Challenge 2)**
- Licensed under the [MIT License](care-passport/package.json).
