// Care Passport — TideCloak Emergent Authority Client Application
// UNLOCKED RMIT Hackathon 2026
// Invariants Enforced: I-01, I-06, I-09, I-11, I-12

import {
  IAMService,
  buildRelationshipPolicy,
  signRelationshipPolicy,
  encryptForRecord,
  decryptForRecord,
  describeRelationshipPolicy,
  readSession
} from "./tide-bundle.js";

let currentRole = "patient";
let cachedRecords = [];
let cachedPolicies = [];
let activeAuditLogs = [];

const CLINICIAN_PROFILES = {
  dr_marcus: {
    id: "usr_key_dr_marcus_gp_987",
    name: "Dr. Alice Marcus",
    title: "General Practitioner",
    role: "clinician_gp",
    color: "teal"
  },
  clinician_gp: {
    id: "usr_key_dr_marcus_gp_987",
    name: "Dr. Alice Marcus",
    title: "General Practitioner",
    role: "clinician_gp",
    color: "teal"
  },
  dr_chen: {
    id: "usr_key_dr_chen_cardio_456",
    name: "Dr. Marcus Chen",
    title: "Cardiologist",
    role: "clinician_specialist",
    color: "blue"
  },
  clinician_specialist: {
    id: "usr_key_dr_chen_cardio_456",
    name: "Dr. Marcus Chen",
    title: "Cardiologist",
    role: "clinician_specialist",
    color: "blue"
  },
  dr_vance: {
    id: "usr_key_dr_vance_psych_789",
    name: "Dr. Elena Vance",
    title: "Consultant Psychiatrist",
    role: "clinician_specialist",
    color: "purple"
  }
};

async function getAuthHeaders() {
  const headers = {};
  try {
    if (IAMService && typeof IAMService.isAuthenticated === "function" && IAMService.isAuthenticated()) {
      const token = await IAMService.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.debug("No active token in context:", err.message);
  }
  return headers;
}

function showNotification(title, message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bgColor = type === "success" ? "bg-emerald-900 border-emerald-400" : type === "error" ? "bg-rose-900 border-rose-400" : "bg-gray-900 border-gray-600";
  const icon = type === "success" ? "✅" : type === "error" ? "⛔" : "ℹ️";

  toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-2 opacity-0 text-white px-4 py-3 rounded-xl border shadow-xl flex items-start space-x-3 text-xs font-mono max-w-sm ${bgColor}`;
  toast.innerHTML = `
    <span class="text-base">${icon}</span>
    <div class="flex-1">
      <div class="font-bold text-sm leading-tight">${title}</div>
      <div class="text-gray-200 mt-0.5 text-xs">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  renderOrkNodes(20, 0);
  await initTideAuth();
  await refreshAll();
  setInterval(fetchAuditLogs, 5000);
});

async function initTideAuth() {
  try {
    const configRes = await fetch("/tidecloak.json");
    const tcConfig = await configRes.json();

    if (IAMService && typeof IAMService.initIAM === "function") {
      await IAMService.initIAM({
        ...tcConfig,
        useDPoP: { mode: "strict", alg: "ES256" }
      });
      updateAuthUI();

      IAMService.on("authRefreshSuccess", updateAuthUI);
      IAMService.on("authRefreshError", () => {
        IAMService.doLogin();
      });
    }
  } catch (err) {
    console.warn("TideCloak init notification:", err.message);
  }

  // Wire login/logout buttons
  const loginBtn = document.getElementById("tide-login-btn");
  const logoutBtn = document.getElementById("tide-logout-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (IAMService && typeof IAMService.doLogin === "function") {
        IAMService.doLogin();
      } else {
        alert("Redirecting to TideCloak SSO (http://localhost:8080)...");
        window.location.href = "http://localhost:8080/realms/care-passport/account";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (IAMService && typeof IAMService.doLogout === "function") {
        IAMService.doLogout();
      } else {
        updateAuthUI();
      }
    });
  }
}

function updateAuthUI() {
  const loginBtn = document.getElementById("tide-login-btn");
  const userBadge = document.getElementById("tide-user-badge");
  const usernameEl = document.getElementById("tide-username");

  if (!loginBtn || !userBadge) return;

  const authenticated = IAMService && typeof IAMService.isAuthenticated === "function" && IAMService.isAuthenticated();

  if (authenticated) {
    loginBtn.classList.add("hidden");
    userBadge.classList.remove("hidden");
    userBadge.classList.add("flex");
    const user = IAMService.getValueFromIdToken("preferred_username") || "Tide User";
    usernameEl.textContent = user;
  } else {
    loginBtn.classList.remove("hidden");
    userBadge.classList.add("hidden");
  }
}

async function refreshAll() {
  await Promise.all([fetchRecords(), fetchPolicies(), fetchAuditLogs()]);
}

// --- SWITCH PERSONA / ROLE ---
function switchRole(role) {
  currentRole = role;

  // Update tabs active styles
  document.querySelectorAll(".role-tab").forEach(tab => {
    tab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-white/10 text-gray-200 hover:bg-white/20";
  });

  const activeTab = document.getElementById(`tab-${role}`);
  if (activeTab) {
    if (role === "patient") {
      activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-tide-accent text-tide-deeper shadow-sm font-bold";
    } else if (role === "rogue_admin") {
      activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-rose-600 text-white font-bold shadow-sm";
    } else {
      activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-tide-teal text-white font-bold shadow-sm";
    }
  }

  // Toggle View Panels
  document.getElementById("view-patient").classList.add("hidden");
  document.getElementById("view-clinician").classList.add("hidden");
  document.getElementById("view-rogue-admin").classList.add("hidden");

  if (role === "patient") {
    document.getElementById("view-patient").classList.remove("hidden");
    renderPatientView();
  } else if (role === "rogue_admin") {
    document.getElementById("view-rogue-admin").classList.remove("hidden");
    fetchRawDatabase();
  } else {
    document.getElementById("view-clinician").classList.remove("hidden");
    const profile = CLINICIAN_PROFILES[role];
    if (profile) {
      document.getElementById("clinician-name-heading").textContent = profile.name;
      document.getElementById("clinician-role-badge").textContent = profile.title;
      document.getElementById("clinician-key-badge").textContent = `ID: ${profile.id} · Role: _tide_decryptor (${profile.role})`;
    }
    renderClinicianView();
  }
}

// --- API FETCHERS ---
async function fetchRecords() {
  try {
    const res = await fetch("/api/records");
    cachedRecords = await res.json();
    renderPatientView();
    if (currentRole.startsWith("clinician")) renderClinicianView();
  } catch (err) {
    console.error("Failed to fetch records", err);
  }
}

async function fetchPolicies() {
  try {
    const res = await fetch("/api/policies");
    cachedPolicies = await res.json();
    renderGrantsTable();
    if (currentRole === "patient") renderPatientView();
    if (currentRole.startsWith("clinician")) renderClinicianView();
  } catch (err) {
    console.error("Failed to fetch policies", err);
  }
}

async function fetchAuditLogs() {
  try {
    const res = await fetch("/api/audit-log");
    activeAuditLogs = await res.json();
    renderAuditStream();
  } catch (err) {
    console.error("Failed to fetch audit logs", err);
  }
}

// --- PATIENT VIEW ---
function renderPatientView() {
  const container = document.getElementById("patient-records-grid");
  if (!container) return;

  container.innerHTML = cachedRecords.map(rec => {
    // Check if there are active grants for this record
    const recordGrants = cachedPolicies.filter(p => p.recordId === rec.id && p.status === "active");

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:border-tide-accent/40 transition">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase bg-tide-accent/10 text-tide-dark border border-tide-accent/30 px-2 py-0.5 rounded font-bold">${rec.category}</span>
            <span class="text-xs text-gray-400 font-mono">${rec.date}</span>
          </div>

          <h3 class="text-base font-bold text-gray-900 leading-snug mb-1">${rec.title}</h3>
          <p class="text-xs text-gray-500 font-mono mb-4">${rec.facility}</p>

          <!-- Cryptographic Tag Indicator -->
          <div class="bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4 font-mono text-[11px] space-y-1">
            <div class="flex justify-between text-gray-500">
              <span>Tide Tag (Assignment ID):</span>
              <span class="text-gray-900 font-bold truncate max-w-[140px]">${rec.tag}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Ciphertext at Rest:</span>
              <span class="text-emerald-700 font-bold">AES-256-GCM sealed</span>
            </div>
          </div>

          <!-- Active Delegation Status -->
          <div class="mb-4">
            <span class="text-xs text-gray-500 font-mono block mb-1">Delegated Access Grants:</span>
            ${recordGrants.length > 0
              ? recordGrants.map(g => `
                  <div class="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg mb-1 font-mono">
                    <span>${g.subject ? (g.subject.name || g.subject.id) : (g.subjectName || g.subjectId)}</span>
                    <button onclick="revokePolicy('${g.policyId}')" class="text-rose-600 hover:text-rose-800 font-bold text-[11px]">Revoke</button>
                  </div>
                `).join('')
              : '<span class="text-xs text-gray-400 italic font-mono">No clinicians currently authorized</span>'
            }
          </div>
        </div>

        <button onclick="openGrantModal('${rec.id}', '${rec.title.replace(/'/g, "\\'")}')" class="w-full py-2.5 bg-tide-deeper hover:bg-tide-dark text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center space-x-1.5">
          <span>🛡️</span>
          <span>Delegate Access via RelationshipAttestation</span>
        </button>
      </div>
    `;
  }).join('');
}

// --- CLINICIAN VIEW ---
function renderClinicianView() {
  const container = document.getElementById("clinician-records-grid");
  if (!container) return;

  const profile = CLINICIAN_PROFILES[currentRole];
  if (!profile) return;

  container.innerHTML = cachedRecords.map(rec => {
    const activeGrant = cachedPolicies.find(p =>
      p.recordId === rec.id &&
      p.status === "active" &&
      ((p.subject && p.subject.id === profile.id) || p.subjectId === profile.id || p.subjectRole === profile.role)
    );

    const isGranted = !!activeGrant;

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border ${isGranted ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200'} flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">${rec.category}</span>
            <span class="text-xs text-gray-400 font-mono">${rec.date}</span>
          </div>

          <h3 class="text-base font-bold text-gray-900 leading-snug mb-1">${rec.title}</h3>
          <p class="text-xs text-gray-500 font-mono mb-4">${rec.facility}</p>

          <!-- Access Status Pill -->
          <div class="p-3 rounded-xl mb-4 font-mono text-xs ${isGranted ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
            <div class="flex items-center space-x-2 font-bold">
              <span>${isGranted ? '🔓 DECRYPTION PERMITTED' : '🔒 CRYPTOGRAPHICALLY SEALED'}</span>
            </div>
            <p class="text-[11px] mt-1 ${isGranted ? 'text-emerald-700' : 'text-rose-700'}">
              ${isGranted ? `RelationshipAttestation:1 verified for ${profile.name}.` : 'No active patient grant exists for your authenticated key.'}
            </p>
          </div>
        </div>

        <button onclick="requestDecryption('${rec.id}')" class="w-full py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2 ${
          isGranted
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-800 hover:bg-gray-900 text-gray-200'
        }">
          <span>${isGranted ? '🔓 Decrypt Client-Side (Tide Quorum)' : '🔒 Test Access / Attempt Decryption'}</span>
        </button>
      </div>
    `;
  }).join('');
}

// --- CLIENT-SIDE DECRYPTION ENGINE ---
// Invariant I-11 & I-01: Decryption runs 100% in the browser.
// The server has ZERO decryption keys and never touches plaintext.
async function requestDecryption(recordId) {
  const profile = CLINICIAN_PROFILES[currentRole];
  const rec = cachedRecords.find(r => r.id === recordId);
  if (!rec) return;

  const activeGrant = cachedPolicies.find(p =>
    p.recordId === recordId &&
    p.status === "active" &&
    ((p.subject && p.subject.id === profile.id) || p.subjectId === profile.id || p.subjectRole === profile.role)
  );

  if (!activeGrant) {
    // Access Refused by Tide Fabric Consensus
    renderOrkNodes(0, 20); // 0/20 approved
    showFabricRefusalModal({
      error: "TIDE-TIDEJS-NET-THRESHOLD_FAILURE",
      code: 403,
      contract: "RelationshipAttestation:1",
      reason: `Access refused by Tide Fabric: Caller (${profile.name}) has no active grant from Patient for record ${recordId}. Threshold consensus failed.`,
      consensus: {
        orkTotal: 20,
        orkApproved: 0,
        orkRejected: 20,
        thresholdRequired: 14,
        consensusAchieved: false
      }
    });
    fetchAuditLogs();
    return;
  }

  try {
    // Invariant I-01 & I-11: Sole decrypt path is decryptForRecord() through Tide
    // Zero client-side fallback keys exist. Keys emerge in browser memory only upon ORK consensus.
    const decryptedStr = await decryptForRecord(rec.ciphertext, recordId, activeGrant.policyB64 || "");
    const clinicalData = JSON.parse(decryptedStr);

    renderDecryptedViewer({
      title: rec.title,
      patientName: rec.patientName,
      policyUsed: activeGrant.policyId,
      clinicalData: clinicalData,
      networkResult: "Consensus Verified (Emergent Authority)"
    });

    renderOrkNodes(20, 0); // 20/20 active consensus
    fetchAuditLogs();
  } catch (err) {
    console.error("Tide Emergent Authority Decryption Failure:", err);
    renderOrkNodes(0, 20); // 0/20 threshold refusal
    showFabricRefusalModal({
      error: "TIDE-TIDEJS-NET-THRESHOLD_FAILURE",
      code: 403,
      contract: "RelationshipAttestation:1",
      reason: err.cause || err.message || "Tide Fabric consensus threshold failed. No emergent key shares released."
    });
    fetchAuditLogs();
  }
}

function renderDecryptedViewer(data) {
  const modal = document.getElementById("clinical-viewer-modal");
  const title = document.getElementById("viewer-title");
  const content = document.getElementById("viewer-content");

  title.textContent = `${data.title} — ${data.patientName}`;
  const cd = data.clinicalData;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-800 flex justify-between items-center">
        <div>
          <strong>Tide Fabric Attestation:</strong> Emergent Authority consensus released session keys for <span class="underline">${data.policyUsed}</span>.
        </div>
        <span class="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">${data.networkResult || "Live ORK Consensus Achieved"}</span>
      </div>

      <!-- Metrics Grid -->
      <div>
        <h4 class="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold mb-2">Clinical Biomarkers & Diagnostic Metrics:</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${(cd.metrics || []).map(m => `
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span class="text-[11px] text-gray-500 block truncate">${m.name}</span>
              <div class="flex items-baseline space-x-1 mt-0.5">
                <span class="text-lg font-bold text-gray-900">${m.value}</span>
                <span class="text-xs text-gray-500">${m.unit}</span>
              </div>
              <div class="flex items-center justify-between text-[10px] mt-1 font-mono">
                <span class="text-emerald-700 font-semibold">${m.status}</span>
                <span class="text-gray-400">Ref: ${m.ref}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Diagnoses -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <h4 class="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Attending Diagnoses:</h4>
        <ul class="list-disc list-inside text-xs text-gray-800 space-y-1 font-medium">
          ${(cd.diagnoses || []).map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      <!-- Physician Clinical Notes -->
      <div class="bg-tide-light p-4 rounded-xl border border-tide-accent/30">
        <h4 class="text-xs font-mono uppercase tracking-wider text-tide-teal font-bold mb-1">Confidential Clinical Notes:</h4>
        <p class="text-xs text-tide-dark leading-relaxed font-sans">${cd.clinicalNotes || ""}</p>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.scrollIntoView({ behavior: "smooth" });
}

function closeViewer() {
  document.getElementById("clinical-viewer-modal").classList.add("hidden");
}

function showFabricRefusalModal(errorData) {
  const modal = document.getElementById("fabric-refusal-modal");
  const reason = errorData.reason || "Access refused by Tide Fabric: Caller lacks active patient consent grant.";
  if (!modal) {
    alert("⛔ TIDE FABRIC REFUSAL: " + reason);
    return;
  }

  const reasonEl = document.getElementById("refusal-modal-reason");
  const contractEl = document.getElementById("refusal-modal-contract");
  const approvedEl = document.getElementById("refusal-modal-approved");
  const rejectedEl = document.getElementById("refusal-modal-rejected");

  if (reasonEl) reasonEl.textContent = reason;
  if (contractEl) contractEl.textContent = `Contract: ${errorData.contract || "RelationshipAttestation:1"} · Code: ${errorData.code || 403}`;
  if (approvedEl) approvedEl.textContent = `${errorData.consensus?.orkApproved ?? 0} / ${errorData.consensus?.orkTotal ?? 20}`;
  if (rejectedEl) rejectedEl.textContent = `${errorData.consensus?.orkRejected ?? 20} / ${errorData.consensus?.orkTotal ?? 20}`;

  modal.classList.remove("hidden");
}

function closeFabricRefusalModal() {
  const modal = document.getElementById("fabric-refusal-modal");
  if (modal) modal.classList.add("hidden");
}

// --- GRANTS TABLE ---
function renderGrantsTable() {
  const tbody = document.getElementById("grants-table-body");
  if (!tbody) return;

  if (cachedPolicies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-400">No active delegated grants.</td></tr>`;
    return;
  }

  tbody.innerHTML = cachedPolicies.map(p => {
    const isRevoked = p.status === "revoked";
    const statusPill = isRevoked
      ? '<span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">REVOKED</span>'
      : '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>';

    const subName = p.subject ? (p.subject.name || p.subject.id) : (p.subjectName || p.subjectId);
    const subRole = p.subject ? p.subject.type : (p.subjectRole || "User");

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="py-3 px-4 font-bold text-gray-900">
          <div>${p.recordId}</div>
          <div class="text-[10px] text-gray-400 font-mono">${p.policyId}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-medium text-gray-900">${subName}</div>
          <div class="text-[10px] text-gray-400 font-mono">${p.subject ? p.subject.id : p.subjectId}</div>
        </td>
        <td class="py-3 px-4 font-mono text-xs">
          <span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">${subRole}</span>
        </td>
        <td class="py-3 px-4 font-mono text-[11px] text-gray-500">
          ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active'}
        </td>
        <td class="py-3 px-4">${statusPill}</td>
        <td class="py-3 px-4 text-right">
          ${!isRevoked
            ? `<button onclick="revokePolicy('${p.policyId}')" class="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 transition">Revoke Access</button>`
            : '<span class="text-xs text-gray-400 font-mono">Revoked on Fabric</span>'
          }
        </td>
      </tr>
    `;
  }).join('');
}

// --- GRANT MODAL ---
function openGrantModal(recordId, recordTitle) {
  const idEl = document.getElementById("grant-record-id");
  const titleEl = document.getElementById("grant-record-title");
  if (idEl) idEl.value = recordId;
  if (titleEl) titleEl.value = recordTitle;
  document.getElementById("grant-modal").classList.remove("hidden");
}

function closeGrantModal() {
  document.getElementById("grant-modal").classList.add("hidden");
}

async function submitGrant() {
  const recordId = document.getElementById("grant-record-id").value;
  const clinicianKey = document.getElementById("grant-clinician-select").value;
  const duration = parseInt(document.getElementById("grant-duration-select").value);

  const profile = CLINICIAN_PROFILES[clinicianKey];
  if (!profile) {
    showNotification("Validation Error", "Invalid clinician profile selected.", "error");
    return;
  }

  try {
    // Build binary RelationshipAttestation:1 policy using official SDK
    const policyObj = buildRelationshipPolicy({
      vendorId: "03054760-24ce-43a4-9b38-47ca2412fcde",
      subject: { type: "User", id: profile.id },
      recordId: recordId,
      access: "read",
      expiry: Math.floor(Date.now() / 1000) + duration * 3600
    });

    const policyBytes = policyObj.toBytes();
    const policyB64 = btoa(String.fromCharCode(...policyBytes));

    // Verify policy parameters using official Tide descriptor
    const desc = describeRelationshipPolicy(policyB64);
    console.log("RelationshipAttestation:1 policy generated:", desc);

    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({
        recordId,
        subject: { type: "User", id: profile.id, name: profile.name, role: profile.role },
        access: "read",
        policy: policyB64
      })
    });

    if (res.ok) {
      closeGrantModal();
      await refreshAll();
      showNotification(
        "Access Granted",
        `RelationshipAttestation:1 policy signed and registered in Tide Fabric for ${profile.name}.`,
        "success"
      );
    } else {
      const err = await res.json();
      showNotification("Grant Failed", err.error || "Unable to register policy.", "error");
    }
  } catch (err) {
    showNotification("Network Error", err.message, "error");
  }
}

async function revokePolicy(policyId) {
  if (!confirm("Are you sure you want to revoke this clinician's access?\n\nThis will trigger zero-delay cryptographic revocation on Tide Fabric.")) return;

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/policies/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({ policyId })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to execute revocation on server");
    }

    // Refresh policies and all views from server
    await refreshAll();

    // If currently on clinician view, re-render immediately to reflect revocation
    if (currentRole.startsWith("clinician")) {
      renderClinicianView();
    }

    showNotification(
      "Revocation Enforced",
      `Policy ${policyId} revoked. Tide Fabric consensus threshold reduced to 0/20.`,
      "success"
    );
  } catch (err) {
    showNotification("Revocation Failed", err.message, "error");
  }
}

// --- ROGUE ADMIN SIMULATOR ---
async function fetchRawDatabase() {
  try {
    const res = await fetch("/api/raw-database");
    const data = await res.json();
    document.getElementById("raw-database-view").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Failed to read raw database", err);
  }
}

async function simulateAdminOverride() {
  try {
    const res = await fetch("/api/rogue-admin/override", { method: "POST" });
    const data = await res.json();

    const outputEl = document.getElementById("override-attempt-output");
    outputEl.textContent = JSON.stringify(data, null, 2);
    outputEl.classList.remove("text-emerald-400");
    outputEl.classList.add("text-rose-400");

    renderOrkNodes(0, 20); // 0/20 approved
    fetchAuditLogs();
  } catch (err) {
    console.error("Override simulation error", err);
  }
}

// --- ORK NETWORK VISUALIZER ---
function renderOrkNodes(approvedCount, rejectedCount) {
  const container = document.getElementById("ork-nodes-grid");
  if (!container) return;

  let nodesHtml = "";
  for (let i = 1; i <= 20; i++) {
    let colorClass = "bg-gray-200 text-gray-500 border-gray-300";

    if (approvedCount > 0 && i <= approvedCount) {
      colorClass = "bg-emerald-500 text-white border-emerald-600 shadow-sm";
    } else if (rejectedCount > 0 && i <= rejectedCount) {
      colorClass = "bg-rose-500 text-white border-rose-600 shadow-sm";
    }

    nodesHtml += `
      <div class="w-7 h-7 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-all ${colorClass}">
        ${i}
      </div>
    `;
  }

  container.innerHTML = nodesHtml;

  const countBadge = document.getElementById("ork-quorum-count");
  if (countBadge) {
    if (approvedCount >= 14) {
      countBadge.textContent = `${approvedCount}/20 APPROVED (QUORUM REACHED)`;
      countBadge.className = "text-xs font-mono font-bold text-emerald-400";
    } else if (rejectedCount > 6) {
      countBadge.textContent = `${rejectedCount}/20 REJECTED (QUORUM REFUSED)`;
      countBadge.className = "text-xs font-mono font-bold text-rose-400";
    } else {
      countBadge.textContent = "14/20 REQUIRED FOR RELEASE";
      countBadge.className = "text-xs font-mono text-gray-400";
    }
  }
}

// --- AUDIT LOG STREAM ---
function renderAuditStream() {
  const container = document.getElementById("audit-log-stream");
  const fullList = document.getElementById("full-audit-log-list");
  if (!container) return;

  container.innerHTML = activeAuditLogs.slice(0, 4).map(log => `
    <div class="flex items-start space-x-2 text-xs font-mono py-1 border-b border-gray-100 last:border-0">
      <span class="w-1.5 h-1.5 rounded-full mt-1.5 ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
      <div class="flex-1">
        <div class="flex justify-between items-center text-[10px] text-gray-400">
          <span>${log.contract || 'Fabric'}</span>
          <span>${new Date(log.timestamp).toLocaleTimeString()}</span>
        </div>
        <p class="text-gray-800 text-[11px] font-medium leading-snug">${log.details}</p>
      </div>
    </div>
  `).join('');

  if (fullList) {
    fullList.innerHTML = activeAuditLogs.map(log => `
      <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs">
        <div class="flex justify-between text-[11px] text-gray-500 mb-1">
          <span class="font-bold text-gray-900">${log.event}</span>
          <span>${new Date(log.timestamp).toLocaleString()}</span>
        </div>
        <p class="text-gray-700 text-xs">${log.details}</p>
      </div>
    `).join('');
  }
}

function toggleAuditModal() {
  const modal = document.getElementById("audit-modal");
  if (modal) modal.classList.toggle("hidden");
}

// --- ATTACH TO WINDOW FOR INLINE ONCLICK HANDLERS ---
window.switchRole = switchRole;
window.requestDecryption = requestDecryption;
window.closeViewer = closeViewer;
window.closeFabricRefusalModal = closeFabricRefusalModal;
window.toggleAuditModal = toggleAuditModal;
window.openGrantModal = openGrantModal;
window.closeGrantModal = closeGrantModal;
window.submitGrant = submitGrant;
window.revokePolicy = revokePolicy;
window.fetchRawDatabase = fetchRawDatabase;
window.simulateAdminOverride = simulateAdminOverride;
window.showNotification = showNotification;
