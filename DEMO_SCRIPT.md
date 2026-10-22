# 🎬 Care Passport — 2-Minute Demo Video Script
### RMIT UNLOCKED Hackathon 2026 · Challenge 2: TideCloak Emergent Authority

> **Total Runtime:** Exactly 2:00 · **Spoken Word Count:** ~260 words @ ~130 wpm  
> **Format:** 1080p Screen Recording of `http://localhost:8088` with synchronized voiceover narration.  
> `[ON-SCREEN ACTION]` indicates exact visual movements during recording.

---

## ⏱️ 0:00 – 0:20 · THE PROBLEM & THE THREAT MODEL

> **[ON-SCREEN ACTION]**:  
> Start on `http://localhost:8088` on the **👤 Sarah Connor (Patient)** tab.  
> Slowly hover over Sarah's 3 encrypted health record cards, highlighting the badges: `Ciphertext at Rest: AES-256-GCM sealed` and `0 Master Keys on Server`.

**VOICEOVER / NARRATION:**
> *"Every hospital database is an existential liability.*  
> *When a patient shares their medical history, they hand the keys to a centralized administrator — a single entity that can leak it, sell it, or yield to a subpoena.*  
>  
> *We built **Care Passport** to make that impossible — mathematically."*

---

## ⏱️ 0:20 – 0:40 · MEET THE PARTICIPATING AGENTS

> **[ON-SCREEN ACTION]**:  
> Smoothly move the cursor along the top role switcher navigation:  
> **Patient (Sarah)** ➔ **Cardiologist (Dr. Marcus Chen)** ➔ **GP (Dr. Sarah Marcus)** ➔ **CardioScan-AI** ➔ **Rogue Database Administrator**.

**VOICEOVER / NARRATION:**
> *"Our system brings five independent agents onto the stage:*  
>  
> ***Sarah Connor**, the patient — sovereign owner of her cryptographic keys.*  
> ***Dr. Marcus Chen**, the specialist cardiologist — requiring narrow diagnostic access.*  
> ***CardioScan-AI**, an autonomous deep learning agent — granted an ephemeral 1-hour window with zero training retention.*  
> *And **the Rogue Administrator** — the server's most privileged user, about to hit a mathematical wall."*

---

## ⏱️ 0:40 – 1:05 · PATIENT SOVEREIGNTY & DELEGATION

> **[ON-SCREEN ACTION]**:  
> On Sarah's **Cardiology Diagnostic Angiogram** card, click **`🛡️ Delegate Access via RelationshipAttestation`**.  
> Select **Dr. Marcus Chen (Cardiologist)** and choose duration **72 Hours**.  
> Click **"Sign & Authorize"**. Green toast pops up: *"RelationshipAttestation:1 policy signed and registered in Tide Fabric"*.  
> Point cursor to the active grants table updating instantly with the new grant.

**VOICEOVER / NARRATION:**
> *"Sarah selects specifically her Cardiology Angiogram — while her psychiatric trauma evaluation remains sealed.*  
> *She signs a **RelationshipAttestation** policy backed by TideCloak's Emergent Authority.*  
>  
> *This policy is not stored on a central server. Authority is decentralized across **20 independent Tide ORK nodes** — where a strict 14-of-20 threshold is required to reconstitute decryption keys. No single entity can act alone."*

---

## ⏱️ 1:05 – 1:25 · CLINICIAN DECRYPTION & MATHEMATICAL REFUSAL

> **[ON-SCREEN ACTION]**:  
> Click the **🔬 Dr. Marcus Chen (Cardiologist)** tab.  
> Click **`🔓 Decrypt Client-Side (Tide Quorum)`** on the Angiogram.  
> Watch the 20-node visualizer illuminate **20/20 green nodes**. The modal reveals plaintext metrics (*Stenosis 85%, FFR 0.74*).  
> Close modal, then click **`🔒 Test Access / Attempt Decryption`** on the ungranted **Clinical Psychiatric Evaluation**.  
> Watch the ORK nodes immediately drop to **0/20 approved (Quorum Refused)** and the Refusal modal appear.

**VOICEOVER / NARRATION:**
> *"Dr. Chen initiates decryption. The Tide Fabric verifies his DPoP proof and reaches consensus — **20 of 20 ORK nodes approve**.*  
> *The angiogram decrypts **100% client-side in browser RAM**. The server never sees the plaintext.*  
>  
> *Now, Dr. Chen attempts to view Sarah's psychiatric notes.  
> **Zero of twenty nodes approve.**  
> Key reconstruction is mathematically refused. Not an access denied error — an impenetrable cryptographic lock."*

---

## ⏱️ 1:25 – 1:40 · THE AUTONOMOUS AI AGENT (CardioScan-AI)

> **[ON-SCREEN ACTION]**:  
> Click the **🤖 CardioScan-AI** tab.  
> Click **`🤖 Run Autonomous Inference (Volatile RAM)`** on the Angiogram: 20/20 nodes light up, and the neural biomarker dashboard appears (*85.4% LAD Stenosis, FFR 0.72, CAC 412, 99.2% Confidence*).  
> Close modal, then click **`🤖 Attempt Lateral Crawl / Model Ingestion`** on the Psychiatric Evaluation: 0/20 nodes drop, showing the quarantine refusal modal.

**VOICEOVER / NARRATION:**
> *"Next: the AI challenge.*  
> *Sarah grants CardioScan-AI an ephemeral 1-hour window.  
> It computes real-time stenosis and ischemia biomarkers strictly in **volatile RAM** under a strict **Non-Ingestion Guarantee**.*  
>  
> *When the AI attempts a lateral crawl to ingest Sarah's psychiatric data for training — **0 of 20 nodes approve**.*  
> *The AI agent is mathematically quarantined."*

---

## ⏱️ 1:40 – 1:50 · THE ROGUE DATABASE ADMINISTRATOR

> **[ON-SCREEN ACTION]**:  
> Click the pulsing red **🚨 Rogue Admin & Subpoena Simulator** tab.  
> Click **"Refresh Dump"** — show raw AES-256-GCM ciphertext on disk.  
> Click **`Trigger Server-Side Admin Override (POST /api/rogue-admin/override)`**.  
> Show the instant red cryptographic failure response: `TIDE-INVARIANT-I09-BREACH-BLOCKED`.

**VOICEOVER / NARRATION:**
> *"Even a rogue database administrator with full root privileges sees only ciphertext.*  
> *Triggering an administrative override fails cryptographically in-process.*  
> *Without patient policy, root access cannot reconstitute a single byte."*

---

## ⏱️ 1:50 – 2:00 · ZERO-DELAY REVOCATION & CONCLUSION

> **[ON-SCREEN ACTION]**:  
> Switch back to **👤 Sarah Connor**.  
> Click the red **"Revoke Access"** button next to the active grant. Confirm prompt.  
> The badge turns red: **`REVOKED`**. Hit **`F5`** (reload page) — show that the revocation permanently persists to disk.  
> Slowly zoom out or pan over the completed interface.

**VOICEOVER / NARRATION:**
> *"Sarah revokes the grant. Instantly, all subsequent decryptions are refused across the network and persist across reloads.*  
>  
> ***Care Passport** — where patient consent is enforceable mathematics.*  
> *Built for UNLOCKED: RMIT Hackathon 2026 with TideCloak Emergent Authority."*

---

## 📊 Fast Recording Cue Sheet

| Time | Duration | Screen Action | Primary Visual Proof |
|:---|:---:|:---|:---|
| **0:00** | 20s | Hover over 3 encrypted cards on Patient tab | AES-256-GCM & Zero Master Keys badges |
| **0:20** | 20s | Move through 5 persona switcher tabs | All 5 roles visible & configured |
| **0:40** | 25s | Open delegation modal, sign grant for Dr. Chen | Dynamic `RelationshipAttestation:1` registration |
| **1:05** | 20s | Dr. Chen decrypts angiogram, attempts psych | **20/20 ORK Quorum** vs **0/20 Refusal** |
| **1:25** | 15s | AI runs volatile inference, attempts lateral crawl | Neural AI biomarker dashboard & AI quarantine |
| **1:40** | 10s | Rogue Admin dump & superuser override attempt | `TIDE-INVARIANT-I09-BREACH-BLOCKED` (HTTP 403) |
| **1:50** | 10s | Sarah clicks Revoke; refresh page (F5) | Zero-delay persistent revocation & clean close |

---

## 🎙️ Pro Presenter Tips
1. **Pacing**: Aim for an even, articulate cadence of ~130 words per minute.
2. **Audio Levels**: Ensure mic audio is crisp; no background music or keep ambient audio under -20dB.
3. **Resolution**: Record at standard 1080p (1920x1080) at 60fps with browser zoom at 100% or 110%.
4. **Mouse Dynamics**: Move smoothly and intentionally. Avoid rapid jittering when explaining concepts.
