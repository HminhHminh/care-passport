# Care Passport & TideCloak Ecosystem

A complete, sovereign patient-governed medical records exchange built with **TideCloak Emergent Authority**, alongside the **Tide Pack** developer toolset and AI agent configuration.

---

## 📂 Repository Structure

| Directory / File | Description |
| :--- | :--- |
| [`care-passport/`](file:///home/minh/Lab1_HCMUT/care-passport) | **Working Hackathon Prototype**: Patient-governed medical records exchange where health records are encrypted client-side and decrypted only when patient consent and clinician DPoP credentials align across Tide ORK nodes. |
| [`.agents/`](file:///home/minh/Lab1_HCMUT/.agents) | **Agent MCP Config**: Model Context Protocol configuration connecting AI coding agents (Antigravity, Cursor, Claude Code) to the live Tide MCP server (`https://mcp.tide.org/mcp`). |
| [`.tide-pack/`](file:///home/minh/Lab1_HCMUT/.tide-pack) | **TideCloak Starter Kits & Tools**: Collection of production templates (Next.js, Vite, Vanilla JS), Forseti smart contract harnesses, and verification scripts. |
| [`CARE_PASSPORT_TIDECLOAK_PLAN.md`](file:///home/minh/Lab1_HCMUT/CARE_PASSPORT_TIDECLOAK_PLAN.md) | **Architecture & Implementation Plan**: Full security invariants, Emergent Authority mechanics, threat models, and RMIT hackathon challenge alignment. |
| [`STARTUP.md`](file:///home/minh/Lab1_HCMUT/STARTUP.md) | **Quick Start Guide**: Compact step-by-step instructions on running the prototype, test suite, and diagnostic scripts. |

---

## 🚀 Quick Start: Running Care Passport

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python 3** (for the automated test suite)

### 2. Launch the Application
```bash
# Navigate to the care-passport directory
cd care-passport

# Start the web server
npm start
```
The application will launch on:
👉 **`http://localhost:8088`**

### 3. Run Automated Integration Tests
In a separate terminal (or with the server running):
```bash
cd care-passport
npm test
```
This executes `test.py` verifying all 5 core security invariants:
1. **Ciphertext at Rest**: Confirms all records on disk and in transit are pure AES-256-GCM ciphertext.
2. **Authorized Decryption**: Verifies `RelationshipAttestation:1` quorums release keys for authorized roles.
3. **Unauthorized Refusal**: Confirms Tide Fabric threshold failures on ungranted records (0/20 quorum).
4. **Rogue Admin Block**: Proves server root/DBA privileges cannot decrypt records without patient policy.
5. **Dynamic Grant & Immediate Revocation**: Tests real-time policy grant and immediate zero-delay revocation.

---

## 🖥️ Exploring the Prototype Features

Open **`http://localhost:8088`** in your browser to test the interactive flows:

1. **Patient Sovereignty (Sarah Connor)**:
   - View Sarah's encrypted health records (Lipid Panel, Cardiology Angiogram, Psychiatric Evaluation).
   - Grant Dr. Kevin Chen access specifically to the **Cardiology Angiogram**.
   - Notice that Psychiatric and General notes remain completely cryptographically sealed.

2. **Clinician Access & Refusal (Dr. Kevin Chen)**:
   - Switch to Dr. Chen's viewpoint.
   - Decrypt the authorized **Cardiology Angiogram** client-side.
   - Attempt to access ungranted records — observe the **Tide Fabric Threshold Refusal** (`0/20 ORK Quorum`).

3. **Dynamic Revocation**:
   - Switch back to Patient mode and click **"Revoke Access"**.
   - Dr. Chen immediately loses the ability to decrypt, with zero caching or bypass capability.

4. **Rogue Admin Simulator**:
   - Scroll to the **Rogue Database Administrator** panel.
   - Inspect the raw database records stored on the server.
   - Notice that even with full server access, the database administrator sees only random ciphertext, initialization vectors, and authentication tags.

---

## 🤖 Using `.agents` (MCP Configuration)

The [`.agents/mcp_config.json`](file:///home/minh/Lab1_HCMUT/.agents/mcp_config.json) file configures the **Tide Model Context Protocol (MCP)** server:

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

The [`.tide-pack/`](file:///home/minh/Lab1_HCMUT/.tide-pack) directory contains production-ready boilerplates and verification scripts:

### 1. Run Environment Diagnostics
Verify your machine's environment and Tide network reachability:
```bash
bash .tide-pack/templates/shared/tide-doctor.sh
```

### 2. Available Starter Templates

| Template | Path | Description |
| :--- | :--- | :--- |
| **Next.js E2EE Vault** | [`.tide-pack/templates/nextjs-e2ee-vault`](file:///home/minh/Lab1_HCMUT/.tide-pack/templates/nextjs-e2ee-vault) | Zero-knowledge client-side encryption vault with Next.js App Router. |
| **React + Vite Dashboard** | [`.tide-pack/templates/react-vite-internal-dashboard`](file:///home/minh/Lab1_HCMUT/.tide-pack/templates/react-vite-internal-dashboard) | High-performance internal staff portal with TideCloak IAM. |
| **Vanilla JS Secure Form** | [`.tide-pack/templates/vanilla-js-secure-form`](file:///home/minh/Lab1_HCMUT/.tide-pack/templates/vanilla-js-secure-form) | Minimal dependency-free form with DPoP authentication. |
| **Forseti Compile Harness** | [`.tide-pack/templates/forseti-compile-harness`](file:///home/minh/Lab1_HCMUT/.tide-pack/templates/forseti-compile-harness) | C# smart contract harness for authoring Tide Fabric contracts. |
| **DPoP Verification** | [`.tide-pack/templates/dpop-verify`](file:///home/minh/Lab1_HCMUT/.tide-pack/templates/dpop-verify) | Reusable TypeScript utilities for validating DPoP proof headers. |

To run any template (e.g., React + Vite):
```bash
cd .tide-pack/templates/react-vite-internal-dashboard
npm install
npm run dev
```

---

## 📜 License & Acknowledgments

- **Built with TideCloak** — [Tide Foundation](https://tide.org)
- Developed for the **RMIT UNLOCKED Hackathon**
- Licensed under the [MIT License](file:///home/minh/Lab1_HCMUT/care-passport/package.json).
