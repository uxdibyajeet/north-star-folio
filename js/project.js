// js/project.js

function initProjectDetailViewer() {
  const canvasTarget = document.getElementById("project-canvas-view");
  if (!canvasTarget) return;

  const titleNode = document.getElementById("view-project-title");
  const descNode = document.getElementById("view-project-desc");
  const coverFrame = document.getElementById("view-project-cover-frame");
  const coverImg = document.getElementById("view-project-cover-img");

  // Step 1: Attempt to read cached data passed over from card interaction click
  let cachedData = null;
  try {
    const rawCache = sessionStorage.getItem("viewedProjectData");
    if (rawCache) cachedData = JSON.parse(rawCache);
  } catch (err) {
    console.error("Failed to parse sessionStorage payload context:", err);
  }

  // Extract ID from routing state path hash context (#/project/uuid-goes-here)
  const explicitId = window.location.hash.split("/project/")[1];

  if (cachedData && cachedData.id === explicitId) {
    renderCompleteProjectView(cachedData);
  } else if (explicitId) {
    // Step 2: Fallback to direct client network fetch if accessed via deep-link bookmark
    fetchProjectFromDatabase(explicitId);
  } else {
    renderErrorView(
      "No valid project identifier specifiers matching this view path route.",
    );
  }

  async function fetchProjectFromDatabase(id) {
    const sb = window.supabaseClient;
    if (!sb) {
      renderErrorView(
        "Supabase client core configuration targets are missing mapping keys.",
      );
      return;
    }

    try {
      const { data: project, error } = await sb
        .from("portfolio_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !project) {
        console.error("Supabase content download crash:", error);
        renderErrorView(
          "The requested portfolio case study could not be sourced.",
        );
        return;
      }

      renderCompleteProjectView(project);
    } catch (err) {
      console.error("Unexpected network handling exception loop:", err);
      renderErrorView(
        "An unexpected communication error blocked content extraction processing pipelines.",
      );
    }
  }

  function renderCompleteProjectView(project) {
    // Render Metadata Elements
    if (titleNode) titleNode.textContent = project.title || "Untitled Project";
    if (descNode) descNode.textContent = project.description || "";

    if (coverFrame && coverImg && project.cover_image) {
      coverImg.src = project.cover_image;
      coverFrame.style.display = "block";
    }

    // Process Layout Blocks
    const designBlocks = project.canvas_blocks || [];
    canvasTarget.innerHTML = "";

    if (designBlocks.length === 0) {
      canvasTarget.innerHTML = `<p class="helper-text" style="font-style: italic; color: var(--text-secondary);">This case study document composition is completely empty.</p>`;
      return;
    }

    // Sort block tree arrays sequentially exactly as handled in the editor interface
    const sortedBlocks = [...designBlocks].sort((a, b) => a.order - b.order);
    canvasTarget.appendChild(compileBlocksToHtmlFragment(sortedBlocks));
  }

  /**
   * Translates editor JSON nodes into safe semantic DOM structures[cite: 14]
   */
  function compileBlocksToHtmlFragment(blocks) {
    const layerFragment = document.createDocumentFragment();

    blocks.forEach((block) => {
      const elementWrapper = document.createElement("div");
      elementWrapper.className = `view-block-wrapper block-type-${block.type}`;
      elementWrapper.style.marginBottom = "2rem";

      if (block.type === "heading") {
        const headerTag = block.level || "h2";
        const headingElement = document.createElement(headerTag);
        headingElement.className = "view-heading-element";
        headingElement.style.color = "var(--text-primary)";
        headingElement.textContent = block.content;
        elementWrapper.appendChild(headingElement);
      } else if (block.type === "paragraph") {
        const textElement = document.createElement("p");
        textElement.className =
          block.variant === "caption"
            ? "view-text-element is-caption"
            : "view-text-element";
        if (block.variant === "caption") textElement.style.fontStyle = "italic";
        textElement.style.lineHeight = "1.7";
        textElement.style.color = "var(--text-secondary)";
        textElement.textContent = block.content;
        elementWrapper.appendChild(textElement);
      } else if (block.type === "image") {
        if (block.content) {
          const imageElement = document.createElement("img");
          imageElement.className = "view-image-element";
          imageElement.src = block.content;
          imageElement.alt =
            "Portfolio Case Study Visual Asset Documentation Reference";
          imageElement.style.width = "100%";
          imageElement.style.borderRadius = "0.5rem";
          imageElement.style.display = "block";
          elementWrapper.appendChild(imageElement);
        }
      } else if (block.type === "container") {
        const gridWrapper = document.createElement("div");
        gridWrapper.className = "view-layout-grid-container";

        const colsCount = block.layout?.columns || 2;
        gridWrapper.style.display = "grid";
        gridWrapper.style.gap = "1.5rem";
        gridWrapper.style.gridTemplateColumns = `repeat(${colsCount}, minmax(0, 1fr))`;

        // Recursive compile loop for child items inside custom columns layout blocks
        if (block.children && block.children.length > 0) {
          const sortedChildren = [...block.children].sort(
            (a, b) => a.order - b.order,
          );
          gridWrapper.appendChild(compileBlocksToHtmlFragment(sortedChildren));
        }
        elementWrapper.appendChild(gridWrapper);
      }

      layerFragment.appendChild(elementWrapper);
    });

    return layerFragment;
  }

  function renderErrorView(message) {
    if (titleNode) titleNode.textContent = "Error Loading Content View";
    if (descNode) descNode.textContent = message;
    if (canvasTarget) canvasTarget.innerHTML = "";
    if (coverFrame) coverFrame.style.display = "none";
  }
}

// Attach listeners matching your layout routing hash change parameters
window.addEventListener("hashchange", () => {
  if (window.location.hash.includes("/project/")) {
    setTimeout(initProjectDetailViewer, 80);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash.includes("/project/")) {
    setTimeout(initProjectDetailViewer, 80);
  }
});
