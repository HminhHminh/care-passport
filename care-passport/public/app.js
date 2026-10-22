// Care Passport — TideCloak Emergent Authority Client Application
// UNLOCKED RMIT Hackathon 2026

let currentRole = "patient";
let cachedRecords = [];
let cachedPolicies = [];
let activeAuditLogs = [];

const CLINICIAN_PROFILES = {
  clinician_gp: {
    id: "usr_key_dr_marcus_gp_987",
    name: "Dr. Alice Marcus",
    title: "General Practitioner",
    role: "clinician_gp",
    color: "teal"
  },
  clinician_specialist: {
    id: "usr_key_dr_chen_cardio_456",
    name: "Dr. Marcus Chen",
    title: "Cardiologist",
    role: "clinician_specialist",
    color: "blue"
  }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  renderOrkNodes(20, 0);
  refreshAll();
  // Poll audit log every 5 seconds
  setInterval(fetchAuditLogs, 5000);
});

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
  if (role === "patient") {
    activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-tide-accent text-tide-deeper shadow-sm font-bold";
  } else if (role === "rogue_admin") {
    activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-rose-600 text-white font-bold shadow-sm";
  } else {
    activeTab.className = "role-tab px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all font-medium bg-tide-teal text-white font-bold shadow-sm";
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
    document.getElementById("clinician-name-heading").textContent = profile.name;
    document.getElementById("clinician-role-badge").textContent = profile.title;
    document.getElementById("clinician-key-badge").textContent = `ID: ${profile.id} · Role: _tide_decryptor (${profile.role})`;
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
    if (activeAuditLogs.length > 0) {
      const latest = activeAuditLogs[0];
      const ticker = document.getElementById("latest-audit-event");
      const statusColor = latest.status === "SUCCESS" ? "text-emerald-600" : latest.status === "DENIED" ? "text-rose-600" : "text-amber-600";
      ticker.innerHTML = `<span class="${statusColor} font-bold">[${latest.event}]</span> ${latest.details}`;
      document.getElementById("audit-count").textContent = activeAuditLogs.length;
    }
  } catch (err) {
    console.error("Failed to fetch audit log", err);
  }
}

// --- RENDER PATIENT VIEW ---
function renderPatientView() {
  const container = document.getElementById("patient-records-container");
  if (!container) return;

  container.innerHTML = cachedRecords.map(rec => {
    // Find active policies for this record
    const recordPolicies = cachedPolicies.filter(p => p.recordId === rec.id && p.status === "active");

    const categoryBadges = {
      general_practice: '<span class="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold">General Practice</span>',
      cardiology: '<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold">Cardiology (Specialist)</span>',
      mental_health: '<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold">Mental Health (Quarantined)</span>'
    };

    const hasActiveGrants = recordPolicies.length > 0;

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            ${categoryBadges[rec.category] || '<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">General</span>'}
            <span class="text-xs text-gray-400 font-mono">${rec.date}</span>
          </div>

          <h3 class="text-base font-bold text-gray-900 leading-snug mb-1">${rec.title}</h3>
          <p class="text-xs text-gray-500 font-mono mb-4">${rec.facility}</p>

          <!-- Raw Ciphertext Preview -->
          <div class="bg-gray-900 rounded-xl p-3 text-[11px] font-mono text-gray-300 mb-4 border border-gray-800">
            <div class="flex items-center justify-between text-gray-400 pb-1 mb-1 border-b border-gray-800 text-[10px]">
              <span>AES-256-GCM CIPHERTEXT</span>
              <span class="text-emerald-400 font-bold">Tag: ${rec.tag}</span>
            </div>
            <p class="truncate text-tide-accent">${rec.ciphertext.substring(0, 36)}...</p>
            <div class="flex items-center justify-between mt-1 text-[10px] text-gray-400">
              <span>IV: ${rec.iv.substring(0, 10)}...</span>
              <span class="text-amber-300 font-bold">AuthTag: ${rec.authTag.substring(0, 8)}...</span>
            </div>
          </div>

          <!-- Granted Clinicians Badges -->
          <div class="mb-4">
            <span class="text-[11px] text-gray-500 font-mono block mb-1">Active Delegated Grants:</span>
            ${hasActiveGrants ? `
              <div class="space-y-1">
                ${recordPolicies.map(p => `
                  <div class="flex items-center justify-between bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-mono">
                    <span class="truncate">✓ ${p.subjectName}</span>
                    <button onclick="revokeGrant('${p.policyId}')" class="text-rose-600 hover:text-rose-800 font-bold ml-2">Revoke</button>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="bg-gray-50 text-gray-500 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono">
                🔒 Private to Patient (Zero Clinician Grants)
              </div>
            `}
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center gap-2">
          <button onclick="openGrantModal('${rec.id}', '${rec.title.replace(/'/g, "\\'")}')" class="w-full py-2 bg-tide-teal hover:bg-tide-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            <span>Grant Clinician Access</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// --- RENDER CLINICIAN VIEW ---
function renderClinicianView() {
  const container = document.getElementById("clinician-records-container");
  if (!container) return;

  const profile = CLINICIAN_PROFILES[currentRole];

  container.innerHTML = cachedRecords.map(rec => {
    // Check if this clinician has active grant
    const activeGrant = cachedPolicies.find(p =>
      p.recordId === rec.id &&
      p.status === "active" &&
      (p.subjectId === profile.id || p.subjectRole === profile.role)
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
          <span>${isGranted ? '🔓 Request Decryption via Tide Fabric' : '🔒 Test Access / Attempt Decryption'}</span>
        </button>
      </div>
    `;
  }).join('');
}

// --- DECRYPTION ENGINE ---
async function requestDecryption(recordId) {
  const profile = CLINICIAN_PROFILES[currentRole];

  try {
    const res = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId,
        callerRole: profile.role,
        callerId: profile.id,
        callerName: profile.name
      })
    });

    const data = await res.json();

    if (res.ok) {
      renderDecryptedViewer(data);
      renderOrkNodes(20, 0); // All 20 ORKs voted YES
      fetchAuditLogs();
    } else {
      // Access Denied by Fabric Consensus
      renderOrkNodes(0, 20); // All 20 ORKs voted NO
      showFabricRefusalModal(data);
      fetchAuditLogs();
    }
  } catch (err) {
    alert("Decryption network request failed: " + err.message);
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
        <span class="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">14/20 Quorum Met</span>
      </div>

      <!-- Metrics Grid -->
      <div>
        <h4 class="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold mb-2">Clinical Biomarkers & Diagnostic Metrics:</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${cd.metrics.map(m => `
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
          ${cd.diagnoses.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      <!-- Physician Clinical Notes -->
      <div class="bg-tide-light p-4 rounded-xl border border-tide-accent/30">
        <h4 class="text-xs font-mono uppercase tracking-wider text-tide-teal font-bold mb-1">Confidential Clinical Notes:</h4>
        <p class="text-xs text-tide-dark leading-relaxed font-sans">${cd.clinicalNotes}</p>
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
  const reason = errorData.reason || "Access refused by Tide Fabric: Caller lacks active patient consent grant.";
  alert(`⛔ TIDE FABRIC CRYPTOGRAPHIC REFUSAL\n\nContract: RelationshipAttestation:1\nError Code: ${errorData.error}\n\n${reason}\n\nConsensus Outcome: 0 of 20 ORK nodes approved. Key shares withheld.`);
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

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="py-3 px-4 font-bold text-gray-900">
          <div>${p.recordId}</div>
          <div class="text-[10px] text-gray-400 font-mono">${p.policyId}</div>
        </td>
        <td class="py-3 px-4 text-gray-800">${p.subjectName}</td>
        <td class="py-3 px-4 text-tide-teal font-bold">${p.subjectRole}</td>
        <td class="py-3 px-4 text-gray-500">${new Date(p.expiresAt).toLocaleDateString()}</td>
        <td class="py-3 px-4">${statusPill}</td>
        <td class="py-3 px-4 text-right">
          ${!isRevoked ? `
            <button onclick="revokeGrant('${p.policyId}')" class="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded font-bold text-xs transition">
              Revoke Immediately
            </button>
          ` : `<span class="text-gray-400 text-xs">Access Blocked</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// --- GRANT MODAL ACTIONS ---
function openGrantModal(recordId, recordTitle) {
  document.getElementById("grant-record-id").value = recordId;
  document.getElementById("grant-record-title").value = `${recordTitle} (${recordId})`;
  document.getElementById("grant-modal").classList.remove("hidden");
}

function closeGrantModal() {
  document.getElementById("grant-modal").classList.add("hidden");
}

async function submitGrant() {
  const recordId = document.getElementById("grant-record-id").value;
  const clinicianKey = document.getElementById("grant-clinician-select").value;
  const hours = parseInt(document.getElementById("grant-duration-select").value);

  const target = clinicianKey === "dr_marcus"
    ? CLINICIAN_PROFILES.clinician_gp
    : CLINICIAN_PROFILES.clinician_specialist;

  try {
    const res = await fetch("/api/policies/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId,
        subjectId: target.id,
        subjectName: target.name,
        subjectRole: target.role,
        durationHours: hours
      })
    });

    if (res.ok) {
      closeGrantModal();
      await refreshAll();
    } else {
      alert("Failed to issue grant");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function revokeGrant(policyId) {
  if (!confirm("Are you sure you want to revoke this clinician's access immediately?\n\nThe Tide Fabric ORK network will instantly refuse all future decryption requests.")) return;

  try {
    const res = await fetch("/api/policies/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId })
    });

    if (res.ok) {
      await refreshAll();
    }
  } catch (err) {
    alert("Revocation failed: " + err.message);
  }
}

// --- ROGUE ADMIN SIMULATOR ---
async function fetchRawDatabase() {
  try {
    const res = await fetch("/api/raw-database");
    const data = await res.json();
    document.getElementById("raw-db-preview").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("raw-db-preview").textContent = "Error loading database dump.";
  }
}

async function simulateAdminOverride() {
  const box = document.getElementById("attack-result-box");
  box.classList.remove("hidden");
  box.className = "mt-4 p-4 rounded-xl text-xs font-mono bg-rose-50 border-2 border-rose-400 text-rose-950";
  box.innerHTML = `
    <div class="flex items-center space-x-2 text-rose-700 font-bold mb-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      <span>SIMULATED ADVERSARIAL OVERRIDE TRIGGERED</span>
    </div>
    <p>Contacting server superuser bypass endpoint...</p>
  `;

  try {
    const res = await fetch("/api/rogue-admin/override", { method: "POST" });
    const data = await res.json();

    renderOrkNodes(0, 20); // All 20 nodes rejected unilateral bypass

    box.innerHTML = `
      <div class="flex items-center space-x-2 text-rose-700 font-bold mb-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>BYPASS STRUCTURALLY REJECTED BY TIDE FABRIC</span>
      </div>
      <p class="font-bold text-rose-900 mb-1">${data.error}: ${data.message}</p>
      <p class="text-gray-700 leading-relaxed text-[11px] mb-3">${data.explanation}</p>
      <div class="p-2 bg-black text-rose-400 rounded-lg text-[10px]">
        Consensus Result: 0/20 ORK Shares Released · Master Key Status: NON-EXISTENT
      </div>
    `;
    fetchAuditLogs();
  } catch (err) {
    box.textContent = "Error: " + err.message;
  }
}

// Visual Node Renderer (20 ORK nodes)
function renderOrkNodes(approved, rejected) {
  const container = document.getElementById("ork-nodes-grid");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const isApproved = i <= approved;
    const isRejected = i <= rejected;
    const color = isApproved
      ? "bg-emerald-400 text-black font-bold"
      : isRejected
      ? "bg-rose-500 text-white font-bold"
      : "bg-white/20 text-gray-300";

    const node = document.createElement("div");
    node.className = `h-7 rounded flex items-center justify-center text-[10px] ${color} transition-all`;
    node.title = `ORK Node #${i}`;
    node.textContent = i;
    container.appendChild(node);
  }
}

// --- AUDIT MODAL ---
function toggleAuditModal() {
  const modal = document.getElementById("audit-modal");
  modal.classList.toggle("hidden");

  if (!modal.classList.contains("hidden")) {
    const list = document.getElementById("full-audit-log-list");
    list.innerHTML = activeAuditLogs.map(l => `
      <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono">
        <div class="flex justify-between items-center text-gray-500 mb-1 text-[11px]">
          <span class="font-bold text-tide-teal">${l.event}</span>
          <span>${new Date(l.timestamp).toLocaleTimeString()}</span>
        </div>
        <p class="text-gray-800 text-[11px]">${l.details}</p>
        <div class="flex justify-between items-center mt-1 text-[10px] text-gray-400">
          <span>Contract: ${l.contract}</span>
          <span class="${l.status === 'SUCCESS' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">${l.status}</span>
        </div>
      </div>
    `).join('');
  }
}
