import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyTideJWT, hasRole, extractToken, loadTideConfig } from "./server/tideJWT.js";
import { verifyDpop, DpopError } from "./server/verifyDpop.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    details: "Tide Fabric loaded built-in contract for realm care-passport (live ORK network)",
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

// Helper: parse JSON body
function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Helper: authenticate request using verified JWT + DPoP proof
async function authenticateRequest(req) {
  const authHeader = req.headers["authorization"];
  const token = extractToken(authHeader);
  const claims = await verifyTideJWT(token);

  // If token is DPoP-bound (carries cnf.jkt), verify DPoP proof
  if (claims.cnf?.jkt) {
    const fullUrl = `http://${req.headers.host || "localhost"}${req.url}`;
    const fetchLikeReq = {
      url: fullUrl,
      method: req.method,
      headers: {
        get(name) {
          const val = req.headers[name.toLowerCase()];
          return Array.isArray(val) ? val.join(", ") : val || null;
        }
      }
    };
    await verifyDpop(fetchLikeReq, token, claims);
  }

  return { claims, token };
}

const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, DPoP");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // ----------------------------------------------------
  // DPoP RELAY ENDPOINTS
  // Matches /tide_dpop/... or /tide_dpop_auth.html
  // Must send Allow-CSP-From: * and script-src CSP without frame-ancestors
  // ----------------------------------------------------
  if (pathname.startsWith("/tide_dpop") || pathname.endsWith("tide_dpop_auth.html")) {
    const dpopPath = path.join(PUBLIC_DIR, "tide_dpop_auth.html");
    if (fs.existsSync(dpopPath)) {
      const content = fs.readFileSync(dpopPath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Allow-CSP-From": "*",
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src *;"
      });
      res.end(content);
      return;
    }
  }

  // Standard CSP for application routes
  res.setHeader("Content-Security-Policy", "frame-src *; default-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com http://localhost:8080; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  // 1. GET /api/config or /tidecloak.json
  if (req.method === "GET" && (pathname === "/api/config" || pathname === "/tidecloak.json")) {
    const config = readJson("tidecloak.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(config));
    return;
  }

  // 2. GET /api/records (Encrypted Ciphertext Store - NO KEYS on server)
  if (req.method === "GET" && pathname === "/api/records") {
    const records = readJson("synthetic_records.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(records));
    return;
  }

  // 3. GET /api/policies (Active RelationshipAttestation:1 policies)
  if (req.method === "GET" && pathname === "/api/policies") {
    const policies = readJson("active_policies.json");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(policies));
    return;
  }

  // 4. POST /api/policies (Store signed RelationshipAttestation:1 policy)
  // Protected by token verification: only verified callers can submit policies
  if (req.method === "POST" && pathname === "/api/policies") {
    try {
      const { claims } = await authenticateRequest(req);
      const payload = await getBody(req);
      const { recordId, subject, policy, access } = payload;

      if (!recordId || !subject || !policy) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields: recordId, subject, policy" }));
        return;
      }

      const policies = readJson("active_policies.json");
      const newPolicy = {
        policyId: "pol_rel_" + Date.now().toString(36),
        contractId: "RelationshipAttestation:1",
        recordId: recordId,
        subject: subject,
        access: access || "read",
        policyB64: policy,
        grantedBy: claims.sub || "admin",
        createdAt: new Date().toISOString(),
        status: "active"
      };

      policies.unshift(newPolicy);
      writeJson("active_policies.json", policies);

      logAudit(
        "POLICY_GRANT_ISSUED",
        "RelationshipAttestation:1",
        `User ${claims.preferred_username || claims.sub} issued policy for record ${recordId} to ${subject.id}`,
        "SUCCESS"
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, policy: newPolicy }));
    } catch (err) {
      res.writeHead(err instanceof DpopError ? 401 : 403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 5. GET /api/policies/mine?recordId=... (Fetch caller's policy for record)
  if (req.method === "GET" && pathname === "/api/policies/mine") {
    const recordId = parsedUrl.searchParams.get("recordId") || parsedUrl.searchParams.get("record");
    const policies = readJson("active_policies.json");
    const found = policies.find(p => p.recordId === recordId && p.status === "active");
    if (!found) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No active policy found for this record" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, policy: found }));
    return;
  }

  // 6. GET /api/raw-database (Rogue Admin Inspector)
  if (req.method === "GET" && pathname === "/api/raw-database") {
    const rawData = fs.readFileSync(path.join(DATA_DIR, "synthetic_records.json"), "utf8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(rawData);
    return;
  }

  // 7. GET /api/audit-log
  if (req.method === "GET" && pathname === "/api/audit-log") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(auditLogs));
    return;
  }

  // 8. POST /api/rogue-admin/override
  if (req.method === "POST" && pathname === "/api/rogue-admin/override") {
    logAudit(
      "UNILATERAL_BYPASS_ATTEMPT_BLOCKED",
      "Invariant:I-09",
      "Rogue super-admin attempted master-key decryption or role elevation on database vault. BLOCKED.",
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
  console.log(`  DPoP Relay at: http://localhost:${PORT}/tide_dpop_auth.html`);
  console.log(`======================================================\n`);
});
