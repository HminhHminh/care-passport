# Care Passport 🩺🔐

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)
[![Tide Doctor](https://img.shields.io/badge/Tide%20Doctor-16%2F16%20Passed-brightgreen)](https://tide.org/docs/tide-doctor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Care Passport** is a patient-governed medical records exchange built for **UNLOCKED: RMIT Hackathon 2026 (Challenge 2)**. Medical records are encrypted client-side and decrypted only when an active patient consent policy and an authenticated clinician's DPoP proof align across Tide's decentralized threshold network (14-of-20 ORK nodes). Decryption keys never exist on the server.

---

## Project Overview

### 1. Vision & Originality
Care Passport transforms healthcare data into patient-sovereign cryptographic assets. Instead of hospitals holding master keys to centralized portals, Care Passport lets patients selectively delegate decryption rights for individual records directly to clinicians without creating readable copies in server storage.

### 2. Trust Constraint Insight
Today, medical collaboration is paralyzed by custodial trust. Sharing reports across clinics forces patients to expose unredacted histories to centralized databases, where a single breach or rogue administrator leaks millions of intimate medical records.

### 3. Value & Impact
Patients confidently disclose sensitive history knowing general staff cannot access it. For example, Sarah shares her cardiology report with a specialist while her psychiatric notes remain cryptographically sealed. Clinics eliminate the existential liability of storing plaintext record pools.

### 4. Why TideCloak Matters
Care Passport uses TideCloak’s Emergent Authority and `RelationshipAttestation:1`. Records are sealed client-side before upload. Decryption keys never exist on the server; authority emerges across independent Tide ORK nodes only when patient policy and clinician DPoP token align. Root database administrators obtain only ciphertext.

### 5. Prototype & Key Interactions
Our prototype demonstrates:
- Patient Sarah sharing an angiogram with Dr. Chen while keeping psychiatric notes private.
- Dr. Chen decrypting the angiogram client-side; his attempt to access ungranted records is refused by Tide Fabric.
- Sarah revoking access, immediately blocking subsequent decryptions.
- The Rogue Admin Simulator proving database compromise yields only useless ciphertext.

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
|   Patient (Sarah)   |              |  Clinician (Dr Chen) |              |  Rogue Admin / Host  |
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

Care Passport enforces four core cryptographic invariants:

- **Invariant I-01 (Ciphertext at Rest & Zero Server Keys)**:
  Medical records in `data/synthetic_records.json` and in transit are strictly encrypted blobs (`AES-256-GCM` with 96-bit IV and 128-bit authentication tag). The server backend is strictly an unprivileged relay; it possesses zero decryption keys, zero master secrets, and zero access to plaintext health data.

- **Invariant I-04 (Cryptographic DPoP Binding)**:
  Access tokens issued by TideCloak are bound to an ephemeral `ES256` key pair generated in the client browser (RFC 9449). Stolen tokens cannot be replayed from any other machine or origin. The DPoP relay at `/tide_dpop/iss/<hex>/aud/<hex>/tide_dpop_auth.html` serves the exact byte sequence required by Tide with `Allow-CSP-From: *`.

- **Invariant I-07 (RelationshipAttestation:1 Policy)**:
  Record access policies are expressed via Tide’s built-in `RelationshipAttestation:1` contract using `@tideorg/js` binary models. Access is evaluated dynamically against the subject ID, target role, record category, and expiration timestamp.

- **Invariant I-09 (Rogue Admin Mathematical Impossibility)**:
  Centralized hospital databases suffer from administrator compromise. In Care Passport, root access to the server, OS, or SQL database yields zero plaintext. Unilateral administrative overrides are mathematically rejected by the decentralized ORK quorum.

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

## Reproducibility & Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python 3** (v3.10+)
- **Docker** (v24+)

### 1. Installation & Dependencies
```bash
git clone https://github.com/HminhHminh/care-passport.git
cd care-passport
npm install
```

### 2. Start TideCloak Container
If TideCloak is already running on port 8080:
```bash
docker start tidecloak
```
*(To provision a brand new realm from scratch, run `REALM_NAME=care-passport CLIENT_NAME=care-passport-client CLIENT_APP_URL=http://localhost:8088 ./scripts/bootstrap.sh`)*

### 3. Launch Care Passport Server
```bash
npm start
```
The prototype is available at `http://localhost:8088`.

### 4. Run Automated Compliance & Security Invariant Tests
Execute the automated test suite to verify the 6 security invariants:
```bash
npm test
# or: python3 test.py
```

Expected output:
```text
▶ [Test 1] Verifying live TideCloak realm adapter configuration...  --> PASS
▶ [Test 2] Verifying DPoP relay endpoint & framing headers...       --> PASS
▶ [Test 3] Verifying Ciphertext at Rest & zero plaintext in DB...   --> PASS
▶ [Test 4] Verifying RelationshipAttestation:1 policy store...     --> PASS
▶ [Test 5] Simulating Rogue Server Admin override attempt...        --> PASS (HTTP 403 / Invariant I-09 Refusal)
▶ [Test 6] Verifying client-side policy engine (@tideorg/js)...     --> PASS
🎉 ALL 6 COMPLIANCE & INTEGRATION TESTS PASSED (100% SUCCESS)
```

---

## 2-Minute Demonstration Video Guide (`demo.mp4`)

Our 2-minute walkthrough video is structured as follows:

| Timestamp | Section | Narrative & Key Actions |
|---|---|---|
| **0:00 – 0:30** | **The Possibility** | Introduction to Care Passport: healthcare data sovereignty. Patients own their medical keys instead of centralized portals. |
| **0:30 – 0:50** | **The Constraint** | The fundamental bottleneck: custodial hospital databases force unredacted data dumps and expose patients to catastrophic breaches. |
| **0:50 – 1:35** | **The Prototype** | **Live Interactive Demonstration**: <br>1. *Patient Portal*: Sarah selectively grants Dr. Chen access to her Angiogram Report while keeping Psychiatric Notes sealed. <br>2. *Clinician Portal*: Dr. Chen logs in with DPoP strict credentials; the Angiogram report is decrypted in-browser. Clinician attempts to decrypt psychiatric notes: Tide Fabric refuses quorum (HTTP 403). <br>3. *Revocation*: Sarah revokes access in real-time. Clinician immediately loses decryption ability. <br>4. *Rogue Admin Simulation*: Database administrator attempts a superuser override — TideCloak mathematically refuses (Invariant I-09). |
| **1:35 – 2:00** | **What Changes** | Summary of the paradigm shift: Emergent Authority eliminates trust bottlenecks, enabling frictionless collaboration across clinics without compromising patient privacy. |

---

## Technology Stack

- **Decentralized Authorization**: [TideCloak](https://tide.org) with Emergent Authority & IGA (`iga.attestor=tide`)
- **Policy Contract**: `RelationshipAttestation:1` via `@tideorg/js` & `@tidecloak/js`
- **Proof-of-Possession**: RFC 9449 DPoP (Strict mode with `ES256` key pairs)
- **Token Verification**: Local Ed25519 JWK verification (`jose`)
- **Encryption**: Client-Side `AES-256-GCM` via Web Crypto API
- **Backend Vault**: Node.js & Express (Zero-custody unprivileged ciphertext relay)
- **Frontend**: Vanilla ES Modules & Tailwind CSS

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built for the UNLOCKED RMIT Hackathon 2026.
