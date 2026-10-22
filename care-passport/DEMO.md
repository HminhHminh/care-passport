# Care Passport — 2-Minute Judging Walkthrough 🩺🔐

> **Challenge 2: Emergent Authority with TideCloak**  
> *"Show what becomes possible when no single administrator, organisation, or AI can unilaterally override the rules protecting people’s data and decisions."*

---

## 🚀 Quick Launch

1. **Start the Web Prototype**:
   ```bash
   cd care-passport
   npm start
   ```
2. **Open in Browser**:
   👉 **`http://localhost:8088`**

3. **Run the 9-Test Automated Verification Suite** (in a separate terminal):
   ```bash
   cd care-passport
   npm test
   ```

---

## 🎬 5-Step Judging Demo Script

### Step 1: Patient Sovereignty (Sarah Connor)
1. Select the **👤 Sarah Connor (Patient)** tab.
2. Note her 3 synthetic medical records:
   - *Routine Lipid Panel* (General)
   - *Cardiology Diagnostic Angiogram* (Specialist)
   - *Clinical Psychiatric & Trauma Evaluation* (Highly Sensitive)
3. Notice: All records are stored and served as **zero-knowledge AES-256-GCM ciphertext**. The server holds **zero master keys**.

### Step 2: Granular Access Delegation (`RelationshipAttestation:1`)
1. On the **Cardiology Angiogram** card, click **"🛡️ Delegate Access via RelationshipAttestation"**.
2. Select **Dr. Marcus Chen (Cardiologist)** and choose **72 Hours**.
3. Click **"Sign & Authorize"**.
4. Observe:
   - A binary `RelationshipAttestation:1` policy is signed and registered on the Tide Fabric.
   - The grant table and the active delegation badge update dynamically.
   - Her **Psychiatric Evaluation** remains completely cryptographically sealed.

### Step 3: Clinician View & Authorized Decryption (Dr. Marcus Chen)
1. Switch to the **🔬 Dr. Marcus Chen (Cardiologist)** tab.
2. Notice the **Cardiology Angiogram** card indicates **`🔓 DECRYPTION PERMITTED`**.
3. Click **"🔓 Decrypt Client-Side (Tide Quorum)"**:
   - The ORK node visualizer illuminates **20/20 green nodes**.
   - Decryption runs **100% in browser RAM** via Web Crypto and Tide SDK. Plaintext biomarkers, diagnoses, and attending notes appear.
   - The server **never** saw the plaintext.

### Step 4: Cryptographic Refusal on Ungranted Records (Invariant I-07)
1. Still as Dr. Chen, look at the **Clinical Psychiatric Evaluation** card (**`🔒 CRYPTOGRAPHICALLY SEALED`**).
2. Click **"🔒 Test Access / Attempt Decryption"**.
3. **The Showstopper Moment:**
   - The ORK visualizer drops to **0/20 approved (Quorum Refused)**.
   - A styled **Tide Fabric Cryptographic Refusal** modal appears:
     ```
     Contract: RelationshipAttestation:1
     Reason: Access refused by Tide Fabric: Caller lacks active patient consent grant.
     Consensus Outcome: 0 of 20 ORK nodes approved. Key reconstruction REFUSED.
     ```
   - No single person, server, or AI can force the network to decrypt.

### Step 5: Zero-Delay Revocation & Persistence
1. Switch back to **👤 Sarah Connor**.
2. Scroll to the **Active Delegated Access Grants** table.
3. Click **"Revoke Access"** next to Dr. Chen's grant.
4. Confirm the prompt:
   - The status immediately turns red: **REVOKED**.
   - The revocation is persisted to disk on the server via `POST /api/policies/revoke`.
   - **Refresh the page (`F5`)**: Notice the revocation **persists**!
5. Switch to **Dr. Marcus Chen**: His card now shows **`🔒 CRYPTOGRAPHICALLY SEALED`**. Attempting decryption is mathematically rejected immediately.

---

## 🚨 The Rogue Admin / Compromised Database Simulator (Invariant I-09)

1. Switch to the **🚨 Rogue Admin Simulator** tab.
2. Click **"Inspect Raw Server Database"**:
   - Observe what an attacker or rogue sysadmin with full server access sees: unintelligible base64 ciphertext, IVs, and auth tags.
3. Click **"Attempt Super-Admin Override / In-Process Decipher"**:
   - The backend server process actually executes a real AES-256-GCM decipher attempt with root credentials.
   - **Result**: Instant Cryptographic Failure (`Unsupported state or unable to authenticate data`).
   - Proves mathematically that **server root access does NOT grant decryption authority**.

---

## 🧪 Verification & Audit

* **Tide Doctor Conformance**: `16/16 Passed` (live realm, strict DPoP, verified JWK, zero secrets leaked).
* **Automated Test Suite (`test.py`)**: `9/9 Passed` (Ciphertext at rest, DPoP framing, Rogue admin failure, Client policy engine, Zero key material in public bundles, Dynamic grant, Zero-delay revocation).
