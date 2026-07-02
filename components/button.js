/**
 * Button Component
 * Creates a reusable button element with primary, secondary, and ghost variants
 *
 * @param {Object} props - Button properties
 * @param {string} props.text - Button text content
 * @param {string} props.variant - Button style: 'primary' | 'secondary' | 'ghost' (default: 'primary')
 * @param {string} props.type - Button type: 'button' | 'submit' | 'reset' (default: 'button')
 * @param {string} props.id - Optional button ID
 * @param {boolean} props.disabled - Whether button is disabled (default: false)
 * @param {string} props.ariaLabel - Accessibility label
 * @param {Object} props.dataAttributes - Object of data attributes to add
 * @param {Function} props.onClick - Click handler function
 * @param {string} props.className - Additional CSS classes
 * @returns {HTMLButtonElement} Button element
 */
function createButton(props = {}) {
  const {
    text = "Button",
    variant = "primary",
    type = "button",
    id = "",
    disabled = false,
    ariaLabel = "",
    dataAttributes = {},
    onClick = null,
    className = "",
  } = props;

  const button = document.createElement("button");
  button.className = `btn btn-${variant}${className ? " " + className : ""}`;
  button.type = type;
  button.textContent = text;

  if (id) button.id = id;
  if (disabled) button.disabled = true;
  if (ariaLabel) button.setAttribute("aria-label", ariaLabel);

  // Add data attributes
  Object.entries(dataAttributes).forEach(([key, value]) => {
    button.setAttribute(`data-${key}`, value);
  });

  // Add click handler
  if (onClick && typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }

  return button;
}

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { createButton };
}
