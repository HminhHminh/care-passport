const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 8088;
const HOST = "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");

// In-memory audit log
const auditLogs = [
  {
    id: "log_" + Date.now(),
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event: "FABRIC_CONTRACT_INITIALIZED",
    contract: "RelationshipAttestation:1",
    details: "Tide Fabric loaded built-in contract for realm care-passport",
    status: "SUCCESS"
  }
];

function logAudit(event, contract, details, status) {
  const entry = {
    id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    event,
    contract,
    details,
    status
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 50) auditLogs.pop();
  return entry;
}

// Read JSON files safely
function readJson(filename) {
  try {
    const p = path.join(DATA_DIR, filename);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    console.error("Error reading " + filename, err);
    return [];
  }
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf8");
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  // CORS & Security Headers
  // Invariant I-06: frame-src * required for Tide enclave & DPoP relay
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, DPoP");
  res.setHeader("Content-Security-Policy", "frame-src *; default-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  // 1. GET /api/config
  if (req.method === "GET" && pathname === "/api/config") {
    const config = readJson("tidecloak.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(config));
    return;
  }

  // 2. GET /api/records (Encrypted Ciphertext Store)
  if (req.method === "GET" && pathname === "/api/records") {
    const records = readJson("synthetic_records.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(records));
    return;
  }

  // 3. GET /api/policies
  if (req.method === "GET" && pathname === "/api/policies") {
    const policies = readJson("active_policies.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(policies));
    return;
  }

  // 4. GET /api/raw-database (Rogue Admin Inspector)
  if (req.method === "GET" && pathname === "/api/raw-database") {
    const rawData = fs.readFileSync(path.join(DATA_DIR, "synthetic_records.json"), "utf8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(rawData);
    return;
  }

  // 5. GET /api/audit-log
  if (req.method === "GET" && pathname === "/api/audit-log") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(auditLogs));
    return;
  }

  // 6. POST /api/policies/grant
  if (req.method === "POST" && pathname === "/api/policies/grant") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { recordId, subjectId, subjectName, subjectRole, durationHours } = payload;

        if (!recordId || !subjectId || !subjectRole) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing required fields: recordId, subjectId, subjectRole" }));
          return;
        }

        const policies = readJson("active_policies.json");
        const hours = durationHours || 72;
        const newPolicy = {
          policyId: "pol_rel_" + Date.now().toString(36),
          contractId: "RelationshipAttestation:1",
          modelIds: ["PolicyEnabledEncryption:1", "PolicyEnabledDecryption:1"],
          executionType: "PRIVATE",
          approvalType: "IMPLICIT",
          recordId: recordId,
          subjectType: "User",
          subjectId: subjectId,
          subjectName: subjectName || subjectId,
          subjectRole: subjectRole,
          roles: ["_tide_decryptor"],
          status: "active",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
          signature: "vvk_sig_" + crypto.randomBytes(32).toString("hex")
        };

        policies.unshift(newPolicy);
        writeJson("active_policies.json", policies);

        logAudit(
          "POLICY_GRANT_ISSUED",
          "RelationshipAttestation:1",
          `Patient issued grant ${newPolicy.policyId} for ${recordId} to ${newPolicy.subjectName} (role: ${subjectRole})`,
          "SUCCESS"
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, policy: newPolicy }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 7. POST /api/policies/revoke
  if (req.method === "POST" && pathname === "/api/policies/revoke") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { policyId } = payload;
        const policies = readJson("active_policies.json");
        const policy = policies.find(p => p.policyId === policyId);

        if (!policy) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Policy not found" }));
          return;
        }

        policy.status = "revoked";
        policy.revokedAt = new Date().toISOString();
        writeJson("active_policies.json", policies);

        logAudit(
          "POLICY_GRANT_REVOKED",
          "RelationshipAttestation:1",
          `Patient explicitly revoked grant ${policyId} for ${policy.recordId} from ${policy.subjectName}`,
          "REVOKED"
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, policy }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 8. POST /api/decrypt (Simulated Tide Fabric ORK Consensus Check)
  if (req.method === "POST" && pathname === "/api/decrypt") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { recordId, callerRole, callerId, callerName } = JSON.parse(body);

        const records = readJson("synthetic_records.json");
        const record = records.find(r => r.id === recordId);
        if (!record) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Record not found" }));
          return;
        }

        // Check RelationshipAttestation:1 policies
        const policies = readJson("active_policies.json");
        const activePolicy = policies.find(p =>
          p.recordId === recordId &&
          p.status === "active" &&
          (p.subjectId === callerId || p.subjectRole === callerRole) &&
          new Date(p.expiresAt) > new Date()
        );

        if (!activePolicy) {
          logAudit(
            "FABRIC_DECRYPTION_REFUSED",
            "RelationshipAttestation:1",
            `Refused decryption request from ${callerName || callerRole} for ${recordId}. No active patient grant exists.`,
            "DENIED"
          );

          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: "TIDE-TIDEJS-NET-THRESHOLD_FAILURE",
            code: 403,
            contract: "RelationshipAttestation:1",
            reason: `Access refused by Tide Fabric: Caller (${callerName || callerRole}) has no valid, unexpired grant from Patient for record ${recordId}.`,
            consensus: {
              orkTotal: 20,
              orkApproved: 0,
              orkRejected: 20,
              thresholdRequired: 14,
              consensusAchieved: false
            }
          }));
          return;
        }

        // Decrypt the record using the simulated VVK key for this assignmentId
        const orkKeys = readJson("ork_keys.json");
        const hexKey = orkKeys[recordId];
        if (!hexKey) {
          throw new Error("Key not registered for assignmentId");
        }

        const key = Buffer.from(hexKey, "hex");
        const iv = Buffer.from(record.iv, "base64");
        const authTag = Buffer.from(record.authTag, "base64");
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAAD(Buffer.from(record.tag, "utf8")); // Tide Tag check
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(record.ciphertext, "base64", "utf8");
        decrypted += decipher.final("utf8");

        const decryptedPayload = JSON.parse(decrypted);

        logAudit(
          "FABRIC_DECRYPTION_AUTHORIZED",
          "RelationshipAttestation:1",
          `Tide Fabric 14/20 consensus reached for ${callerName} on record ${recordId}. Emergent keys released.`,
          "SUCCESS"
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          recordId: record.id,
          title: record.title,
          category: record.category,
          date: record.date,
          facility: record.facility,
          patientName: record.patientName,
          attendingPhysician: record.attendingPhysician,
          policyUsed: activePolicy.policyId,
          consensus: {
            orkTotal: 20,
            orkApproved: 20,
            thresholdRequired: 14,
            consensusAchieved: true
          },
          clinicalData: decryptedPayload
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Decryption failed: " + err.message }));
      }
    });
    return;
  }

  // 9. POST /api/rogue-admin/override
  if (req.method === "POST" && pathname === "/api/rogue-admin/override") {
    logAudit(
      "UNILATERAL_BYPASS_ATTEMPT_BLOCKED",
      "Invariant:I-09",
      "Cloud super-admin attempted master-key decryption or role elevation on database vault. BLOCKED.",
      "DENIED"
    );

    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "TIDE-INVARIANT-I09-BREACH-BLOCKED",
      message: "Mathematical Impossibility: Server root access does NOT grant decryption authority.",
      explanation: "In TideCloak's Emergent Authority model, master decryption keys do not exist in whole form on this server, in database storage, or in memory. Decryption requires threshold consensus across independent Tide ORK nodes, which strictly enforce patient consent via RelationshipAttestation:1. Unilateral administrative override is structurally impossible."
    }));
    return;
  }

  // ----------------------------------------------------
  // STATIC ASSETS
  // ----------------------------------------------------
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`  CARE PASSPORT — TIDECLOAK EMERGENT AUTHORITY PROTOTYPE`);
  console.log(`  Live at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
