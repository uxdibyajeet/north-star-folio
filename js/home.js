// js/home.js

function initHomePortfolio() {
  const projectGrid = document.getElementById("portfolio-grid");
  if (!projectGrid) return;

  const sb = window.supabaseClient;
  if (!sb) {
    projectGrid.innerHTML = `<p class="helper-text" style="grid-column: 1 / -1; color: var(--text-primary);">Supabase client configuration missing.</p>`;
    return;
  }

  async function fetchAndRenderProjects() {
    try {
      const { data: projects, error } = await sb
        .from("portfolio_projects")
        .select("*")
        .eq("status", "publish")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error retrieving home projects:", error);
        projectGrid.innerHTML = `<p class="helper-text" style="grid-column: 1 / -1; color: var(--text-secondary);">No projects available at this time.</p>`;
        return;
      }

      if (!projects || projects.length === 0) {
        projectGrid.innerHTML = `
          <p class="helper-text" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 1rem;">
            No published projects yet. Check back soon!
          </p>
        `;
        return;
      }

      projectGrid.innerHTML = "";

      projects.forEach((project) => {
        const card = createCard({
          variant: "home",
          data: project,
          onView: (projectData) => {
            sessionStorage.setItem(
              "viewedProjectData",
              JSON.stringify(projectData),
            );
            window.location.hash = `/project/${projectData.id}`;
          },
        });

        projectGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Unexpected error fetching projects:", err);
      projectGrid.innerHTML = `<p class="helper-text" style="grid-column: 1 / -1; color: var(--text-secondary);">Unable to load projects. Please try again later.</p>`;
    }
  }

  fetchAndRenderProjects();
}

// Expose initialization globally for app.js router entry access points
window.initHomePortfolio = initHomePortfolio;

window.addEventListener("hashchange", () => {
  if (window.location.hash === "/" || window.location.hash === "") {
    initHomePortfolio();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.hash === "/" ||
    window.location.hash === "" ||
    !window.location.hash
  ) {
    initHomePortfolio();
  }
});
