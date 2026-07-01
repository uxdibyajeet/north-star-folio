// js/components/navbar.js

/**
 * Renders the standard global navbar used across public grid discovery and subviews.
 */
export function renderGlobalNavbar() {
  return `
    <nav class="navbar">
      <div class="logo">
        <a href="#/" class="nav-item">
          <img src="public/logo.svg" alt="logo" />
        </a>
      </div>
      <div class="nav-links">
        <a href="#/" class="nav-item">Home</a>
        <a href="#/" class="nav-item">Projects</a>
        <a href="#/about" class="nav-item">About</a>
      </div>
      <a href="#/admin" class="nav-item admin-btn">Admin Panel</a>
    </nav>
  `;
}

/**
 * Renders the specialized workspace header for editing, isolated from standard routing leaks.
 */
export function renderWorkspaceHeader() {
  return `
    <header class="workspace-header-element">
      <div class="nav-meta-block">
        <button id="back-to-dash-btn" class="control-back-btn">
          ← Exit Workspace
        </button>
        <h1 class="workspace-title">Project Workspace</h1>
      </div>
      <div class="action-meta-block">
        <button id="save-project-btn" class="btn-commit-action">Sync Changes</button>
      </div>
    </header>
  `;
}
