// --- Native Module Imports ---
import { HomeView } from "./views/home.js";
import { AboutView } from "./views/about.js";
import { ProjectsView } from "./views/projects.js";
import { AdminView } from "./views/admin.js";

// --- Supabase Config Setup ---
const SUPABASE_URL = "https://xgfxdxuogerkeqcdiucj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JPTKGfDNwKFM7dH6KP5I9w_-UjGFj1H";

// Initialize the Supabase client directly
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Modular Views Map ---
const views = {
  "#/": HomeView,
  "#/about": AboutView,
  "#/projects": ProjectsView,
  "#/admin": AdminView,
};

// --- SPA Router Core Engine ---
async function router() {
  const viewport = document.getElementById("app-viewport");
  const currentHash = window.location.hash || "#/";

  // Security Guard: Prevent unauthorized routing directly to the builder
  if (currentHash === "#/projects") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Access Denied, Sir. Please authenticate first.");
      window.location.hash = "#/admin";
      return;
    }
  }

  // Retrieve matching view executor or default to 404
  const renderView =
    views[currentHash] ||
    (() =>
      `<div class="page-container"><h1>404</h1><p>Page not found.</p></div>`);
  viewport.innerHTML = renderView();

  // Clean initialization of event handlers to completely prevent duplicate event bindings
  setupRouteListeners(currentHash);
}

// --- Centralized Event Listener Mapping Hub ---
function setupRouteListeners(hash) {
  if (hash === "#/admin") {
    const loginForm = document.getElementById("login-form");
    const mfaForm = document.getElementById("mfa-form");
    const mfaSetupForm = document.getElementById("mfa-setup-form");

    // Overwriting the '.onsubmit' property cleanly prevents memory leaks from duplicated event loops
    if (loginForm) loginForm.onsubmit = handleAdminLogin;
    if (mfaForm) mfaForm.onsubmit = handleMFAChallengeSubmit;
    if (mfaSetupForm) mfaSetupForm.onsubmit = handleMFAEnrollmentVerification;
  } else if (hash === "#/projects") {
    initPageBuilderEngine();
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

// --- Authentication Management Controller Engine ---
async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  const errorEl = document.getElementById("auth-error-msg");
  errorEl.style.display = "none";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    errorEl.innerText = error.message;
    errorEl.style.display = "block";
    return;
  }

  // Query for active multi-factor factors configurations
  const { data: factors, error: mfaError } =
    await supabase.auth.mfa.listFactors();
  if (mfaError) {
    errorEl.innerText = mfaError.message;
    errorEl.style.display = "block";
    return;
  }

  const loginForm = document.getElementById("login-form");

  if (factors.all.length > 0) {
    loginForm.style.display = "none";
    document.getElementById("mfa-form").style.display = "block";
    window.currentMFAFactorId = factors.all[0].id;
  } else {
    loginForm.style.display = "none";
    startMFAEnrollmentFlow();
  }
}

// --- Phase 2: First-Time Enrollment Generation ---
async function startMFAEnrollmentFlow() {
  const errorEl = document.getElementById("auth-error-msg");

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });
  if (error) {
    errorEl.innerText = error.message;
    errorEl.style.display = "block";
    return;
  }

  window.currentMFAFactorId = data.id;

  const qrContainer = document.getElementById("mfa-qr-container");
  qrContainer.innerHTML = `<img src="${data.totp.qr_code}" style="width:200px; height:200px;" alt="Scan QR Code Token">`;
  document.getElementById("mfa-enrollment").style.display = "block";
}

// --- Phase 3: Verify and Activate First-Time 2FA ---
async function handleMFAEnrollmentVerification(e) {
  e.preventDefault();
  const code = document.getElementById("mfa-setup-token").value;
  const errorEl = document.getElementById("auth-error-msg");
  errorEl.style.display = "none";

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: window.currentMFAFactorId,
    code: code,
  });

  if (error) {
    errorEl.innerText = error.message;
    errorEl.style.display = "block";
    return;
  }

  alert(
    "2FA activated perfectly, Sir! Your administrator account is fully secure.",
  );
  window.location.hash = "#/projects";
}

// --- Phase 4: Handle Ongoing Login Verification Challenge ---
async function handleMFAChallengeSubmit(e) {
  e.preventDefault();
  const code = document.getElementById("mfa-token").value;
  const errorEl = document.getElementById("auth-error-msg");
  errorEl.style.display = "none";

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: window.currentMFAFactorId,
    code: code,
  });

  if (error) {
    errorEl.innerText = error.message;
    errorEl.style.display = "block";
    return;
  }

  window.location.hash = "#/projects";
}

// --- Connection Diagnostic ---
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .limit(1);
    if (error) {
      console.error("❌ Supabase API Connection Error:", error.message);
      return;
    }
    console.log("🚀 Success! Connected to Supabase smoothly.");
  } catch (err) {
    console.error("💥 Network Error:", err);
  }
}
checkSupabaseConnection();

// --- HTML5 Drag-and-Drop Page Builder Engine ---
function initPageBuilderEngine() {
  const draggables = document.querySelectorAll(".draggable-block");
  const canvas = document.getElementById("builder-canvas");
  const placeholder = document.getElementById("canvas-placeholder");
  const saveBtn = document.getElementById("save-builder-btn");

  if (!canvas) return;

  draggables.forEach((block) => {
    block.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", block.dataset.type);
    };
  });

  canvas.ondragover = (e) => e.preventDefault();

  canvas.ondrop = (e) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("text/plain");

    if (placeholder) placeholder.style.display = "none";

    const targetElement = generateCanvasElementNode(blockType);
    canvas.appendChild(targetElement);
  };

  if (saveBtn) saveBtn.onclick = saveCanvasToSupabase;
}

// --- Serialize DOM tree layout state and save to Database ---
async function saveCanvasToSupabase() {
  const titleInput = document
    .getElementById("project-title-input")
    .value.trim();
  const rows = document.querySelectorAll(".canvas-row");

  if (!titleInput) {
    alert("Please input a valid Project Title before syncing, Sir!");
    return;
  }
  if (rows.length === 0) {
    alert("Your design canvas is completely empty!");
    return;
  }

  const serializedLayout = [];

  rows.forEach((row) => {
    const type = row.dataset.componentType;
    const record = { type: type, content: {} };

    if (type === "hero") {
      record.content.heading = row.querySelector("h2").innerText;
      record.content.subheading = row.querySelector("p").innerText;
    } else if (type === "text-block") {
      record.content.body = row.querySelector("p").innerText;
    } else if (type === "image-grid") {
      record.content.meta = "static_placeholders";
    }

    serializedLayout.push(record);
  });

  const slug = titleInput
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const { data, error } = await supabase
    .from("projects")
    .insert([{ title: titleInput, slug: slug, layout_data: serializedLayout }])
    .select();

  if (error) {
    console.error("Database save failed:", error.message);
    alert("Sync pipeline error: " + error.message);
  } else {
    alert("Project layout synchronized and saved securely to Supabase!");
    console.log("Saved payload data stream:", data);
  }
}

// Helper block factory that yields editable DOM blocks onto our canvas
function generateCanvasElementNode(type) {
  const blockRow = document.createElement("div");
  blockRow.className = "canvas-row";
  blockRow.dataset.componentType = type;
  blockRow.style.cssText =
    "background: var(--bg-dark); padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px; position: relative; animation: fadeIn 0.2s;";

  let innerContent = "";

  if (type === "hero") {
    innerContent = `
        <h2 contenteditable="true" style="font-size: 2rem; margin-bottom: 0.5rem; outline: none; color: var(--accent);">Edit Hero Heading Here</h2>
        <p contenteditable="true" style="color: var(--text-secondary); outline: none;">Subheading body text. Click here to edit directly.</p>
    `;
  } else if (type === "text-block") {
    innerContent = `
        <p contenteditable="true" style="line-height: 1.6; outline: none;">Standard rich content paragraph block component context details.</p>
    `;
  } else if (type === "image-grid") {
    innerContent = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem;">
            <div style="background: var(--border); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--text-secondary);">Image Placeholder 1</div>
            <div style="background: var(--border); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--text-secondary);">Image Placeholder 2</div>
        </div>
    `;
  }

  blockRow.innerHTML = `
        ${innerContent}
        <button onclick="this.parentElement.remove()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem;">✕ Remove</button>
    `;
  return blockRow;
}
