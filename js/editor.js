let canvasBlocks = [
  {
    id: "block-1",
    type: "heading",
    level: "h2",
    content: "Design Strategy & Deep Discovery Phase",
    order: 0,
    children: [],
  },
  {
    id: "block-2",
    type: "paragraph",
    variant: "normal",
    content:
      "We conducted extensive multi-stage stakeholder workshops and contextual inquiries to map out user interactions across new application surfaces.",
    order: 1,
    children: [],
  },
];

let draggedType = null;
let draggedBlockId = null;
let selectedBlockId = null;
let editorRuntimeInitialized = false;
let editorRuntimeObserver = null;

function renderEditor() {
  renderCanvas();

  if (selectedBlockId) {
    const activeBlock = findBlockInTree(canvasBlocks, selectedBlockId);
    if (activeBlock) {
      updateFabToolbar(activeBlock);
    } else {
      selectedBlockId = null;
      toggleFabVisibility(false);
    }
  } else {
    toggleFabVisibility(false);
  }
}

function initializeEditorRuntime() {
  if (editorRuntimeInitialized) {
    return;
  }

  const canvas = document.getElementById("document-canvas");
  if (!canvas) {
    return;
  }

  renderEditor();
  initDndEngine();
  initMutationListeners();
  initPreviewEngine();
  initGlobalClickTracker();
  editorRuntimeInitialized = true;

  if (editorRuntimeObserver) {
    editorRuntimeObserver.disconnect();
    editorRuntimeObserver = null;
  }
}

function startEditorRuntimeWatch() {
  if (editorRuntimeObserver) {
    return;
  }

  editorRuntimeObserver = new MutationObserver(() => {
    if (
      !editorRuntimeInitialized &&
      document.getElementById("document-canvas")
    ) {
      initializeEditorRuntime();
    }
  });

  editorRuntimeObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function createBlock(type, content = null) {
  const defaults = {
    heading: "Untitled Section Header",
    paragraph:
      "Provide an insightful overview mapping execution metrics, problem criteria, or core methodology rules applied here.",
    image: "https://images.unsplash.com/photo-1581291518655-9523c932dedf",
    container: "",
  };

  const block = {
    id: `block-${(window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10)).replace(/-/g, "")}`,
    type,
    content: content ?? defaults[type] ?? "",
    order: 0,
    children: [],
  };

  if (type === "heading") {
    block.level = "h2";
  }

  if (type === "paragraph") {
    block.variant = "normal";
  }

  if (type === "container") {
    block.layout = { columns: 2, rows: 2 };
  }

  return block;
}

function updateBlockInTree(blocks, id, updater) {
  return blocks.map((block) => {
    if (block.id === id) {
      return updater(block);
    }

    if (block.type === "container") {
      return {
        ...block,
        children: updateBlockInTree(block.children || [], id, updater),
      };
    }

    return block;
  });
}

function findBlockInTree(blocks, id) {
  for (const block of blocks) {
    if (block.id === id) {
      return block;
    }

    if (block.type === "container") {
      const childBlock = findBlockInTree(block.children || [], id);
      if (childBlock) {
        return childBlock;
      }
    }
  }

  return null;
}

function insertBlockIntoContainer(blocks, containerId, type) {
  return blocks.map((block) => {
    if (block.id === containerId) {
      return {
        ...block,
        children: [...(block.children || []), createBlock(type)],
      };
    }

    if (block.type === "container") {
      return {
        ...block,
        children: insertBlockIntoContainer(
          block.children || [],
          containerId,
          type,
        ),
      };
    }

    return block;
  });
}

function updateContainerLayout(blocks, containerId, nextLayout) {
  return blocks.map((block) => {
    if (block.id === containerId) {
      return {
        ...block,
        layout: {
          columns: nextLayout.columns ?? block.layout?.columns ?? 2,
          rows: nextLayout.rows ?? block.layout?.rows ?? 2,
        },
      };
    }

    if (block.type === "container") {
      return {
        ...block,
        children: updateContainerLayout(
          block.children || [],
          containerId,
          nextLayout,
        ),
      };
    }

    return block;
  });
}

function removeBlockFromTree(blocks, id) {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.type === "container") {
        return {
          ...block,
          children: removeBlockFromTree(block.children || [], id),
        };
      }

      return block;
    });
}

function buildBlockElement(block, depth = 0) {
  const blockWrapper = document.createElement("div");
  blockWrapper.className = "canvas-block-wrapper";
  blockWrapper.setAttribute("draggable", "true");
  blockWrapper.dataset.id = block.id;

  if (selectedBlockId === block.id) {
    blockWrapper.classList.add("is-selected");
  }

  if (depth > 0) {
    blockWrapper.classList.add("canvas-block-wrapper--nested");
  }

  const innerWrapper = document.createElement("div");

  if (block.type === "heading") {
    const tag = block.level || "h2";
    innerWrapper.innerHTML = `<${tag} contenteditable="true" class="canvas-heading" data-id="${block.id}">${block.content}</${tag}>`;
  } else if (block.type === "paragraph") {
    const isCaptionClass = block.variant === "caption" ? "is-caption" : "";
    innerWrapper.innerHTML = `<p contenteditable="true" class="canvas-paragraph ${isCaptionClass}" data-id="${block.id}">${block.content}</p>`;
  } else if (block.type === "image") {
    const imageFrame = document.createElement("div");
    imageFrame.className = "canvas-image-frame";

    const previewShell = document.createElement("div");
    previewShell.className = "canvas-image-preview-shell";

    if (block.content) {
      const previewImage = document.createElement("img");
      previewImage.className = "canvas-image-preview";
      previewImage.src = block.content;
      previewImage.alt = "Case study image";
      previewShell.appendChild(previewImage);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "canvas-image-placeholder";
      placeholder.textContent =
        "Selected image frame. Configure its source URL or upload a file via the bottom FAB panel.";
      previewShell.appendChild(placeholder);
    }

    imageFrame.appendChild(previewShell);
    innerWrapper.appendChild(imageFrame);
  } else if (block.type === "container") {
    const containerShell = document.createElement("div");
    containerShell.className = "canvas-container-shell";

    const childGrid = document.createElement("div");
    childGrid.className = "canvas-container-children";
    const columns = block.layout?.columns ?? 2;
    const rows = block.layout?.rows ?? 2;
    childGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    childGrid.style.gridTemplateRows =
      rows > 1 ? `repeat(${rows}, minmax(0, auto))` : "auto";

    (block.children || []).forEach((childBlock) => {
      childGrid.appendChild(buildBlockElement(childBlock, depth + 1));
    });

    containerShell.appendChild(childGrid);
    innerWrapper.appendChild(containerShell);
  }

  blockWrapper.appendChild(innerWrapper);

  blockWrapper.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectedBlockId = block.id;
    renderEditor();
  });

  blockWrapper.addEventListener("dragstart", (e) => {
    draggedBlockId = block.id;
    blockWrapper.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  blockWrapper.addEventListener("dragend", () => {
    blockWrapper.classList.remove("is-dragging");
    draggedBlockId = null;
    document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());
  });

  return blockWrapper;
}

function renderCanvas() {
  const canvas = document.getElementById("document-canvas");
  if (!canvas) return;
  canvas.innerHTML = "";

  const sorted = [...canvasBlocks].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "canvas-empty-message";
    emptyMsg.textContent =
      "Canvas is empty. Drag layout blocks from the Content Palette inside to begin writing your case study.";
    canvas.appendChild(emptyMsg);
    return;
  }

  const fragment = document.createDocumentFragment();
  sorted.forEach((block) => {
    fragment.appendChild(buildBlockElement(block));
  });

  canvas.appendChild(fragment);
}

function initDndEngine() {
  document.querySelectorAll(".palette-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedType = item.dataset.type;
      e.dataTransfer.effectAllowed = "copy";
    });
    item.addEventListener("dragend", () => {
      draggedType = null;
    });
  });

  const canvas = document.getElementById("document-canvas");
  if (!canvas) return;

  canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getCanvasDropPosition(canvas, e.clientY);

    document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());

    const indicator = document.createElement("div");
    indicator.className = "drop-indicator";

    if (afterElement == null) {
      canvas.appendChild(indicator);
    } else {
      // FIX: Dynamically identify immediate wrapper context instead of breaking DOM hierarchies
      const parentContainer = afterElement.parentNode;
      if (parentContainer) {
        parentContainer.insertBefore(indicator, afterElement);
      }
    }
  });

  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());

    const afterElement = getCanvasDropPosition(canvas, e.clientY);
    let sorted = [...canvasBlocks].sort((a, b) => a.order - b.order);

    if (draggedType) {
      const newBlock = createBlock(draggedType);

      if (afterElement == null) {
        sorted.push(newBlock);
      } else {
        const targetIndex = sorted.findIndex(
          (b) => b.id === afterElement.dataset.id,
        );
        sorted.splice(targetIndex, 0, newBlock);
      }
      selectedBlockId = newBlock.id;
    } else if (draggedBlockId) {
      const sourceIndex = sorted.findIndex((b) => b.id === draggedBlockId);
      const [draggedNode] = sorted.splice(sourceIndex, 1);

      if (afterElement == null) {
        sorted.push(draggedNode);
      } else {
        const targetIndex = sorted.findIndex(
          (b) => b.id === afterElement.dataset.id,
        );
        sorted.splice(targetIndex, 0, draggedNode);
      }
    }

    canvasBlocks = sorted.map((block, idx) => ({ ...block, order: idx }));
    renderEditor();
  });
}

function getCanvasDropPosition(canvas, y) {
  const elements = [
    ...canvas.querySelectorAll(".canvas-block-wrapper:not(.is-dragging)"),
  ];

  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

function initMutationListeners() {
  const canvas = document.getElementById("document-canvas");
  if (!canvas) return;

  canvas.addEventListener("input", (e) => {
    const targetId = e.target.dataset.id;
    if (!targetId) return;

    const targetBlock = findBlockInTree(canvasBlocks, targetId);
    if (!targetBlock) return;

    canvasBlocks = updateBlockInTree(canvasBlocks, targetId, (block) => ({
      ...block,
      content: e.target.innerText,
    }));
  });
}

function initGlobalClickTracker() {
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".canvas-block-wrapper") &&
      !e.target.closest("#canvas-context-fab")
    ) {
      selectedBlockId = null;
      renderEditor();
    }
  });
}

function toggleFabVisibility(visible) {
  const fab = document.getElementById("canvas-context-fab");
  if (!fab) return;
  if (visible) {
    fab.classList.remove("is-hidden");
  } else {
    fab.classList.add("is-hidden");
  }
}

function updateFabToolbar(block) {
  const fab = document.getElementById("canvas-context-fab");
  const actionsZone = document.getElementById("fab-actions-zone");

  if (!fab || !actionsZone) return;

  actionsZone.innerHTML = "";
  toggleFabVisibility(true);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "canvas-inline-btn";
  deleteBtn.style.color = "oklch(0.6 0.18 20)";
  deleteBtn.textContent = "Remove Block";
  deleteBtn.style.fontWeight = "600";
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    canvasBlocks = removeBlockFromTree(canvasBlocks, block.id);
    selectedBlockId = null;
    renderEditor();
  });

  if (block.type === "heading") {
    const levelSelect = document.createElement("select");
    levelSelect.className = "canvas-layout-select";
    levelSelect.innerHTML = ["h1", "h2", "h3", "h4", "h5"]
      .map(
        (tag) =>
          `<option value="${tag}" ${tag === (block.level || "h2") ? "selected" : ""}>${tag.toUpperCase()}</option>`,
      )
      .join("");

    levelSelect.addEventListener("change", (e) => {
      canvasBlocks = updateBlockInTree(canvasBlocks, block.id, (b) => ({
        ...b,
        level: e.target.value,
      }));
      renderEditor();
    });
    actionsZone.appendChild(levelSelect);
  }

  if (block.type === "paragraph") {
    const variantSelect = document.createElement("select");
    variantSelect.className = "canvas-layout-select";
    variantSelect.innerHTML = `
      <option value="normal" ${block.variant === "normal" ? "selected" : ""}>Normal Text</option>
      <option value="caption" ${block.variant === "caption" ? "selected" : ""}>Caption (Italic)</option>
    `;

    variantSelect.addEventListener("change", (e) => {
      canvasBlocks = updateBlockInTree(canvasBlocks, block.id, (b) => ({
        ...b,
        variant: e.target.value,
      }));
      renderEditor();
    });
    actionsZone.appendChild(variantSelect);
  }

  if (block.type === "image") {
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = block.content.startsWith("data:") ? "" : block.content;
    urlInput.className = "canvas-image-input";
    urlInput.placeholder = "Paste asset URL link";
    urlInput.addEventListener("input", (e) => {
      canvasBlocks = updateBlockInTree(canvasBlocks, block.id, (b) => ({
        ...b,
        content: e.target.value,
      }));
      const img = document.querySelector(
        `.canvas-block-wrapper[data-id="${block.id}"] img`,
      );
      if (img) img.src = e.target.value;
    });

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.className = "canvas-image-upload";
    fileInput.id = `fab-upload-${block.id}`;

    const uploadLabel = document.createElement("label");
    uploadLabel.className = "canvas-image-upload-btn";
    uploadLabel.textContent = "Upload Image";
    uploadLabel.setAttribute("for", `fab-upload-${block.id}`);

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        canvasBlocks = updateBlockInTree(canvasBlocks, block.id, (b) => ({
          ...b,
          content: reader.result,
        }));
        renderEditor();
      };
      reader.readAsDataURL(file);
    });

    actionsZone.appendChild(urlInput);
    actionsZone.appendChild(uploadLabel);
    actionsZone.appendChild(fileInput);
  }

  if (block.type === "container") {
    const currentCols = block.layout?.columns ?? 2;
    const currentRows = block.layout?.rows ?? 2;

    const colLabel = document.createElement("span");
    colLabel.className = "canvas-layout-label";
    colLabel.textContent = "Cols:";

    const colInput = document.createElement("input");
    colInput.type = "number";
    colInput.min = "1";
    colInput.max = "4";
    colInput.value = currentCols;
    colInput.className = "canvas-layout-number-input";
    colInput.addEventListener("change", (e) => {
      let val = Math.max(1, Math.min(4, Number(e.target.value) || 2));
      e.target.value = val;
      canvasBlocks = updateContainerLayout(canvasBlocks, block.id, {
        columns: val,
      });
      renderEditor();
    });

    const rowLabel = document.createElement("span");
    rowLabel.className = "canvas-layout-label";
    rowLabel.textContent = "Rows:";

    const rowInput = document.createElement("input");
    rowInput.type = "number";
    rowInput.min = "1";
    rowInput.max = "4";
    rowInput.value = currentRows;
    rowInput.className = "canvas-layout-number-input";
    rowInput.addEventListener("change", (e) => {
      let val = Math.max(1, Math.min(4, Number(e.target.value) || 2));
      e.target.value = val;
      canvasBlocks = updateContainerLayout(canvasBlocks, block.id, {
        rows: val,
      });
      renderEditor();
    });

    const inlineActions = document.createElement("div");
    inlineActions.className = "canvas-container-actions";
    [
      { label: "Heading", type: "heading" },
      { label: "Paragraph", type: "paragraph" },
      { label: "Image", type: "image" },
    ].forEach((item) => {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "canvas-inline-btn";
      addBtn.textContent = `+ ${item.label}`;
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        canvasBlocks = insertBlockIntoContainer(
          canvasBlocks,
          block.id,
          item.type,
        );
        renderEditor();
      });
      inlineActions.appendChild(addBtn);
    });

    actionsZone.appendChild(colLabel);
    actionsZone.appendChild(colInput);
    actionsZone.appendChild(rowLabel);
    actionsZone.appendChild(rowInput);
    actionsZone.appendChild(inlineActions);
  }

  actionsZone.appendChild(deleteBtn);
}

function initPreviewEngine() {
  const previewBtn = document.getElementById("canvas-preview-btn");
  if (!previewBtn) return;

  previewBtn.addEventListener("click", () => {
    const sortedBlocks = [...canvasBlocks].sort((a, b) => a.order - b.order);

    // FIX: Bypassed the broken sessionStorage call entirely to prevent QuotaExceeded errors

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      alert("Please allow popups to preview your layout draft.");
      return;
    }

    // Direct object variable fallback references passed cleanly through global window attributes instead
    previewWindow.previewDataBlocks = sortedBlocks;

    let documentHtmlContent = "";

    function renderPreviewHtml(blocks) {
      return blocks
        .map((block) => {
          if (block.type === "heading") {
            const tag = block.level || "h2";
            return `<${tag} class="canvas-heading">${block.content}</${tag}>`;
          }

          if (block.type === "paragraph") {
            const isCaptionClass =
              block.variant === "caption" ? "is-caption" : "";
            return `<p class="canvas-paragraph ${isCaptionClass}">${block.content}</p>`;
          }

          if (block.type === "image") {
            return `<img src="${block.content}" class="preview-image-element" alt="Case Study Material" onerror="this.style.display='none';" />`;
          }

          if (block.type === "container") {
            const columns = block.layout?.columns ?? 2;
            const rows = block.layout?.rows ?? 2;
            const childrenHtml = renderPreviewHtml(block.children || []);
            return `
              <div class="preview-grid-container" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: ${rows > 1 ? `repeat(${rows}, minmax(0, auto))` : "auto"};">
                ${childrenHtml}
              </div>`;
          }

          return "";
        })
        .join("");
    }

    documentHtmlContent = renderPreviewHtml(sortedBlocks);

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Case Study Preview</title>
        <link rel="stylesheet" href="main.css">
        <link rel="stylesheet" href="css/editor.css">
      </head>
      <body class="preview-document-body">
        <article class="preview-document-container">
          ${documentHtmlContent || '<p class="canvas-paragraph">No content generated on this canvas yet.</p>'}
        </article>
      </body>
      </html>
    `);

    previewWindow.document.close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startEditorRuntimeWatch();
  initializeEditorRuntime();
});
