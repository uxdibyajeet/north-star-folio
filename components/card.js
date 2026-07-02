/**
 * Card Component
 * Creates reusable card elements with dashboard and home variants
 *
 * @param {Object} props - Card properties
 * @param {string} props.variant - Card type: 'dashboard' | 'home' (default: 'dashboard')
 * @param {Object} props.data - Card data object
 * @param {string} props.data.id - Project ID
 * @param {string} props.data.title - Project title
 * @param {string} props.data.description - Project description
 * @param {string} props.data.cover_image - Cover image URL
 * @param {string} props.data.status - Project status (publish/draft)
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onDelete - Callback for delete action
 * @param {Function} props.onView - Callback for view action
 * @returns {HTMLElement} Card element
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
  card.style.cursor = "pointer";
  card.style.transition = "transform 0.2s ease, border-color 0.2s ease";

  // Cover image
  const coverHtml = data.cover_image
    ? `<div class="card-image-wrapper">
         <img src="${escapeHtml(data.cover_image)}" alt="${escapeHtml(data.title)} Banner" class="card-image" />
       </div>`
    : "";

  // Status label
  const statusLabel = data.status === "publish" ? "Live" : "Draft";
  const statusBackground =
    data.status === "publish"
      ? "oklch(0.85 0.1 140)"
      : "var(--surface-primary)";
  const statusTextColor =
    data.status === "publish" ? "oklch(0.3 0.1 140)" : "var(--text-secondary)";

  // Card content
  const content = `
    ${coverHtml}
    <div class="card-content">
      <h3 class="card-title">${escapeHtml(data.title)}</h3>
      <p class="card-description">${escapeHtml(data.description || "No project description provided.")}</p>
      <div class="card-footer">
        <div class="card-tags">
          <span class="card-tag">${statusLabel}</span>
          <span class="card-tag" style="background: ${statusBackground}; color: ${statusTextColor}; border: 1px solid var(--border-color);">${(data.status || "").toUpperCase()}</span>
        </div>
        ${variant === "dashboard" ? '<div class="card-actions"></div>' : ""}
      </div>
    </div>
  `;

  card.innerHTML = content;

  // Add hover effects
  card.addEventListener("mouseenter", () => {
    card.style.borderColor = "var(--text-primary)";
    card.style.transform = "translateY(-2px)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.borderColor = "var(--border-color)";
    card.style.transform = "translateY(0)";
  });

  // Add variant-specific handlers
  if (variant === "dashboard") {
    // Dashboard variant: edit on click, delete button
    const actionsContainer = card.querySelector(".card-actions");

    const deleteBtn = createButton({
      text: "Delete",
      variant: "secondary",
      className: "card-delete-btn",
      onClick: (e) => {
        e.stopPropagation();
        if (onDelete && typeof onDelete === "function") {
          onDelete(data.id);
        }
      },
    });
    actionsContainer.appendChild(deleteBtn);

    card.addEventListener("click", () => {
      if (onEdit && typeof onEdit === "function") {
        onEdit(data);
      }
    });
  } else if (variant === "home") {
    // Home variant: view/navigate on click
    card.addEventListener("click", () => {
      if (onView && typeof onView === "function") {
        onView(data);
      }
    });
  }

  return card;
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { createCard };
}
