# Care Passport

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

> **Care Passport** is a patient-governed medical records exchange where health records are encrypted client-side and decrypted only when active patient consent and an authenticated clinician’s role align across Tide's decentralized network.

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

## Setup & Running the Prototype

### Prerequisites
- Node.js (v18 or later)
- Python 3 (for test suite)

### 1. Quick Start
Clone the repository and run the application:
```bash
cd care-passport
npm start
```
The prototype will be live at:
```text
http://localhost:8088
```

### 2. Run Integration Tests
Verify the complete end-to-end cryptographic lifecycle:
```bash
npm test
```
This tests:
1. **Ciphertext at Rest**: Confirms records on disk and in transit are pure AES-256-GCM ciphertext.
2. **Authorized Decryption**: Verifies `RelationshipAttestation:1` quorum release.
3. **Unauthorized Refusal**: Confirms Tide Fabric threshold failure on ungranted records.
4. **Rogue Admin Block**: Proves root server privileges cannot bypass Emergent Authority.
5. **Dynamic Grant & Revocation**: Tests real-time policy issuance and immediate revocation.

---

## Demo Video Guide (2 Minutes)

A 2-minute demonstration video (`demo.mp4`, <100 MB) is recorded covering:
1. **The Possibility (0:00 - 0:30)**: Patient sovereignty in cross-clinic record sharing.
2. **The Constraint (0:30 - 0:50)**: Why centralized databases create dangerous trust bottlenecks.
3. **The Prototype (0:50 - 1:35)**:
   - Patient granting access to Cardiology report.
   - Clinician decrypting client-side.
   - Unauthorized access attempt blocked by Tide Fabric.
   - Immediate grant revocation.
   - Rogue Admin simulator showing raw ciphertext and failed superuser bypass.
4. **What Changes (1:35 - 2:00)**: Trust eliminated as the bottleneck for healthcare collaboration.
