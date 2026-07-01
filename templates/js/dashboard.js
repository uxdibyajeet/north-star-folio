// js/dashboard.js
import { ProjectCard } from "./cardComponent.js";

export async function initDashboard(supabase) {
  const gridContainer = document.getElementById("admin-projects-list-grid");
  const addCta = document.getElementById("add-new-project-cta");

  if (!gridContainer) return;

  // Handle Create CTA click
  if (addCta) {
    addCta.onclick = () => {
      window.location.hash = "#/editor";
    };
  }

  // Pull latest project array indices from Supabase
  const { data: list, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !list || list.length === 0) {
    gridContainer.innerHTML = `<p style="color:var(--text-secondary); grid-column:1/-1;">No layouts built yet. Click Create New Project, Sir!</p>`;
    return;
  }

  // Wipe structural container text placeholders cleanly before appending nodes
  gridContainer.innerHTML = "";

  // Sequentially materialize card fragments asynchronously and append them to the DOM
  for (const project of list) {
    const adminCardNode = await ProjectCard.renderAdminCard(project);
    gridContainer.appendChild(adminCardNode);
  }

  // Bind dynamic event delegated capture to structural elements
  gridContainer.onclick = async (e) => {
    const targetButton = e.target.closest("button");
    if (!targetButton) return;

    const action = targetButton.dataset.action;
    const projectId = targetButton.dataset.id;

    if (action === "edit") {
      window.location.hash = `#/editor?id=${projectId}`;
    } else if (action === "delete") {
      if (
        !confirm("Are you certain you want to erase this layout instance, Sir?")
      )
        return;
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) alert(error.message);
      else initDashboard(supabase); // Refresh layout dashboard panel feed index data
    }
  };
}
