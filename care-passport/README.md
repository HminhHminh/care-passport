# Care Passport 🩺🔐

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)
[![Tide Doctor](https://img.shields.io/badge/Tide%20Doctor-16%2F16%20Passed-brightgreen)](https://tide.org/docs/tide-doctor)
[![Webpage Tests](https://img.shields.io/badge/Webpage%20Tests-8%2F8%20Passed-brightgreen)](#automated-localhost-webpage-tests-npm-run-testwebpage)
[![Compliance Suite](https://img.shields.io/badge/Compliance%20Suite-10%2F10%20Passed-brightgreen)](#automated-compliance--security-invariant-tests-npm-test)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Care Passport** is a patient-governed medical records exchange built for **UNLOCKED: RMIT Hackathon 2026 (Challenge 2: TideCloak Emergent Authority)**. Medical records are encrypted client-side and decrypted only when an active patient consent policy and an authenticated entity's DPoP proof align across Tide's decentralized threshold network (14-of-20 ORK nodes). Decryption keys never exist on the server.

---

## 📑 Table of Contents
- [Project Overview](#project-overview)
- [Interactive Personas & Features](#interactive-personas--features)
- [Architecture & Cryptographic Invariants](#architecture--cryptographic-invariants)
- [Tide Fabric Consensus & Multi-View Visualizers](#tide-fabric-consensus--multi-view-visualizers)
- [Quick Start: Running Care Passport](#quick-start-running-care-passport)
- [Automated Verification & Testing Suites](#automated-verification--testing-suites)
  - [Localhost Webpage Verification (`npm run test:webpage`)](#1-localhost-webpage-verification-npm-run-testwebpage)
  - [TideCloak Compliance & Security Invariants (`npm test`)](#2-tidecloak-compliance--security-invariants-npm-test)
- [Step-by-Step Testing Walkthrough](#step-by-step-testing-walkthrough)
- [Tide Doctor Conformance Audit](#tide-doctor-conformance-audit)
- [2-Minute Demonstration Video Guide](#2-minute-demonstration-video-guide-demomp4)
- [Technology Stack](#technology-stack)
- [License](#license)

---

## Project Overview

### 1. Vision & Originality
Care Passport transforms healthcare data into patient-sovereign cryptographic assets. Instead of hospitals holding master keys in centralized portals, Care Passport lets patients selectively delegate decryption rights for individual records directly to clinicians and autonomous AI agents without creating readable copies in server storage.

### 2. Trust Constraint Insight
Today, medical collaboration is paralyzed by custodial trust. Sharing reports across clinics forces patients to expose unredacted histories to centralized databases, where a single breach or rogue administrator leaks millions of intimate medical records. Furthermore, healthcare AI integrations risk ingesting patient records into training corpuses.

### 3. Value & Impact
Patients confidently disclose sensitive history knowing general staff cannot access it. For example, Sarah shares her cardiology report with a specialist while her psychiatric notes remain cryptographically sealed. Autonomous AI agents process diagnostic telemetry in volatile memory without retaining data. Clinics eliminate the existential liability of storing plaintext record pools.

### 4. Why TideCloak Matters
Care Passport uses TideCloak’s Emergent Authority and `RelationshipAttestation:1`. Records are sealed client-side before upload. Decryption keys never exist on the server; authority emerges across independent Tide ORK nodes only when patient policy and entity DPoP token align. Root database administrators obtain only ciphertext.

---

## Interactive Personas & Features

Care Passport features 5 fully interactive personas accessible via the top role switcher at `http://localhost:8088`:

1. **Patient Portal (Sarah Connor)**:
   - View sovereign encrypted health records (Lipid Panel, Cardiology Angiogram, Psychiatric Evaluation).
   - Dynamically grant time-bounded access to specific clinicians or AI agents.
   - Execute zero-delay cryptographic revocation that persists across page refreshes.

2. **General Practitioner (Dr. Sarah Marcus)**:
   - Holds patient-granted access to routine diagnostic panels (e.g., Lipid Panel).
   - Quorum is refused when attempting to access specialist or ungranted records.

3. **Specialist Cardiologist (Dr. Marcus Chen)**:
   - Client-side enclave decryption for granted Cardiology Angiograms.
   - Encounters immediate **Tide Fabric Cryptographic Refusal** (`0/20 ORK Quorum`) when attempting to read Sarah's Psychiatric Evaluation.

4. **Autonomous AI Diagnostic Agent (🤖 CardioScan-AI)**:
   - **Ephemeral Inference**: Analyzes angiography telemetry strictly in volatile RAM.
   - **Neural Biomarker Analytics**: Computes real-time LAD stenosis (68%), calcification index, and hemodynamic flow.
   - **Non-Ingestion Guarantee**: Zero model fine-tuning retention; memory is discarded upon session closure.
   - **Quarantine from Lateral Crawling**: Mathematical lock prevents AI from accessing records outside its narrow scope.

5. **Rogue Database Administrator Simulator**:
   - Inspect raw server database records stored on disk (pure AES-256-GCM ciphertext).
   - Simulate a root administrative override attempt — provably fails with HTTP 403 (Invariant I-09).

---

## Architecture & Cryptographic Invariants

```
                                  +------------------------------------+
                                  |     Tide Decentralized Network     |
                                  |   (ORK Quorum: 14-of-20 Nodes)     |
                                  +-----------------+------------------+
                                                    |
                                      Emergent Decryption Authority
                                      (Only if Policy & Token Align)
                                                    |
                                                    v
+---------------------+              +----------------------+              +----------------------+
|   Patient (Sarah)   |              | Clinician / AI Agent |              |  Rogue Admin / Host  |
|  Client-Side Portal |              |  Client-Side Portal  |              |  Unprivileged Vault  |
+----------+----------+              +----------+-----------+              +----------+-----------+
           |                                    |                                     |
    Issues Policy via                    Requests Key via                      Inspects Database
RelationshipAttestation:1                 RFC 9449 DPoP                         or Memory
           |                                    |                                     |
           v                                    v                                     v
+---------------------+              +----------------------+              +----------------------+
| Active Grant Stored |              | Client-Side Decrypt  |              | Pure AES-256-GCM     |
| on Decentralized    |              | (Web Crypto / Tide)  |              | Ciphertext at Rest   |
| Fabric              |              |                      |              | OVERRIDE REFUSED (I9)|
+---------------------+              +----------------------+              +----------------------+
```

Care Passport strictly enforces five core cryptographic invariants:

- **Invariant I-01 (Ciphertext at Rest & Zero Server Keys)**:
  Medical records in `data/synthetic_records.json` and in transit are strictly encrypted blobs (`AES-256-GCM` with 96-bit IV and 128-bit authentication tag). The server backend is strictly an unprivileged relay; it possesses zero decryption keys, zero master secrets, and zero access to plaintext health data.

- **Invariant I-04 (Cryptographic DPoP Binding)**:
  Access tokens issued by TideCloak are bound to an ephemeral `ES256` key pair generated in the client browser (RFC 9449). Stolen tokens cannot be replayed from any other machine or origin. The DPoP relay at `/tide_dpop/iss/<hex>/aud/<hex>/tide_dpop_auth.html` serves the exact byte sequence required by Tide with `Allow-CSP-From: *`.

- **Invariant I-07 (RelationshipAttestation:1 Policy)**:
  Record access policies are expressed via Tide’s built-in `RelationshipAttestation:1` contract using `@tideorg/js` binary models. Access is evaluated dynamically against the subject ID, target role, record category, and expiration timestamp.

- **Invariant I-09 (Rogue Admin Mathematical Impossibility)**:
  Centralized hospital databases suffer from administrator compromise. In Care Passport, root access to the server, OS, or SQL database yields zero plaintext. Unilateral administrative overrides are mathematically rejected by the decentralized ORK quorum.

- **Invariant I-11 (Zero Key Material in Public Bundles)**:
  Public static assets and served bundles (`app.js`, `tide-bundle.js`) contain zero fallback private keys or decryption backdoors. Decryption emerges solely through authorized cryptographic consensus.

---

## Tide Fabric Consensus & Multi-View Visualizers

Care Passport provides real-time transparency into Tide's decentralized threshold consensus engine through 20-node interactive visualizer meters:
- **Clinician & AI Portal**: Real-time status of the 20 ORK nodes during decryption requests.
- **Decrypted Record Viewer Modal**: Highlights 20/20 green nodes confirming quorum satisfaction before displaying record contents.
- **Fabric Cryptographic Refusal Modal**: Visualizes consensus failure (0 approving, 20 rejecting nodes) when unauthorized or lateral access is attempted.
- **Rogue Admin Simulator**: Displays mathematical lock preventing server-side key reconstruction.

---

## Quick Start: Running Care Passport

### Prerequisites
- **Node.js** (v18+)
- **Python 3** (v3.10+)

### 1. Installation
```bash
git clone https://github.com/HminhHminh/care-passport.git
cd care-passport/care-passport
npm install
```

### 2. Launch Care Passport Server
```bash
npm start
```
The application will launch on:
👉 **`http://localhost:8088`**

---

## Automated Verification & Testing Suites

Care Passport includes two comprehensive, automated verification suites:

### 1. Localhost Webpage Verification (`npm run test:webpage`)
Tests all HTML DOM bindings, REST endpoints, and 4 complete user journeys:
```bash
npm run test:webpage
```
**Results (8/8 Passed - 100% Success)**:
- `Test 1`: Server reachability, HTTP 200 health, and static asset delivery.
- `Test 2`: HTML DOM structure across all 39 interactive persona elements.
- `Test 3`: Frontend script bindings & global handler alignment (`switchRole`, `requestDecryption`, etc.).
- `Test 4`: Webpage API backend endpoints (`/records`, `/policies`, `/raw-database`, `/override`, `/audit-log`).
- `Test 5`: Journey 1 — Patient Sarah Connor creates grant for Dr. Marcus Chen; binary policy verified.
- `Test 6`: Journey 2 — Dr. Chen attempts access on ungranted Psychiatric record; 0/20 ORK refusal verified.
- `Test 7`: Journey 3 — Autonomous AI (CardioScan-AI) ephemeral inference & lateral scraping refusal.
- `Test 8`: Journey 4 — Zero-Delay Revocation & disk persistence across browser reload (F5).

### 2. TideCloak Compliance & Security Invariants (`npm test`)
Verifies cryptographic invariants, zero server-held keys, and binary policy engines:
```bash
npm test
```
**Results (10/10 Passed - 100% Success)**:
- `Test 1`: Live TideCloak realm adapter configuration (`care-passport`, vendor `03054760...`, verification key `obQrxIm38q9...`).
- `Test 2`: DPoP relay endpoint & framing headers (`Allow-CSP-From: *`, byte-exact SHA256).
- `Test 3`: Ciphertext at Rest & zero plaintext in server database (AES-256-GCM).
- `Test 4`: RelationshipAttestation:1 persistent policy store.
- `Test 5`: Real Rogue Server Admin override attempt failed cryptographically (Invariant I-09).
- `Test 6`: Client-side binary policy serialization and validation with `@tideorg/js`.
- `Test 7`: Zero key material in public directory and served bundles (Invariants I-01 & I-11).
- `Test 8`: Dynamic RelationshipAttestation:1 policy grant.
- `Test 9`: Cryptographic policy revocation & server disk persistence.
- `Test 10`: Autonomous AI Agent ephemeral grant & lateral crawl refusal.

---

## Step-by-Step Testing Walkthrough

For an in-depth, click-by-click evaluation guide covering all personas on `http://localhost:8088`, please see:
👉 **[`TESTING_WALKTHROUGH.md`](TESTING_WALKTHROUGH.md)**

---

## Tide Doctor Conformance Audit

Care Passport was audited using Tide's official diagnostic tool (`tide-doctor.sh`) against the live containerized realm:

```text
Tide doctor — care-passport (framework: other)

Adapter
  PASS  adapter found: data/tidecloak.json
  PASS  adapter carries the embedded key (jwk)
  PASS  adapter has a signed origin entry (client-origin-auth-*)

DPoP — client
  PASS  useDPoP is set in the provider config

DPoP — relay page
  PASS  public/tide_dpop_auth.html is the known-good page

Protection
  PASS  server code verifies tokens

Secrets
  PASS  .env is gitignored
  PASS  no master-admin password written into a script or config

Running app — http://127.0.0.1:8088
  PASS  the relay URL answers 200
  PASS  the served page is byte-exact
  PASS  Allow-CSP-From is sent
  PASS  the relay URL sends its own script-src policy

Realm — care-passport
  PASS  realm exists
  PASS  IGA (governance) is enabled
  PASS  governance is in Tide mode (iga.attestor=tide)
  PASS  no pending change requests

============================================================
  16 passed, 0 fixed, 0 warning(s), 0 failure(s)
  RESULT: OK
============================================================
```

---

## 2-Minute Demonstration Video Guide (`demo.mp4`)

Our 2-minute walkthrough video is structured as follows:

| Timestamp | Section | Narrative & Key Actions |
|---|---|---|
| **0:00 – 0:30** | **The Possibility** | Introduction to Care Passport: healthcare data sovereignty. Patients own their medical keys instead of centralized portals. |
| **0:30 – 0:50** | **The Constraint** | The fundamental bottleneck: custodial hospital databases force unredacted data dumps and expose patients to catastrophic breaches and AI training ingestion. |
| **0:50 – 1:35** | **The Prototype** | **Live Interactive Demonstration**: <br>1. *Patient Portal*: Sarah grants Dr. Marcus Chen access to her Angiogram Report while keeping Psychiatric Notes sealed. <br>2. *Clinician Portal*: Dr. Chen decrypts the Angiogram report in-browser (20/20 ORK Quorum). Attempts to decrypt psychiatric notes: Tide Fabric refuses quorum (0/20 ORK Refusal). <br>3. *Autonomous AI Agent*: CardioScan-AI runs ephemeral inference in volatile RAM with non-ingestion guarantee; lateral scraping attempts are blocked. <br>4. *Revocation*: Sarah revokes access in real-time. Clinician immediately loses decryption ability across page reloads. <br>5. *Rogue Admin Simulation*: Database administrator attempts a superuser override — TideCloak mathematically refuses (Invariant I-09). |
| **1:35 – 2:00** | **What Changes** | Summary of the paradigm shift: Emergent Authority eliminates trust bottlenecks, enabling frictionless collaboration across clinics and AI agents without compromising patient privacy. |

---

## Technology Stack

- **Decentralized Authorization**: [TideCloak](https://tide.org) with Emergent Authority & IGA (`iga.attestor=tide`)
- **Policy Contract**: `RelationshipAttestation:1` via `@tideorg/js` & `@tidecloak/js`
- **Proof-of-Possession**: RFC 9449 DPoP (Strict mode with `ES256` key pairs)
- **Token Verification**: Local Ed25519 JWK verification (`jose`)
- **Encryption**: Client-Side `AES-256-GCM` via Web Crypto API (SubtleCrypto)
- **Backend Vault**: Node.js & Express (Zero-custody unprivileged ciphertext relay)
- **Frontend**: Vanilla ES Modules & Tailwind CSS with 20-node ORK Consensus Visualizers

---

## License

This project is licensed under the MIT License — see the [LICENSE](package.json) file for details. Built for the UNLOCKED RMIT Hackathon 2026.
