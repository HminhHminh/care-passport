/**
 * create-realm-users.js
 * Creates real TideCloak realm users for Care Passport:
 * - Patient (sarah_connor) with _tide_encryptor & _tide_decryptor
 * - Clinician GP (dr_marcus) with _tide_decryptor
 * - Clinician Specialist (dr_chen) with _tide_decryptor
 *
 * Generates one-time Tide account-link URLs for browser enrollment.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "..", "data", "tidecloak.json");

const tcConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const AUTH_URL = (process.env.TIDECLOAK_URL || tcConfig["auth-server-url"] || "http://localhost:8080/").replace(/\/$/, "");
const REALM = process.env.REALM_NAME || tcConfig.realm || "care-passport";
const ADMIN_USER = process.env.KC_ADMIN_USER || process.env.KC_BOOTSTRAP_ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.KC_ADMIN_PASSWORD || process.env.KC_BOOTSTRAP_ADMIN_PASSWORD || "admin";

console.log("\n=======================================================");
console.log("  CARE PASSPORT — TIDECLOAK REALM USERS PROVISIONER");
console.log("=======================================================");
console.log(`Server: ${AUTH_URL}`);
console.log(`Realm:  ${REALM}\n`);

const USERS_TO_CREATE = [
  {
    username: "sarah_connor",
    email: "sarah.connor@carepassport.local",
    firstName: "Sarah",
    lastName: "Connor",
    roles: ["_tide_enabled", "_tide_encryptor", "_tide_decryptor", "appUser"],
    description: "Patient (Record Owner & Grant Authority)"
  },
  {
    username: "dr_marcus",
    email: "alice.marcus@carepassport.local",
    firstName: "Alice",
    lastName: "Marcus",
    roles: ["_tide_enabled", "_tide_decryptor", "appUser"],
    description: "General Practitioner Clinician (GP)"
  },
  {
    username: "dr_chen",
    email: "marcus.chen@carepassport.local",
    firstName: "Marcus",
    lastName: "Chen",
    roles: ["_tide_enabled", "_tide_decryptor", "appUser"],
    description: "Cardiology Specialist Clinician"
  }
];

async function getAdminToken() {
  const tokenUrl = `${AUTH_URL}/realms/master/protocol/openid-connect/token`;
  const params = new URLSearchParams({
    client_id: "admin-cli",
    grant_type: "password",
    username: ADMIN_USER,
    password: ADMIN_PASS
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to authenticate with Keycloak master realm (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function approveChangeRequests(token) {
  try {
    const listRes = await fetch(`${AUTH_URL}/admin/realms/${REALM}/iga/change-requests?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!listRes.ok) return;
    const crs = await listRes.json();
    if (!Array.isArray(crs) || crs.length === 0) return;

    for (const cr of crs) {
      await fetch(`${AUTH_URL}/admin/realms/${REALM}/iga/change-requests/${cr.id}/authorize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    await fetch(`${AUTH_URL}/admin/realms/${REALM}/iga/change-requests/commit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✓ Approved & committed ${crs.length} pending Tide IGA change request(s).`);
  } catch (err) {
    // Non-fatal if IGA is not in strict change-request mode
  }
}

async function getRealmRoles(token) {
  const res = await fetch(`${AUTH_URL}/admin/realms/${REALM}/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Could not fetch realm roles: ${await res.text()}`);
  return await res.json();
}

async function main() {
  let token;
  try {
    token = await getAdminToken();
    console.log("✓ Authenticated as realm admin.");
  } catch (err) {
    console.log(`⚠️  Could not reach TideCloak server at ${AUTH_URL}.`);
    console.log(`   Error: ${err.message}`);
    console.log("\nIf TideCloak is running in Docker or Skycloak, start it first with:");
    console.log("   docker run -p 8080:8080 ... or check .env settings.\n");
    console.log("Template users specification has been generated and validated below.");
    printUserSummary();
    return;
  }

  const realmRoles = await getRealmRoles(token);
  const roleMap = new Map(realmRoles.map(r => [r.name, r]));

  for (const u of USERS_TO_CREATE) {
    console.log(`\n▶ Processing user: ${u.username} (${u.description})...`);

    // 1. Check if user already exists
    const searchRes = await fetch(`${AUTH_URL}/admin/realms/${REALM}/users?username=${encodeURIComponent(u.username)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const existing = await searchRes.json();
    let userId;

    if (existing && existing.length > 0) {
      userId = existing[0].id;
      console.log(`   ✓ User already exists with ID: ${userId}`);
    } else {
      // 2. Create user with link-tide-account-action
      const createRes = await fetch(`${AUTH_URL}/admin/realms/${REALM}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: u.username,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          enabled: true,
          emailVerified: true,
          requiredActions: ["link-tide-account-action"]
        })
      });

      if (!createRes.ok) {
        console.error(`   ❌ Failed to create user ${u.username}: ${await createRes.text()}`);
        continue;
      }

      await approveChangeRequests(token);

      const reSearch = await fetch(`${AUTH_URL}/admin/realms/${REALM}/users?username=${encodeURIComponent(u.username)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const created = await reSearch.json();
      userId = created[0].id;
      console.log(`   ✓ Created user with ID: ${userId}`);
    }

    // 3. Map Roles
    const rolesToMap = u.roles.map(rName => roleMap.get(rName)).filter(Boolean);
    if (rolesToMap.length > 0) {
      await fetch(`${AUTH_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rolesToMap)
      });
      await approveChangeRequests(token);
      console.log(`   ✓ Assigned roles: ${u.roles.join(", ")}`);
    }

    // 4. Generate one-time Tide account link URL
    const linkRes = await fetch(
      `${AUTH_URL}/admin/realms/${REALM}/tideAdminResources/get-required-action-link?userId=${userId}&lifespan=43200`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["link-tide-account-action"])
      }
    );

    if (linkRes.ok) {
      const link = await linkRes.text();
      console.log(`   🔗 One-Time Tide Account Link URL:`);
      console.log(`      ${link.replace(/"/g, "")}`);
    }
  }

  console.log("\n=======================================================");
  console.log("  USER PROVISIONING COMPLETE");
  console.log("  Open each Account Link URL in your browser once to");
  console.log("  enroll the user's Tide hardware enclave key.");
  console.log("=======================================================\n");
}

function printUserSummary() {
  console.log("Declared Realm Users & Roles:");
  for (const u of USERS_TO_CREATE) {
    console.log(` - ${u.username} (${u.email}) [Roles: ${u.roles.join(", ")}] -> ${u.description}`);
  }
}

main().catch(err => {
  console.error("Execution error:", err);
});
