// app.js
import { initDashboard } from "./templates/js/dashboard.js";
import { initEditor } from "./templates/js/editor.js";
import { ProjectCard } from "./templates/js/cardComponent.js";
import {
  renderGlobalNavbar,
  renderWorkspaceHeader,
} from "./templates/js/navbar.js";

// --- Supabase Config Setup ---
const SUPABASE_URL = "https://xgfxdxuogerkeqcdiucj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JPTKGfDNwKFM7dH6KP5I9w_-UjGFj1H";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const routes = {
  "#/": "./templates/home.html",
  "#/about": "./templates/about.html",
  "#/admin": "./templates/admin.html",
  "#/dashboard": "./templates/dashboard.html",
  "#/editor": "./templates/editor.html",
};

// State tracker variable to remember if we are updating a card row or inserting a new one
window.activeEditingProjectId = null;

// --- SPA Router Core Engine ---
async function router() {
  const viewport = document.getElementById("app-viewport");
  const navSlot = document.getElementById("app-navigation-slot");
  const rawHash = window.location.hash || "#/";

  // Normalize string extractions out of path hashes before validating rules
  let currentHash = rawHash.split("?")[0];

  // Map viewSlot to viewport context safely
  const viewSlot = viewport;
  if (!navSlot || !viewSlot) return;

  // Intercept public portfolio view paths
  if (rawHash.startsWith("#/view-project")) {
    currentHash = "#/view-project";
  }

  // Normalize checking matching hashes for sub-route variations in the workspace
  if (rawHash.startsWith("#/editor")) {
    currentHash = "#/editor";
  }

  // Route normalization: handle old #/projects links smoothly
  if (currentHash === "#/projects") {
    window.location.hash = "#/dashboard";
    return;
  }

  // Security Access Guard Rules Check
  if (currentHash === "#/dashboard" || currentHash === "#/editor") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Access Denied, Sir. Please authenticate first.");
      window.location.hash = "#/admin";
      return;
    }
  }

  // --- Dynamic Component Navbar Swap Placement Pipeline ---
  if (currentHash === "#/editor") {
    // Mount the specialized workspace configuration header panel
    navSlot.innerHTML = renderWorkspaceHeader();
  } else {
    // Mount standard public branding layout navigation links
    navSlot.innerHTML = renderGlobalNavbar();
  }

  // Route processing execution blocks
  if (currentHash === "#/view-project") {
    await loadAndMaterializeProjectLayout();
    return;
  }

  const templatePath = routes[currentHash];
  if (templatePath) {
    try {
      const response = await fetch(templatePath);
      if (!response.ok)
        throw new Error(`Failed to load view fragment: ${response.status}`);
      viewport.innerHTML = await response.text();
    } catch (err) {
      console.error(err);
      viewport.innerHTML = `<div class="page-container"><h1>Error Loading View</h1><p>${err.message}</p></div>`;
    }
  } else {
    viewport.innerHTML = `<div class="page-container"><h1>404</h1><p>Page not found.</p></div>`;
  }

  setupRouteListeners(currentHash);
}

// --- Centralized Event Listener Mapping Hub ---
function setupRouteListeners(hash) {
  if (hash === "#/") {
    renderPublicProjectsHomeGrid().then(() => {
      // Feature 1: Smooth auto scroll interceptor logic when entering home from navbar scroll click
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
      if (
        urlParams.has("scroll") ||
        window.location.hash.includes("projects")
      ) {
        document
          .getElementById("public-projects-grid")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    });
  } else if (hash === "#/dashboard") {
    initDashboard(supabase);
  } else if (hash === "#/editor") {
    initEditor(supabase);
  } else if (hash === "#/admin") {
    const loginForm = document.getElementById("login-form");
    const mfaForm = document.getElementById("mfa-form");
    const mfaSetupForm = document.getElementById("mfa-setup-form");

    if (loginForm) loginForm.onsubmit = handleAdminLogin;
    if (mfaForm) mfaForm.onsubmit = handleMFAChallengeSubmit;
    if (mfaSetupForm) mfaSetupForm.onsubmit = handleMFAEnrollmentVerification;
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
  window.location.hash = "#/dashboard";
}

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

  window.location.hash = "#/dashboard";
}

// --- Public Client Facing Showcase Render Grid ---
async function renderPublicProjectsHomeGrid() {
  const gridContainer = document.getElementById("public-projects-grid");
  if (!gridContainer) return;

  const { data: projectList, error } = await supabase
    .from("projects")
    .select("title, slug, created_at, cover_image_url, description, tags")
    .order("created_at", { ascending: false });

  if (error || !projectList || projectList.length === 0) {
    gridContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">No published projects found inside database.</p>`;
    return;
  }

  // Clear any existing textual content or placeholders before rendering nodes
  gridContainer.innerHTML = "";

  // Sequentially await and append each high-fidelity client card DOM node
  for (const project of projectList) {
    const clientCardNode = await ProjectCard.renderClientCard(project);
    gridContainer.appendChild(clientCardNode);
  }
}

// --- Live Project Page Render / Materializer ---
async function loadAndMaterializeProjectLayout() {
  const viewport = document.getElementById("app-viewport");
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const slug = urlParams.get("slug");

  if (!slug) {
    viewport.innerHTML = `<div class="page-container"><h1>Missing Project Target</h1></div>`;
    return;
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .limit(1);

  if (error || !projects || projects.length === 0) {
    viewport.innerHTML = `<div class="page-container"><h1>Project Not Found</h1></div>`;
    return;
  }

  const currentProject = projects[0];
  let structuralHTMLOutput = `
    <div class="live-project-frame" style="max-width: 1000px; margin: 4rem auto; padding: 0 1.5rem; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 4rem;">
        <a href="#/" style="color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500; transition: color 0.2s; width: max-content;">← Back to Projects Catalog</a>
  `;

  currentProject.layout_data.forEach((block) => {
    if (block.type === "hero") {
      structuralHTMLOutput += `
        <section style="max-width: 800px; margin: 0 auto; width: 100%;">
            <h1 style="font-size: 3.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; line-height: 1.1; letter-spacing: -0.04em;">${block.content.heading}</h1>
            <p style="font-size: 1.35rem; color: var(--text-secondary); line-height: 1.6; font-weight: 400; letter-spacing: -0.01em;">${block.content.subheading}</p>
        </section>
      `;
    } else if (block.type === "text-block") {
      structuralHTMLOutput += `
        <section style="max-width: 680px; margin: 0 auto; width: 100%;">
            <p style="font-size: 1.1rem; line-height: 1.85; color: var(--text-primary); white-space: pre-wrap; letter-spacing: -0.005em; text-align: justify;">${block.content.body}</p>
        </section>
      `;
    } else if (block.type === "image-grid") {
      structuralHTMLOutput += `
        <section style="max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; width: 100%;">
            <div style="background: var(--bg-surface); border: 1px solid var(--border); aspect-ratio: 16/10; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-weight: 500; font-size: 0.9rem;">膜️ Primary Presentation Asset</div>
            <div style="background: var(--bg-surface); border: 1px solid var(--border); aspect-ratio: 10/12; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-weight: 500; font-size: 0.9rem;">📸 Context / Detail View</div>
        </section>
      `;
    }
  });

  structuralHTMLOutput += `</div>`;
  viewport.innerHTML = structuralHTMLOutput;
}
