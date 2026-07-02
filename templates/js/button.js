// js/components/button.js

/**
 * Generates a scalable, reusable button element tailored to the system design language.
 *
 * @param {Object} config - Configuration mapping for the button architecture
 * @param {string} config.text - The inner text or HTML/icon string (e.g., '💾 Save Changes' or '✕')
 * @param {'primary' | 'secondary' | 'accent' | 'fab' | 'danger' | 'ghost'} [config.variant] - Visual hierarchy variant
 * @param {string} [config.id] - Optional unique DOM identity token
 * @param {string} [config.className] - Optional extra utility style classes
 * @param {Object} [config.attributes] - Optional key/value pairs for native HTML attributes (e.g., { title: "Publish layout" })
 * @param {Function} [config.onClick] - Click execution callback event listener
 * @returns {HTMLButtonElement} - The fully compiled interactive DOM node
 */
export function createButton({
  text,
  variant = "primary",
  id,
  className = "",
  attributes = {},
  onClick,
}) {
  const button = document.createElement("button");

  // 1. Setup identifiers and polymorphic styling boundaries
  if (id) button.id = id;
  button.className = `ds-btn btn-${variant} ${className}`.trim();

  // 2. Safely populate layout content (supports text + emoji/SVG string graphics)
  button.innerHTML = text;

  // 3. Bind native dynamic attributes (disabled status, datasets, titles)
  Object.entries(attributes).forEach(([key, value]) => {
    button.setAttribute(key, value);
  });

  // 4. Attach context execution handler
  if (onClick && typeof onClick === "function") {
    button.onclick = (e) => {
      // Prevent unintended form submissions or native bubbling if nested
      if (attributes.type !== "submit") e.preventDefault();
      onClick(e);
    };
  }

  return button;
}
