// js/components/navbar.js
import { createButton } from "./button.js";

// Renders the standard global navbar used across public grid discovery and subviews.

export function renderGlobalNavbar() {
  // Convert our Admin Button instance into an outer HTML string payload with routing execution
  const adminBtnHtml = createButton({
    text: "Admin Panel",
    variant: "secondary",
    className: "admin-btn",
    attributes: {
      // Forces the browser's address hash location to swap instantly on click
      onclick: "window.location.hash = '#/admin';",
    },
  }).outerHTML;

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
      ${adminBtnHtml}
    </nav>
  `;
}

/**
 * Renders the specialized workspace header for editing, isolated from standard routing leaks.
 */
export function renderWorkspaceHeader() {
  // 1. Structural Back Navigation Trigger
  const exitBtnHtml = createButton({
    text: "← Exit Workspace",
    variant: "ghost",
    id: "back-to-dash-btn",
    className: "control-back-btn",
  }).outerHTML;

  // 2. Multi-Action Utilities Toolbar (Preview, Save Draft, Publish Layout)
  const previewBtnHtml = createButton({
    text: "👁️ Preview",
    variant: "accent",
    id: "preview-project-btn",
  }).outerHTML;

  const saveDraftBtnHtml = createButton({
    text: "💾 Save Draft",
    variant: "secondary",
    id: "save-draft-btn",
  }).outerHTML;

  const publishBtnHtml = createButton({
    text: "🚀 Publish",
    variant: "primary",
    id: "save-project-btn", // Kept for synchronization targeting
    className: "btn-commit-action",
  }).outerHTML;

  return `
    <header class="workspace-header-element">
      <div class="nav-meta-block">
        ${exitBtnHtml}
        <h1 class="workspace-title">Project Workspace</h1>
      </div>
      <div class="action-meta-block" style="display: flex; gap: 0.75rem; align-items: center;">
        ${previewBtnHtml}
        ${saveDraftBtnHtml}
        ${publishBtnHtml}
      </div>
    </header>
  `;
}
