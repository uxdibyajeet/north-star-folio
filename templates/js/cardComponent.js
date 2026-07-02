// js/cardComponent.js
import { createButton } from "./button.js";

let templatesDocument = null;

/**
 * Pre-fetches and compiles the external HTML templates configuration file once.
 */
async function loadCardTemplates() {
  if (templatesDocument) return;
  try {
    const response = await fetch("../templates/cardComponent.html");
    if (!response.ok)
      throw new Error(`Template markup asset missing: ${response.status}`);
    const textContent = await response.text();

    const parser = new DOMParser();
    templatesDocument = parser.parseFromString(textContent, "text/html");
  } catch (err) {
    console.error("Card template materialization cluster fault:", err);
  }
}

/**
 * Helper utility to clear container space and append array elements as text badges safely.
 */
function populateTags(container, tagsArray) {
  if (!container) return;
  container.innerHTML = ""; // Wipe template placeholder nodes

  const tags = Array.isArray(tagsArray) ? tagsArray : [];
  tags.forEach((tagText) => {
    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = tagText;
    container.appendChild(span);
  });
}

export const ProjectCard = {
  // Public Client Portfolio Element Factory Node Vector
  async renderClientCard(project) {
    await loadCardTemplates();
    const template = templatesDocument?.getElementById("client-card-template");
    if (!template) return document.createElement("div");

    const clone = template.content.cloneNode(true);
    const wrapper = clone.querySelector(".project-card");

    // Dynamic Element Mappings
    const coverEl = wrapper.querySelector(".card-cover");
    const titleEl = wrapper.querySelector(".card-title");
    const descEl = wrapper.querySelector(".project-description");
    const dateEl = wrapper.querySelector(".card-date");
    const tagsContainer = wrapper.querySelector(".card-tags-row");

    if (coverEl)
      coverEl.src =
        project.cover_image_url ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200";
    if (titleEl) titleEl.textContent = project.title;
    if (descEl) descEl.textContent = project.description || "";
    if (dateEl)
      dateEl.textContent = `Published: ${new Date(project.created_at).toLocaleDateString()}`;

    populateTags(tagsContainer, project.tags);

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

    // Dynamic Element Mappings
    const coverEl = wrapper.querySelector(".card-cover");
    const titleEl = wrapper.querySelector(".card-title");
    const slugEl = wrapper.querySelector(".card-slug");
    const descEl = wrapper.querySelector(".project-description");
    const dateEl = wrapper.querySelector(".card-date");
    const tagsContainer = wrapper.querySelector(".card-tags-row");
    const footerContainer = wrapper.querySelector(".admin-controls-footer");

    if (coverEl)
      coverEl.src =
        project.cover_image_url ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200";
    if (titleEl) titleEl.textContent = project.title;
    if (slugEl) slugEl.textContent = `/${project.slug}`;
    if (descEl) descEl.textContent = project.description || "";
    if (dateEl)
      dateEl.textContent = `Saved: ${new Date(project.created_at).toLocaleDateString()}`;

    populateTags(tagsContainer, project.tags);

    // Dynamic Polymorphic Button Generation & Mounting
    if (footerContainer) {
      const editBtn = createButton({
        text: "Edit Layout",
        variant: "secondary",
        className: "btn-edit",
        attributes: { "data-action": "edit", "data-id": project.id },
      });

      const deleteBtn = createButton({
        text: "Delete",
        variant: "danger",
        className: "btn-delete",
        attributes: { "data-action": "delete", "data-id": project.id },
      });

      footerContainer.appendChild(editBtn);
      footerContainer.appendChild(deleteBtn);
    }

    return wrapper;
  },
};
