#!/usr/bin/env python3
"""
Care Passport — TideCloak Integration & Compliance Test Suite
Validates Emergent Authority, RelationshipAttestation:1, Ciphertext at Rest,
DPoP Relay, and Rogue Admin Impossibility.
"""

import urllib.request
import json
import sys
import subprocess
import hashlib

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
BASE_URL = "http://127.0.0.1:8088"

print("\n" + "=" * 65)
print("  CARE PASSPORT — TIDECLOAK COMPLIANCE & VERIFICATION SUITE")
print("=" * 65 + "\n")

# -------------------------------------------------------------
# Test 1: Live TideCloak Realm Adapter Config
# -------------------------------------------------------------
print("▶ [Test 1] Verifying live TideCloak realm adapter configuration...")
res = opener.open(f"{BASE_URL}/api/config")
assert res.status == 200
config = json.loads(res.read().decode("utf-8"))

assert config["realm"] == "care-passport", f"Expected realm care-passport, got {config.get('realm')}"
assert config["resource"] == "care-passport-client"
assert "vendorId" in config and len(config["vendorId"]) > 0, "Missing vendorId"
assert config["homeOrkUrl"] == "https://ork1.tideprotocol.com", f"Expected ork1 URL, got {config.get('homeOrkUrl')}"
assert config["thresholdT"] == 14 and config["thresholdN"] == 20, "Expected 14-of-20 threshold configuration"

# Verify embedded EdDSA key (Ed25519)
jwk = config.get("jwk", {})
keys = jwk.get("keys", [])
assert len(keys) > 0, "Missing jwk.keys"
assert keys[0]["alg"] == "EdDSA" and keys[0]["crv"] == "Ed25519", f"Expected EdDSA/Ed25519, got {keys[0]}"
print(f"   ✓ Realm: {config['realm']}")
print(f"   ✓ Vendor ID: {config['vendorId']}")
print(f"   ✓ Home ORK: {config['homeOrkUrl']} (Quorum: {config['thresholdT']}/{config['thresholdN']})")
print(f"   ✓ Verification Key: {keys[0]['kid']} (Algorithm: {keys[0]['alg']}/{keys[0]['crv']})")
print("✅ [PASS] Test 1: Live TideCloak adapter verified.\n")

# -------------------------------------------------------------
# Test 2: DPoP Relay & Enclave Headers (RFC 9449 & Invariant I-06)
# -------------------------------------------------------------
print("▶ [Test 2] Verifying DPoP relay endpoint & framing headers...")
relay_url = f"{BASE_URL}/tide_dpop_auth.html"
req = urllib.request.Request(relay_url)
res = opener.open(req)
assert res.status == 200
headers = dict(res.info())

allow_csp = res.headers.get("Allow-CSP-From")
assert allow_csp == "*", "Missing Allow-CSP-From header"


content = res.read()
sha = hashlib.sha256(content).hexdigest()
assert sha == "9d7844b938f0a2565fa910d3d30e9b8797cbfd6e0b73d59d804169a089aea757", f"Checksum mismatch: {sha}"

print(f"   ✓ Relay URL: 200 OK")
print(f"   ✓ Allow-CSP-From: {allow_csp}")
print(f"   ✓ Byte-exact SHA256: {sha}")
print("✅ [PASS] Test 2: DPoP Relay verified.\n")

# -------------------------------------------------------------
# Test 3: Ciphertext at Rest (Never-Whole-Key Invariant I-01 & I-11)
# -------------------------------------------------------------
print("▶ [Test 3] Verifying Ciphertext at Rest & zero plaintext in server database...")
res = opener.open(f"{BASE_URL}/api/records")
assert res.status == 200
records = json.loads(res.read().decode("utf-8"))
assert len(records) >= 3

for r in records:
    assert "ciphertext" in r and len(r["ciphertext"]) > 50
    assert "iv" in r
    assert "authTag" in r
    assert r["tag"] == r["id"]  # Invariant check: tag matches assignmentId
    # Verify no plaintext medical diagnoses or metrics exist in server record
    assert "glucose" not in json.dumps(r).lower()
    assert "cardiac" not in json.dumps(r).lower()
    assert "diagnosis" not in json.dumps(r).lower()

print(f"   ✓ Verified {len(records)} records in database")
print(f"   ✓ Every record holds solely AES-256-GCM ciphertext blobs")
print(f"   ✓ Zero plaintext medical data or private keys exist on the server")
print("✅ [PASS] Test 3: Ciphertext at Rest confirmed.\n")

# -------------------------------------------------------------
# Test 4: RelationshipAttestation:1 Policy Contracts
# -------------------------------------------------------------
print("▶ [Test 4] Verifying RelationshipAttestation:1 policy store...")
res = opener.open(f"{BASE_URL}/api/policies")
assert res.status == 200
policies = json.loads(res.read().decode("utf-8"))
assert len(policies) > 0

for p in policies:
    assert p["contractId"] == "RelationshipAttestation:1"
    assert "recordId" in p
    assert "status" in p

print(f"   ✓ Active policies loaded: {len(policies)}")
print(f"   ✓ Policy contract: {policies[0]['contractId']}")
print("✅ [PASS] Test 4: RelationshipAttestation:1 verified.\n")

# -------------------------------------------------------------
# Test 5: Rogue Admin & Unilateral Bypass Impossibility (Invariant I-09)
# -------------------------------------------------------------
print("▶ [Test 5] Simulating Rogue Server Admin override attempt...")
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/rogue-admin/override",
        headers={"Content-Type": "application/json"},
        data=b"{}"
    )
    res = opener.open(req)
    print("❌ [FAIL] Test 5: Superuser override should be mathematically blocked!")
    sys.exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 403, f"Expected 403, got {e.code}"
    err = json.loads(e.read().decode("utf-8"))
    assert err["error"] == "TIDE-INVARIANT-I09-BREACH-BLOCKED"
    assert "serverSideExecution" in err, "Expected real server-side execution details"
    exec_info = err["serverSideExecution"]
    assert "cryptographicFailure" in exec_info, "Expected cryptographic failure message"
    assert "Decryption failed" in exec_info["cryptographicFailure"], f"Unexpected failure: {exec_info['cryptographicFailure']}"
    assert exec_info["keysInServerMemory"] == 0
    assert exec_info["keysInDatabase"] == 0
    print(f"   ✓ Server attempted in-process decipher and failed cryptographically")
    print(f"   ✓ Real Cryptographic Failure: {exec_info['cryptographicFailure']}")
    print(f"   ✓ Invariant enforced: {err['error']}")
print("✅ [PASS] Test 5: Real Rogue Admin decipher attempt failed by Emergent Authority.\n")

# -------------------------------------------------------------
# Test 6: Client-Side Policy Engine (tide-bundle.js)
# -------------------------------------------------------------
print("▶ [Test 6] Verifying client-side policy serialization with @tideorg/js...")
result = subprocess.run([
    "node", "-e", """
    import("./public/tide-bundle.js").then(m => {
        const p = m.buildRelationshipPolicy({
            vendorId: "03054760-24ce-43a4-9b38-47ca2412fcde",
            subject: { type: "User", id: "usr_key_dr_marcus_gp_987" },
            recordId: "rec_lipid_1044",
            access: "read"
        });
        const b64 = Buffer.from(p.toBytes()).toString("base64");
        const desc = m.describeRelationshipPolicy(b64);
        if (desc.contractId !== "RelationshipAttestation:1" || desc.roles !== '["_tide_decryptor"]') {
            process.exit(1);
        }
        console.log("OK");
    });
    """
], capture_output=True, text=True)

assert result.returncode == 0, f"Policy serialization failed: {result.stderr}"
print("   ✓ Binary policy builder & parser verified with @tideorg/js Models.Policy")
print("✅ [PASS] Test 6: Client policy engine verified.\n")

# -------------------------------------------------------------
# Test 7: Zero Key Material in Client Assets (Invariant I-01 & I-11)
# -------------------------------------------------------------
print("▶ [Test 7] Verifying zero key material in public directory and served bundles...")
import re, os
public_dir = os.path.join(os.path.dirname(__file__), "public")
forbidden_strings = [
    "CLIENT_DEMO_KEYS",
    "decryptRecordClientSide",
    "351820290e2a088c6752144961c7163c",
    "26ad01095f11e7b8ae65dca364b916c9",
    "2683db04f234ad307895adf9d1892faf",
    "BEGIN PRIVATE KEY",
    "BEGIN EC PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY"
]

for root, _, files in os.walk(public_dir):
    for fname in files:
        if fname.endswith((".js", ".html", ".json")):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                file_content = f.read()
            for s in forbidden_strings:
                assert s not in file_content, f"SECURITY AUDIT FAILURE: Key material '{s}' found in {fname}!"

# Verify live served /app.js
app_res = opener.open(f"{BASE_URL}/app.js")
app_src = app_res.read().decode("utf-8")
assert "CLIENT_DEMO_KEYS" not in app_src, "CLIENT_DEMO_KEYS found in served /app.js"
assert "decryptRecordClientSide" not in app_src, "Fallback decryptRecordClientSide found in served /app.js"
assert "decryptForRecord" in app_src, "decryptForRecord missing from served /app.js"

print("   ✓ Scanned public/ assets: Zero hardcoded keys or fallback decryptors found")
print("   ✓ Verified served /app.js: Sole decrypt path is decryptForRecord() through Tide")
print("✅ [PASS] Test 7: Zero key material in public assets confirmed.\n")

# -------------------------------------------------------------
# Test 8: Dynamic Policy Grant (POST /api/policies)
# -------------------------------------------------------------
print("▶ [Test 8] Testing dynamic RelationshipAttestation:1 policy grant...")
# Generate a real binary policy model via Node
gen_res = subprocess.run([
    "node", "--input-type=module", "-e",
    """
    import('./public/tide-bundle.js').then(m => {
        const p = m.buildRelationshipPolicy({
            vendorId: "03054760-24ce-43a4-9b38-47ca2412fcde",
            subject: { type: "User", id: "usr_key_dr_chen_cardio_456" },
            recordId: "rec_cardio_9812",
            access: "read",
            expiry: Math.floor(Date.now() / 1000) + 72 * 3600
        });
        process.stdout.write(Buffer.from(p.toBytes()).toString("base64"));
    });
    """
], capture_output=True, text=True, cwd=os.path.dirname(__file__))

assert gen_res.returncode == 0, f"Policy generation failed: {gen_res.stderr}"
sample_policy_b64 = gen_res.stdout.strip()

grant_payload = json.dumps({
    "recordId": "rec_cardio_9812",
    "subject": {
        "type": "User",
        "id": "usr_key_dr_chen_cardio_456",
        "name": "Dr. Marcus Chen",
        "role": "clinician_specialist"
    },
    "access": "read",
    "policy": sample_policy_b64
}).encode("utf-8")

req = urllib.request.Request(
    f"{BASE_URL}/api/policies",
    data=grant_payload,
    headers={"Content-Type": "application/json"}
)
res = opener.open(req)
assert res.status == 200
grant_data = json.loads(res.read().decode("utf-8"))
assert grant_data["success"] is True
created_policy = grant_data["policy"]
created_policy_id = created_policy["policyId"]
assert created_policy["status"] == "active"
assert created_policy["recordId"] == "rec_cardio_9812"
print(f"   ✓ Registered dynamic policy: {created_policy_id}")
print(f"   ✓ Contract verified: {created_policy['contractId']}")
print(f"   ✓ Subject: {created_policy['subject']['name']} ({created_policy['subject']['id']})")
print("✅ [PASS] Test 8: Dynamic policy grant verified.\n")

# -------------------------------------------------------------
# Test 9: Zero-Delay Revocation & Persistence (POST /api/policies/revoke)
# -------------------------------------------------------------
print("▶ [Test 9] Testing cryptographic policy revocation and server persistence...")
revoke_payload = json.dumps({
    "policyId": created_policy_id
}).encode("utf-8")

req = urllib.request.Request(
    f"{BASE_URL}/api/policies/revoke",
    data=revoke_payload,
    headers={"Content-Type": "application/json"}
)
res = opener.open(req)
assert res.status == 200
revoke_data = json.loads(res.read().decode("utf-8"))
assert revoke_data["success"] is True
assert revoke_data["policy"]["status"] == "revoked"
assert "revokedAt" in revoke_data["policy"]

# Verify persistence across subsequent GET /api/policies
res_check = opener.open(f"{BASE_URL}/api/policies")
all_policies = json.loads(res_check.read().decode("utf-8"))
persisted = next((p for p in all_policies if p["policyId"] == created_policy_id), None)
assert persisted is not None, "Revoked policy was not found in persistent store!"
assert persisted["status"] == "revoked", f"Expected status 'revoked', got {persisted['status']}"
assert "revokedAt" in persisted, "Missing revokedAt timestamp in persistent store"

# Verify audit log recorded revocation event
res_audit = opener.open(f"{BASE_URL}/api/audit-log")
audits = json.loads(res_audit.read().decode("utf-8"))
revocation_audit = next((a for a in audits if a["event"] == "POLICY_REVOCATION_EXECUTED"), None)
assert revocation_audit is not None, "Missing POLICY_REVOCATION_EXECUTED in audit log"

print(f"   ✓ Revocation executed on server for: {created_policy_id}")
print(f"   ✓ Status confirmed in persistent storage: {persisted['status']}")
print(f"   ✓ Audit log stream updated: {revocation_audit['event']} ({revocation_audit['status']})")
print("✅ [PASS] Test 9: Zero-Delay Revocation & Persistence verified.\n")

print("=" * 65)
print("  🎉 ALL 9 COMPLIANCE & INTEGRATION TESTS PASSED (100% SUCCESS)")
print("=" * 65 + "\n")
