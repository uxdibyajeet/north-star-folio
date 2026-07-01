// --- Supabase Config Setup ---
const SUPABASE_URL = "https://xgfxdxuogerkeqcdiucj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JPTKGfDNwKFM7dH6KP5I9w_-UjGFj1H";

// Initialize the Supabase client directly
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- View Definitions (Components) ---
const views = {
  "#/": () =>
    `<div class="page-container"><h1>Welcome to My Portfolio</h1><p>This page will showcase live data pulled from Supabase.</p></div>`,
  "#/about": () =>
    `<div class="page-container"><h1>About Me</h1><p>Custom bio content rendered natively via vanilla routing.</p></div>`,
  "#/projects": () =>
    `<div class="page-container"><h1>Projects Studio</h1><p>Grid of static and custom drag-and-drop elements here.</p></div>`,
  "#/admin": () => `
        <div class="page-container" style="max-width: 420px; margin: 4rem auto;">
            <div style="background: var(--bg-surface); padding: 2.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 700;">Admin Console</h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2rem;">Please authenticate to access the builder workspace.</p>
                
                <!-- Email/Password Screen Section -->
                <form id="login-form">
                    <div style="margin-bottom: 1.25rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">EMAIL ADDRESS</label>
                        <input type="email" id="admin-email" required style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.95rem; outline: none; border: 1px solid var(--border);">
                    </div>
                    <div style="margin-bottom: 1.75rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">SECURITY PASSWORD</label>
                        <input type="password" id="admin-password" required style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.95rem; outline: none; border: 1px solid var(--border);">
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer;">Verify Credentials</button>
                </form>

                <!-- Hidden 2FA Verification Challenge Screen Section -->
                <form id="mfa-form" style="display: none;">
                    <div style="margin-bottom: 1.5rem; text-align: center;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-secondary);">ENTER 6-DIGIT AUTHENTICATOR TOKEN</label>
                        <input type="text" id="mfa-token" placeholder="000000" maxlength="6" pattern="[0-9]*" inputmode="numeric" required style="width: 160px; text-align: center; font-size: 1.75rem; letter-spacing: 0.25em; padding: 0.5rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); outline: none;">
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer;">Confirm Token</button>
                </form>

                <div id="auth-error-msg" style="color: #ef4444; font-size: 0.85rem; margin-top: 1rem; text-align: center; display: none;"></div>
            </div>
        </div>`,
};

// --- SPA Router Core Engine ---
function router() {
  const viewport = document.getElementById("app-viewport");
  const currentHash = window.location.hash || "#/";

  const renderView =
    views[currentHash] ||
    (() =>
      `<div class="page-container"><h1>404</h1><p>Page not found.</p></div>`);
  viewport.innerHTML = renderView();

  // Dynamically attach interactive submit event hooks after the DOM content renders
  if (currentHash === "#/admin") {
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleAdminLogin);
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

  // Step 1: Check standard login credentials
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorEl.innerText = error.message;
    errorEl.style.display = "block";
    return;
  }

  // Step 2: Query for active multi-factor configurations
  const { data: factors, error: mfaError } =
    await supabase.auth.mfa.listFactors();

  if (mfaError) {
    errorEl.innerText = mfaError.message;
    errorEl.style.display = "block";
    return;
  }

  const loginForm = document.getElementById("login-form");
  const mfaForm = document.getElementById("mfa-form");

  // If an MFA factor is registered, hide basic auth and invoke token input challenge
  if (factors.all.length > 0) {
    loginForm.style.display = "none";
    mfaForm.style.display = "block";
    window.currentMFAFactorId = factors.all[0].id;
  } else {
    // Direct entry if 2FA hasn't been set up yet
    alert("Logged in! Let's build your 2FA enrollment setup next.");
    window.location.hash = "#/projects";
  }
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
