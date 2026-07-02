// js/dashboard.js

function initDynamicDashboard() {
  const projectGrid = document.getElementById("dynamic-project-grid");
  if (!projectGrid) return;

  const sb = window.supabaseClient;
  if (!sb) {
    projectGrid.innerHTML = `<p class="helper-text" style="grid-column: 1 / -1; color: var(--text-primary);">Supabase client configuration missing.</p>`;
    return;
  }

  async function fetchAndRenderProjects() {
    const { data: projects, error } = await sb
      .from("portfolio_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving dashboard projects:", error);
      projectGrid.innerHTML = `<p class="helper-text" style="grid-column: 1 / -1; color: oklch(0.4 0.15 25);">Failed to fetch data updates: ${error.message}</p>`;
      return;
    }

    if (!projects || projects.length === 0) {
      projectGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; border: 1px dashed var(--border-color); border-radius: 1rem; background: var(--surface-secondary);">
          <p class="helper-text" style="margin-bottom: 1rem;">No portfolio projects found in your database yet.</p>
          <a class="primary-btn" href="#/admin/dashboard/new" data-route="/admin/dashboard/new" style="font-size: 0.9rem; padding: 0.6rem 1.2rem;">Create Your First Project</a>
        </div>
      `;
      return;
    }

    projectGrid.innerHTML = "";

    projects.forEach((project) => {
      const card = document.createElement("article");
      card.className = "project-card";
      card.style.cursor = "pointer";
      card.style.transition = "transform 0.2s ease, border-color 0.2s ease";

      card.addEventListener("mouseenter", () => {
        card.style.borderColor = "var(--text-primary)";
        card.style.transform = "translateY(-2px)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.borderColor = "var(--border-color)";
        card.style.transform = "translateY(0)";
      });

      const coverHtml = project.cover_image
        ? `<div style="width: 100%; height: 160px; overflow: hidden; border-radius: 0.5rem; margin-bottom: 1rem; background: var(--surface-primary);">
             <img src="${project.cover_image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${project.title} Banner" onerror="this.parentElement.style.display='none';" />
           </div>`
        : "";

      const statusLabel = project.status === "publish" ? "Live" : "Draft";
      const statusBackground =
        project.status === "publish"
          ? "oklch(0.85 0.1 140)"
          : "var(--surface-primary)";
      const statusTextColor =
        project.status === "publish"
          ? "oklch(0.3 0.1 140)"
          : "var(--text-secondary)";

      card.innerHTML = `
        ${coverHtml}
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description || "No project description provided.")}</p>
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: auto;">
          <span class="project-tag">${statusLabel}</span>
          <span class="project-tag" style="background: ${statusBackground}; color: ${statusTextColor}; border: 1px solid var(--border-color);">${project.status.toUpperCase()}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        window.currentEditingProjectId = project.id;
        window.canvasBlocks = project.canvas_blocks || [];
        window.activeProjectMetadata = {
          title: project.title,
          description: project.description,
          cover_image: project.cover_image,
        };

        localStorage.setItem("currentEditingProjectId", project.id);
        localStorage.setItem(
          "activeCanvasBlocksBackup",
          JSON.stringify(project.canvas_blocks || []),
        );
        localStorage.setItem(
          "activeProjectMetadata",
          JSON.stringify(window.activeProjectMetadata),
        );

        window.editorRuntimeInitialized = false;
        window.location.hash = "/admin/dashboard/new";
      });

      projectGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  fetchAndRenderProjects();
}

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest('a[href="#/admin/dashboard/new"]');
  if (addBtn) {
    if (
      window.currentEditingProjectId ||
      localStorage.getItem("currentEditingProjectId")
    ) {
      return;
    }

    localStorage.removeItem("currentEditingProjectId");
    localStorage.removeItem("activeCanvasBlocksBackup");
    localStorage.removeItem("activeProjectMetadata");

    window.currentEditingProjectId = null;
    window.activeProjectMetadata = null;
    window.canvasBlocks = [
      {
        id: "block-1",
        type: "heading",
        level: "h2",
        content: "Design Strategy & Deep Discovery Phase",
        order: 0,
        children: [],
      },
      {
        id: "block-2",
        type: "paragraph",
        variant: "normal",
        content:
          "We conducted extensive multi-stage stakeholder workshops and contextual inquiries to map out user interactions across new application surfaces.",
        order: 1,
        children: [],
      },
    ];
    localStorage.setItem(
      "activeCanvasBlocksBackup",
      JSON.stringify(window.canvasBlocks),
    );
    window.editorRuntimeInitialized = false;
  }
});

window.addEventListener("hashchange", () => {
  setTimeout(initDynamicDashboard, 80);
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initDynamicDashboard, 80);
});
