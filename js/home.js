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
      // Fetch only published projects
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
          <p class="helper-text" style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--text-secondary);">
            No published projects yet. Check back soon!
          </p>
        `;
        return;
      }

      projectGrid.innerHTML = "";

      projects.forEach((project) => {
        // Create card using card component with home variant
        const card = createCard({
          variant: "home",
          data: project,
          onView: (projectData) => {
            // Store project data in sessionStorage for the project detail page
            sessionStorage.setItem(
              "viewedProjectData",
              JSON.stringify(projectData),
            );
            // Navigate to project detail page
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

window.addEventListener("hashchange", () => {
  // Reinitialize if navigating back to home
  if (window.location.hash === "/" || window.location.hash === "") {
    setTimeout(initHomePortfolio, 80);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Initialize when DOM is ready if on home page
  if (
    window.location.hash === "/" ||
    window.location.hash === "" ||
    !window.location.hash
  ) {
    setTimeout(initHomePortfolio, 80);
  }
});
