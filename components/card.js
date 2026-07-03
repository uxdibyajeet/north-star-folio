/**
 * Reusable Card Component
 * Renders 'home' and 'dashboard' variations safely.
 */
function createCard(props = {}) {
  const {
    variant = "dashboard",
    data = {},
    onEdit = null,
    onDelete = null,
    onView = null,
  } = props;

  const card = document.createElement("article");
  card.className = `card card-${variant}`;

  // Clean, modern semantic layout
  const coverHtml = data.cover_image
    ? `<div class="card-image-wrapper">
         <img src="${escapeHtml(data.cover_image)}" alt="${escapeHtml(data.title)} Cover" class="card-image" loading="lazy" />
       </div>`
    : "";

  const statusLabel = data.status === "publish" ? "Live" : "Draft";
  const statusBackground =
    data.status === "publish"
      ? "oklch(0.85 0.1 140)"
      : "var(--surface-primary)";
  const statusTextColor =
    data.status === "publish" ? "oklch(0.3 0.1 140)" : "var(--text-secondary)";

  card.innerHTML = `
    ${coverHtml}
    <div class="card-content">
      <h3 class="card-title">${escapeHtml(data.title)}</h3>
      <p class="card-description">${escapeHtml(data.description || "No project description provided.")}</p>
      <div class="card-footer">
        <div class="card-tags">
          <span class="card-tag" style="background: ${statusBackground}; color: ${statusTextColor}; border: 1px solid var(--border-color);">
            ${statusLabel}
          </span>
          <span class="card-tag">${(data.status || "").toUpperCase()}</span>
        </div>
        ${variant === "dashboard" ? '<div class="card-actions"></div>' : ""}
      </div>
    </div>
  `;

  // Attach Variant-Specific Event Interactions
  if (variant === "dashboard") {
    const actionsContainer = card.querySelector(".card-actions");

    // Explicitly handle Admin-only Delete Button
    if (actionsContainer && typeof createButton === "function") {
      const deleteBtn = createButton({
        text: "Delete",
        variant: "secondary",
        className: "card-delete-btn",
        onClick: (e) => {
          e.stopPropagation(); // Avoid triggering card selection/edit redirect
          if (onDelete) onDelete(data.id);
        },
      });
      actionsContainer.appendChild(deleteBtn);
    } else if (actionsContainer) {
      // Fallback native button if UI library helper is missing
      actionsContainer.innerHTML = `<button class="btn btn-secondary card-delete-btn">Delete</button>`;
      actionsContainer
        .querySelector(".card-delete-btn")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          if (onDelete) onDelete(data.id);
        });
    }

    // Admin click handles editing
    card.addEventListener("click", () => {
      if (onEdit) onEdit(data);
    });
  } else if (variant === "home") {
    // Client side: click directly links/views the project detail page
    card.addEventListener("click", () => {
      if (onView) onView(data);
    });
  }

  return card;
}

/**
 * Escapes characters to prevent breaking strings or introducing simple XSS vectors
 */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Global scope export compatibility
if (typeof window !== "undefined") {
  window.createCard = createCard;
}
