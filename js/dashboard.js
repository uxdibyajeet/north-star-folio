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
          <a class="btn btn-primary" href="#/admin/dashboard/new" data-route="/admin/dashboard/new" style="font-size: 0.9rem; padding: 0.6rem 1.2rem;">Create Your First Project</a>
        </div>
      `;
      return;
    }

    projectGrid.innerHTML = "";

    projects.forEach((project) => {
      // Create card using card component
      const card = createCard({
        variant: "dashboard",
        data: project,
        onEdit: (projectData) => {
          window.currentEditingProjectId = projectData.id;
          window.canvasBlocks = projectData.canvas_blocks || [];
          window.activeProjectMetadata = {
            title: projectData.title,
            description: projectData.description,
            cover_image: projectData.cover_image,
          };

          localStorage.setItem("currentEditingProjectId", projectData.id);
          localStorage.setItem(
            "activeCanvasBlocksBackup",
            JSON.stringify(projectData.canvas_blocks || []),
          );
          localStorage.setItem(
            "activeProjectMetadata",
            JSON.stringify(window.activeProjectMetadata),
          );

          window.editorRuntimeInitialized = false;
          window.location.hash = "/admin/dashboard/new";
        },
        onDelete: (projectId) => {
          deleteProject(projectId);
        },
      });

      projectGrid.appendChild(card);
    });
  }

  async function deleteProject(projectId) {
    // Show confirmation dialog
    const confirmed = confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const { error } = await sb
        .from("portfolio_projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        console.error("Error deleting project:", error);
        alert(`Failed to delete project: ${error.message}`);
        return;
      }

      // Refresh the dashboard
      fetchAndRenderProjects();
    } catch (err) {
      console.error("Unexpected error deleting project:", err);
      alert("An unexpected error occurred while deleting the project.");
    }
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
