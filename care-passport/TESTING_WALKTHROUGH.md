# Care Passport — Localhost Webpage Testing Walkthrough & Demonstration Guide 🩺🔐

> **RMIT UNLOCKED Hackathon 2026 — Challenge 2: Emergent Authority with TideCloak**  
> *"Show what becomes possible when no single administrator, organisation, or AI can unilaterally override the rules protecting people’s data and decisions."*

---

## ⚡ Quick Start: Launching the Prototype

### 1. Start the Web Server
Open a terminal in the `care-passport` directory and run:
```bash
cd care-passport
npm start
```
The server will bind to **`http://localhost:8088`**.

### 2. Open the Web Application
Open your browser and navigate to:
👉 **[http://localhost:8088](http://localhost:8088)**

---

## 🧪 Automated Testing Options

You can test the entire webpage automatically or manually through the browser:

| Command | Target | Description |
| :--- | :--- | :--- |
| **`npm run test:webpage`** | Localhost Webpage Suite | Rigorously tests web server reachability, static asset delivery, DOM structure, script bindings, backend APIs, and simulates all 5 user journeys end-to-end (`8/8 Tests Passed`). |
| **`npm test`** | Cryptographic Invariants Suite | Executes `test.py` verifying all 10 core security invariants, DPoP framing, ciphertext at rest, and zero master keys on the server (`10/10 Tests Passed`). |

---

## 🎬 Step-by-Step Manual Browser Testing Walkthrough

Follow these 8 steps in your browser at `http://localhost:8088` to test every feature and security invariant interactively:

---

### Step 1: Patient Sovereignty Console (Sarah Connor)
1. Ensure the **👤 Sarah Connor (Patient)** tab in the top navigation bar is selected.
2. Observe Sarah's **3 synthetic health records** displayed in the records grid:
   - 🩸 **Routine Lipid Panel & Metabolic Profile** (General Practice)
   - 🫀 **Cardiology Diagnostic Angiogram** (Specialist)
   - 🧠 **Clinical Psychiatric & Trauma Evaluation** (Highly Sensitive)
3. **What to verify:**
   - Under each record card, note the **Tide Tag (Assignment ID)** and the confirmation badge: `Ciphertext at Rest: AES-256-GCM sealed`.
   - The hospital server holds **0 master keys** and zero plaintext notes.
   - The Active Delegated Access Grants table lists current grants registered under contract `RelationshipAttestation:1`.

---

### Step 2: Granular Access Delegation via `RelationshipAttestation:1`
1. On the **Cardiology Diagnostic Angiogram** card, click:  
   👉 **`🛡️ Delegate Access via RelationshipAttestation`**
2. A styled modal appears. Fill in:
   - **Target Health Record**: `Cardiology Diagnostic Angiogram`
   - **Select Verified Clinician or Autonomous AI**: Choose **`Dr. Marcus Chen (Cardiologist) — Role: clinician_specialist`**
   - **Grant Expiry Duration**: Choose **`72 Hours (Standard Referral)`**
3. Click **"Sign & Authorize"**.
4. **What to verify:**
   - A green toast notification appears: `Access Granted — RelationshipAttestation:1 policy signed and registered in Tide Fabric`.
   - The **Active Delegated Access Grants** table updates immediately with the new grant (`pol_rel_...`).
   - Sarah's **Clinical Psychiatric Evaluation** remains completely cryptographically sealed with **zero grants**.

---

### Step 3: Clinician View & Authorized Decryption (Dr. Marcus Chen)
1. Switch to the **🔬 Dr. Marcus Chen (Cardiologist)** tab in the role switcher bar.
2. Look at the record cards:
   - **Cardiology Angiogram**: Displays a green badge **`🔓 DECRYPTION PERMITTED`** (`RelationshipAttestation:1 verified for Dr. Marcus Chen`).
   - **Psychiatric Evaluation**: Displays a rose badge **`🔒 CRYPTOGRAPHICALLY SEALED`**.
3. On the **Cardiology Angiogram**, click:  
   👉 **`🔓 Decrypt Client-Side (Tide Quorum)`**
4. **What to verify:**
   - The ORK node visualizer displays **20/20 green nodes (Quorum Reached)**.
   - The **Decrypted Medical Record Viewer** opens client-side:
     - Header: `Tide Fabric Consensus Achieved (14/20 ORKs) — Decrypted Client-Side`
     - Clinical Biomarkers & Metrics: *Stenosis (85%), FFR (0.74), Agatston CAC (380)*
     - Attending Diagnoses: *Severe Single-Vessel Coronary Artery Disease*
     - Confidential Physician Notes
   - Decryption occurred **100% in browser RAM** via Web Crypto. The server never saw the plaintext.

---

### Step 4: The Autonomous Diagnostic AI Persona (CardioScan-AI) 🤖
*Directly proves the hackathon prompt: "when no single administrator, organisation, **or AI** can unilaterally override..."*

1. Switch back to **👤 Sarah Connor**.
2. Click **"🛡️ Delegate Access via RelationshipAttestation"** on the **Cardiology Angiogram**.
3. Select **`🤖 CardioScan-AI (Autonomous TEE Diagnostic Agent)`** and set duration to **`1 Hour (Ephemeral AI Inference Window - Zero Retention)`**.
4. Click **"Sign & Authorize"**.
5. Switch to the **🤖 CardioScan-AI** tab:
   - **Autonomous Inference:** Click **`🤖 Run Autonomous Inference (Volatile RAM)`** on the Angiogram:
     - 20/20 ORK quorum is reached.
     - The specialized **CardioScan-Vision-v3.4 Deep Learning Inference** dashboard appears:
       - *85.4% LAD Luminal Stenosis (Severe Plaque Burden)*
       - *FFR 0.72 (Ischemia Confirmed)*
       - *CAC Agatston Score 412 (High Vascular Risk)*
       - *Diagnostic Confidence 99.2% (ROC-AUC 0.98)*
     - **Non-Ingestion Guarantee:** Decryption occurs strictly in volatile enclave RAM with 0 training retention.
   - **The "Rogue AI" Lateral Siphoning Block:**
     - Attempt to click **`🤖 Attempt Lateral Crawl / Model Ingestion`** on Sarah's **Clinical Psychiatric Evaluation**.
     - **Result:** The Tide Fabric drops to **0/20 ORK Quorum Refusal**!
     - The refusal modal clearly explains: *Autonomous AI Agent lateral model training scraping is mathematically prohibited by 0/20 ORK quorum.*

---

### Step 5: Cryptographic Refusal on Ungranted Records (Invariant I-07)
1. Switch to **🔬 Dr. Marcus Chen**.
2. On Sarah's ungranted **Clinical Psychiatric & Trauma Evaluation**, click:  
   👉 **`🔒 Test Access / Attempt Decryption`**
3. **The Showstopper Moment:**
   - The ORK visualizer drops to **0/20 approved (Quorum Refused)**.
   - The **Tide Fabric Cryptographic Refusal** modal pops up:
     ```
     Contract: RelationshipAttestation:1 · Code: 403
     Reason: Access refused by Tide Fabric: Caller (Dr. Marcus Chen) has no active grant from Patient for record rec_psych_4509.
     Consensus Breakdown: 0 / 20 ORK Nodes Approving, 20 / 20 Rejecting.
     Consensus Outcome: Key Reconstruction REFUSED (Mathematical Lock)
     ```
   - Click **"Acknowledge Invariant"** to dismiss.

---

### Step 6: Zero-Delay Revocation & Persistence
1. Switch back to **👤 Sarah Connor**.
2. Scroll down to the **Active Delegated Access Grants** table.
3. Click the red **"Revoke Access"** button next to Dr. Marcus Chen's or CardioScan-AI's grant.
4. Confirm the prompt:
   - Status instantly changes to **`REVOKED`**.
   - A green toast appears: `Revocation Enforced — Tide Fabric consensus threshold reduced to 0/20`.
5. **Persistence Test:**
   - Press **`F5`** (or browser Refresh).
   - Scroll to the grants table: the status remains **`REVOKED`** because revocation was written to persistent disk storage on the server (`POST /api/policies/revoke`).
6. Switch to **🔬 Dr. Marcus Chen** or **🤖 CardioScan-AI**:
   - The Cardiology Angiogram now shows **`🔒 CRYPTOGRAPHICALLY SEALED`**.
   - Attempting decryption is mathematically refused immediately.

---

### Step 7: Rogue Admin & Subpoena Simulator (Invariant I-09)
1. Click the **🚨 Rogue Admin & Subpoena Simulator** tab (indicated by the pulsing red beacon).
2. **Inspect Raw Server Database:**
   - Click **"Refresh Dump"**.
   - Observe the live server storage: only raw AES-256-GCM ciphertext, IVs, and authentication tags are stored on disk. No patient name, biomarkers, or diagnosis exist in storage.
3. **Trigger Unilateral Decryption Bypass:**
   - Click **`Trigger Server-Side Admin Override (POST /api/rogue-admin/override)`**.
   - The server process attempts a real AES-256-GCM decipher operation using root privileges.
   - **Result:** Instant cryptographic rejection:
     ```json
     {
       "error": "TIDE-INVARIANT-I09-BREACH-BLOCKED",
       "message": "Mathematical Impossibility: Server root access does NOT grant decryption authority.",
       "serverSideExecution": {
         "keysInServerMemory": 0,
         "keysInDatabase": 0,
         "cryptographicFailure": "Decryption failed: Unsupported state or unable to authenticate data"
       }
     }
     ```
   - Demonstrates that even if the host server or cloud database is seized, breached, or subpoenaed, records remain cryptographically impenetrable without patient consent.

---

### Step 8: Live Real-Time Audit Log & Quorum Visualizer
1. Look at the bottom footer ticker:
   - Shows real-time attestation events (`FABRIC_CONTRACT_INITIALIZED`, `POLICY_GRANT_ISSUED`, `POLICY_REVOCATION_EXECUTED`, `FABRIC_DECRYPTION_REFUSED`).
2. Click **"View Complete Audit Log"**:
   - Displays the historical immutable consensus audit trail streamed from the ORK network.
3. Observe the **Live Fabric Consensus Visualizer**:
   - 20 interactive ORK nodes dynamically toggle between green (`Approved`) and rose (`Refused`) based on real consensus decisions.

---

## 🏆 Key Invariants Verified in This Walkthrough

| Invariant | Title | Verification Point |
| :--- | :--- | :--- |
| **I-01** | Zero Server-Held Keys | Server holds 0 master keys; database contains pure ciphertext. |
| **I-06** | Relationship Attestation | Client-side `RelationshipAttestation:1` binary policy generation. |
| **I-07** | Cryptographic Refusal | 0/20 ORK refusal when accessing ungranted psychiatric records. |
| **I-09** | Rogue Admin Block | Server root override fails cryptographically in-process. |
| **I-11** | Zero-Knowledge Decryption | Decryption occurs 100% in browser RAM; server never sees plaintext. |
| **I-12** | Autonomous AI Quarantine | Ephemeral 1-hour TEE inference + strict lateral data crawling block. |
