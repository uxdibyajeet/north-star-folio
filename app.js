// --- Supabase Config Setup ---
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
let supabase = null;

if (SUPABASE_URL !== "YOUR_SUPABASE_URL") {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- View Definitions (Mock Components) ---
const views = {
  "#/": () =>
    `<div class="page-container"><h1>Welcome to My Portfolio</h1><p>This page will showcase live data pulled from Supabase.</p></div>`,
  "#/about": () =>
    `<div class="page-container"><h1>About Me</h1><p>Custom bio content rendered natively via vanilla routing.</p></div>`,
  "#/projects": () =>
    `<div class="page-container"><h1>Projects Studio</h1><p>Grid of static and custom drag-and-drop elements here.</p></div>`,
  "#/admin": () => `
        <div class="page-container" style="max-width: 400px; margin: 4rem auto;">
            <h1>Admin Authentication</h1>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Secure entry gateway</p>
            <div style="background: var(--bg-surface); padding: 2rem; border-radius: 8px; border: 1px solid var(--border);">
                <p>MFA & Login panel will lock down this view hook next.</p>
            </div>
        </div>`,
};

// --- SPA Router Core Engine ---
function router() {
  const viewport = document.getElementById("app-viewport");
  const currentHash = window.location.hash || "#/";

  // Fallback handler if path doesn't exist
  const renderView =
    views[currentHash] ||
    (() =>
      `<div class="page-container"><h1>404</h1><p>Page not found.</p></div>`);

  // Inject current views context dynamically into DOM
  viewport.innerHTML = renderView();
}

// Listen for route state navigation shifts
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
