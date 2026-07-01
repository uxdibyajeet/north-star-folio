// --- Supabase Config Setup ---
const SUPABASE_URL = "https://xgfxdxuogerkeqcdiucj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JPTKGfDNwKFM7dH6KP5I9w_-UjGFj1H";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const routes = {
  "#/": "./templates/home.html",
  "#/about": "./templates/about.html",
  "#/projects": "./templates/projects.html",
  "#/admin": "./templates/admin.html",
};

// State tracker variable to remember if we are updating a card row or inserting a new one
window.activeEditingProjectId = null;

// --- SPA Router Core Engine ---
async function router() {
  const viewport = document.getElementById("app-viewport");
  const rawHash = window.location.hash || "#/";

  const currentHash = rawHash.startsWith("#/view-project")
    ? "#/view-project"
    : rawHash;

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
  } else if (hash === "#/admin") {
    const loginForm = document.getElementById("login-form");
    const mfaForm = document.getElementById("mfa-form");
    const mfaSetupForm = document.getElementById("mfa-setup-form");

    if (loginForm) loginForm.onsubmit = handleAdminLogin;
    if (mfaForm) mfaForm.onsubmit = handleMFAChallengeSubmit;
    if (mfaSetupForm) mfaSetupForm.onsubmit = handleMFAEnrollmentVerification;
  } else if (hash === "#/projects") {
    // Feature 2: Bootstrap Administrative Dashboard View Panel instead of direct blank canvas creation
    renderAdminDashboardCatalog();
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

// --- Admin Dashboard State Controller Orchestration Hub ---
async function renderAdminDashboardCatalog() {
  window.activeEditingProjectId = null; // Clean active track state pointer
  const gridContainer = document.getElementById("admin-projects-list-grid");
  const addCta = document.getElementById("add-new-project-cta");

  if (!gridContainer) return;

  if (addCta) addCta.onclick = () => toggleEditorViewsVisibility(true);

  const { data: list, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !list || list.length === 0) {
    gridContainer.innerHTML = `<p style="color:var(--text-secondary); grid-column:1/-1;">No layout instances built yet. Go ahead and craft one, Sir!</p>`;
    return;
  }

  gridContainer.innerHTML = list
    .map(
      (project) => `
        <div class="admin-card" style="background: var(--bg-surface); border: 1px solid var(--border); padding: 1.5rem; border-radius: 8px; display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <h3 style="font-size: 1.2rem; color: white; margin-bottom:0.25rem;">${project.title}</h3>
                <span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-dark); padding: 0.25rem 0.5rem; border-radius: 4px;">/${project.slug}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border);">
                <button onclick="triggerProjectEditFlow('${project.id}')" style="flex:1; padding:0.5rem; background: var(--bg-dark); border:1px solid var(--border); color:white; border-radius:4px; font-weight:600; cursor:pointer;">Edit</button>
                <button onclick="triggerProjectDeleteFlow('${project.id}')" style="padding:0.5rem; background: rgba(239,68,68,0.1); border:1px solid #ef4444; color:#ef4444; border-radius:4px; cursor:pointer;">Delete</button>
            </div>
        </div>
    `,
    )
    .join("");
}

// Global action vectors mapped onto window runtime space explicitly for dynamic layout string event mappings
window.triggerProjectEditFlow = async function (id) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    alert("Could not pull project details loop data.");
    return;
  }

  // Toggle viewport presentation layers
  toggleEditorViewsVisibility(true);
  window.activeEditingProjectId = id;

  // Repopulate title inputs values
  document.getElementById("project-title-input").value = data.title;

  const canvas = document.getElementById("builder-canvas");
  const placeholder = document.getElementById("canvas-placeholder");
  if (placeholder) placeholder.style.display = "none";

  // Wipe default container rows and rematerialize existing saved tokens blocks
  const activeRows = canvas.querySelectorAll(".canvas-row");
  activeRows.forEach((r) => r.remove());

  data.layout_data.forEach((block) => {
    const domNode = generateCanvasElementNode(block.type);

    if (block.type === "hero") {
      domNode.querySelector("h2").innerText = block.content.heading;
      domNode.querySelector("p").innerText = block.content.subheading;
    } else if (block.type === "text-block") {
      domNode.querySelector("p").innerText = block.content.body;
    }
    canvas.appendChild(domNode);
  });
};

window.triggerProjectDeleteFlow = async function (id) {
  if (
    !confirm(
      "Are you completely sure you want to delete this project, Sir? This cannot be undone.",
    )
  )
    return;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) alert("Deletion processing breakdown: " + error.message);
  else renderAdminDashboardCatalog();
};

function toggleEditorViewsVisibility(showEditor) {
  const dashView = document.getElementById("admin-dashboard-view");
  const editorView = document.getElementById("canvas-editor-view");
  const backBtn = document.getElementById("back-to-dash-btn");

  if (showEditor) {
    dashView.style.display = "none";
    editorView.style.display = "block";
    initPageBuilderEngine();
    if (backBtn) backBtn.onclick = () => toggleEditorViewsVisibility(false);
  } else {
    dashView.style.display = "block";
    editorView.style.display = "none";
    renderAdminDashboardCatalog();
  }
}

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
  window.location.hash = "#/projects";
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

  window.location.hash = "#/projects";
}

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

  let queryPayload;
  if (window.activeEditingProjectId) {
    // IF UPDATE: Modify existing entry row data contract
    queryPayload = await supabase
      .from("projects")
      .update({ title: titleInput, slug: slug, layout_data: serializedLayout })
      .eq("id", window.activeEditingProjectId);
  } else {
    // IF NEW: Run standard record insert
    queryPayload = await supabase
      .from("projects")
      .insert([
        { title: titleInput, slug: slug, layout_data: serializedLayout },
      ]);
  }

  if (queryPayload.error) {
    alert("Sync pipeline error: " + queryPayload.error.message);
  } else {
    alert("Project layout successfully synchronized to Supabase!");
    toggleEditorViewsVisibility(false); // Send straight back to dashboard list index
  }
}

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

async function renderPublicProjectsHomeGrid() {
  const gridContainer = document.getElementById("public-projects-grid");
  if (!gridContainer) return;

  const { data: projectList, error } = await supabase
    .from("projects")
    .select("title, slug, created_at")
    .order("created_at", { ascending: false });
  if (error || !projectList || projectList.length === 0) {
    gridContainer.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">No published projects found inside database.</p>`;
    return;
  }

  gridContainer.innerHTML = projectList
    .map(
      (project) => `
        <div class="project-card" style="background: var(--bg-surface); padding: 1.75rem; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';" onclick="window.location.hash = '#/view-project?slug=${project.slug}'">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem; color: var(--text-primary);">${project.title}</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">Published: ${new Date(project.created_at).toLocaleDateString()}</p>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--accent); font-weight: 500; display: flex; align-items: center; gap: 0.25rem;">View Case Study <span>→</span></div>
        </div>
    `,
    )
    .join("");
}

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
        <div class="live-project-frame" style="max-width: 900px; margin: 3rem auto; padding: 0 1.5rem;">
            <a href="#/" style="color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem;">← Back to Projects Catalog</a>
    `;

  currentProject.layout_data.forEach((block) => {
    if (block.type === "hero") {
      structuralHTMLOutput += `
                <section style="margin-bottom: 3.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border);">
                    <h1 style="font-size: 2.75rem; color: var(--text-primary); margin-bottom: 1rem; line-height: 1.2;">${block.content.heading}</h1>
                    <p style="font-size: 1.25rem; color: var(--text-secondary); line-height: 1.5;">${block.content.subheading}</p>
                </section>
            `;
    } else if (block.type === "text-block") {
      structuralHTMLOutput += `
                <section style="margin-bottom: 2.5rem;">
                    <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-primary); white-space: pre-wrap;">${block.content.body}</p>
                </section>
            `;
    } else if (block.type === "image-grid") {
      structuralHTMLOutput += `
                <section style="margin-bottom: 3rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); aspect-ratio: 16/10; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">🖼️ Portfolio Presentation Asset Alpha</div>
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); aspect-ratio: 16/10; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">🖼️ Portfolio Presentation Asset Beta</div>
                </section>
            `;
    }
  });

  structuralHTMLOutput += `</div>`;
  viewport.innerHTML = structuralHTMLOutput;
}
