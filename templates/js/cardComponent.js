// js/cardComponent.js

let templatesDocument = null;

/**
 * Pre-fetches and compiles the external HTML templates configuration file once.
 */
async function loadCardTemplates() {
  if (templatesDocument) return; // Guard caching reuse optimize logic
  try {
    const response = await fetch("../templates/cardComponent.html");
    if (!response.ok)
      throw new Error(`Template markup asset missing: ${response.status}`);
    const textContent = await response.text();

    // Parse raw string text into an accessible isolated DOM Document context tree
    const parser = new DOMParser();
    templatesDocument = parser.parseFromString(textContent, "text/html");
  } catch (err) {
    console.error("Card template materialization cluster fault:", err);
  }
}

export const ProjectCard = {
  // Public Client Portfolio Element Factory Node Vector
  async renderClientCard(project) {
    await loadCardTemplates();
    const template = templatesDocument?.getElementById("client-card-template");
    if (!template) return document.createElement("div");

    // Clone the document fragment node structure safely
    const clone = template.content.cloneNode(true);
    const wrapper = clone.querySelector(".project-card");

    // Populate text details and interactive route tokens safely
    wrapper.querySelector(".card-title").textContent = project.title;
    wrapper.querySelector(".card-date").textContent =
      `Published: ${new Date(project.created_at).toLocaleDateString()}`;
    wrapper.setAttribute(
      "onclick",
      `window.location.hash = '#/view-project?slug=${project.slug}'`,
    );

    return wrapper;
  },

  // Administrative Space Control Element Factory Node Vector
  async renderAdminCard(project) {
    await loadCardTemplates();
    const template = templatesDocument?.getElementById("admin-card-template");
    if (!template) return document.createElement("div");

    const clone = template.content.cloneNode(true);
    const wrapper = clone.querySelector(".admin-card");

    // Map textual and contextual attribute details onto the live clone element
    wrapper.querySelector(".card-title").textContent = project.title;
    wrapper.querySelector(".card-slug").textContent = `/${project.slug}`;
    wrapper.querySelector(".btn-edit").setAttribute("data-id", project.id);
    wrapper.querySelector(".btn-delete").setAttribute("data-id", project.id);

    return wrapper;
  },
};
