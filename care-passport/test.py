#!/usr/bin/env python3
import urllib.request, json, sys

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
BASE_URL = "http://127.0.0.1:8088"

print("\n" + "=" * 60)
print("  CARE PASSPORT — TIDECLOAK VERIFICATION TEST SUITE")
print("=" * 60)

# Test 1: Health records listing (Ciphertext at Rest)
res = opener.open(f"{BASE_URL}/api/records")
assert res.status == 200
records = json.loads(res.read().decode("utf-8"))
assert len(records) == 3
for r in records:
    assert "ciphertext" in r
    assert "iv" in r
    assert "authTag" in r
    assert r["tag"] == r["id"]  # Invariant check
print("✅ [PASS] Test 1: Ciphertext at Rest confirmed (3 encrypted records).")

# Test 2: Authorized Decryption
req = urllib.request.Request(
    f"{BASE_URL}/api/decrypt",
    headers={"Content-Type": "application/json"},
    data=json.dumps({
        "recordId": "rec_lipid_1044",
        "callerRole": "clinician_gp",
        "callerId": "usr_key_dr_marcus_gp_987",
        "callerName": "Dr. Alice Marcus"
    }).encode("utf-8")
)
res = opener.open(req)
assert res.status == 200
body = json.loads(res.read().decode("utf-8"))
assert body["success"] is True
assert body["clinicalData"]["metrics"][0]["name"] == "Fasting Blood Glucose"
print("✅ [PASS] Test 2: Authorized Decryption succeeded via RelationshipAttestation:1.")

# Test 3: Unauthorized Decryption Refusal
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/decrypt",
        headers={"Content-Type": "application/json"},
        data=json.dumps({
            "recordId": "rec_psych_4509",
            "callerRole": "clinician_gp",
            "callerId": "usr_key_dr_marcus_gp_987",
            "callerName": "Dr. Alice Marcus"
        }).encode("utf-8")
    )
    res = opener.open(req)
    print("❌ [FAIL] Test 3: Should have refused unauthorized request!")
    sys.exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 403
    err = json.loads(e.read().decode("utf-8"))
    assert err["error"] == "TIDE-TIDEJS-NET-THRESHOLD_FAILURE"
    print("✅ [PASS] Test 3: Unauthorized Decryption refused (0/20 ORK quorum).")

# Test 4: Rogue Admin Superuser Override Block
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/rogue-admin/override",
        headers={"Content-Type": "application/json"},
        data=b"{}"
    )
    res = opener.open(req)
    print("❌ [FAIL] Test 4: Superuser override should be blocked!")
    sys.exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 403
    err = json.loads(e.read().decode("utf-8"))
    assert err["error"] == "TIDE-INVARIANT-I09-BREACH-BLOCKED"
    print("✅ [PASS] Test 4: Rogue Admin bypass blocked by Never-Whole-Key invariant.")

# Test 5: Dynamic Grant and Revocation Lifecycle
# Grant
req = urllib.request.Request(
    f"{BASE_URL}/api/policies/grant",
    headers={"Content-Type": "application/json"},
    data=json.dumps({
        "recordId": "rec_psych_4509",
        "subjectId": "usr_key_dr_marcus_gp_987",
        "subjectName": "Dr. Alice Marcus",
        "subjectRole": "clinician_gp",
        "durationHours": 12
    }).encode("utf-8")
)
res = opener.open(req)
grant_body = json.loads(res.read().decode("utf-8"))
pol_id = grant_body["policy"]["policyId"]

# Verify Decrypt with new grant
req = urllib.request.Request(
    f"{BASE_URL}/api/decrypt",
    headers={"Content-Type": "application/json"},
    data=json.dumps({
        "recordId": "rec_psych_4509",
        "callerRole": "clinician_gp",
        "callerId": "usr_key_dr_marcus_gp_987",
        "callerName": "Dr. Alice Marcus"
    }).encode("utf-8")
)
res = opener.open(req)
assert res.status == 200

# Revoke
req = urllib.request.Request(
    f"{BASE_URL}/api/policies/revoke",
    headers={"Content-Type": "application/json"},
    data=json.dumps({"policyId": pol_id}).encode("utf-8")
)
res = opener.open(req)
assert res.status == 200

# Verify Decrypt fails after revocation
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/decrypt",
        headers={"Content-Type": "application/json"},
        data=json.dumps({
            "recordId": "rec_psych_4509",
            "callerRole": "clinician_gp",
            "callerId": "usr_key_dr_marcus_gp_987",
            "callerName": "Dr. Alice Marcus"
        }).encode("utf-8")
    )
    res = opener.open(req)
    print("❌ [FAIL] Test 5: Revoked grant should not allow decryption!")
    sys.exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 403
    print("✅ [PASS] Test 5: Dynamic Grant & Immediate Revocation verified.")

print("\n🎉 ALL 5 INTEGRATION TESTS PASSED (100% SUCCESS)\n")
