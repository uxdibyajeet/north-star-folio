// js/editor.js

// js/editor.js

function synchronizeActiveCanvasState() {
  const cachedProjectId = localStorage.getItem("currentEditingProjectId");
  const cachedBlocks = localStorage.getItem("activeCanvasBlocksBackup");
  const cachedMeta = localStorage.getItem("activeProjectMetadata");

  // Only bind the cached project state if an active ID exists
  if (cachedProjectId && cachedBlocks) {
    window.currentEditingProjectId = cachedProjectId;
    window.canvasBlocks = JSON.parse(cachedBlocks);
    if (cachedMeta) window.activeProjectMetadata = JSON.parse(cachedMeta);
    return;
  }

  // Fallback default structure for creating brand-new portfolio elements
  window.currentEditingProjectId = null;
  window.activeProjectMetadata = null;
  window.canvasBlocks = [
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

  localStorage.setItem(
    "activeCanvasBlocksBackup",
    JSON.stringify(window.canvasBlocks),
  );
}

synchronizeActiveCanvasState();

let draggedType = null;
let draggedBlockId = null;
let selectedBlockId = null;
let editorRuntimeInitialized = false;
let editorRuntimeObserver = null;

function renderEditor() {
  renderCanvas();

  if (selectedBlockId) {
    const activeBlock = findBlockInTree(window.canvasBlocks, selectedBlockId);
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
  const canvas = document.getElementById("document-canvas");
  if (!canvas) return;

  synchronizeActiveCanvasState();
  renderEditor();
  initDndEngine();
  initMutationListeners();
  initPreviewEngine();
  initGlobalClickTracker();
  initNextStepInterceptors();
  editorRuntimeInitialized = true;

  if (editorRuntimeObserver) {
    editorRuntimeObserver.disconnect();
    editorRuntimeObserver = null;
  }
}

function startEditorRuntimeWatch() {
  if (editorRuntimeObserver) return;

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

  if (type === "heading") block.level = "h2";
  if (type === "paragraph") block.variant = "normal";
  if (type === "container") block.layout = { columns: 2, rows: 2 };

  return block;
}

function updateBlockInTree(blocks, id, updater) {
  return blocks.map((block) => {
    if (block.id === id) return updater(block);
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
    if (block.id === id) return block;
    if (block.type === "container") {
      const childBlock = findBlockInTree(block.children || [], id);
      if (childBlock) return childBlock;
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

// FIXED PIPELINE: Routes canvas media payloads directly into "project-assets"
async function streamAssetToStorage(file, blockId) {
  const sb = window.supabaseClient;
  if (!sb) {
    alert("Upload failed: Supabase client is uninitialized.");
    return null;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `canvas-${blockId}-${Date.now()}.${fileExt}`;
  const filePath = `canvas_assets/${fileName}`;

  const { error: uploadErr } = await sb.storage
    .from("project-assets")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Supabase Storage Target Error:", uploadErr);
    alert(`Upload Failed: ${uploadErr.message}`);
    return null;
  }

  const { data: publicUrlData } = sb.storage
    .from("project-assets")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
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
        "Drag an image here, or upload one via the bottom FAB toolbar panel.";
      previewShell.appendChild(placeholder);
    }

    imageFrame.appendChild(previewShell);
    innerWrapper.appendChild(imageFrame);

    imageFrame.addEventListener("dragover", (e) => {
      if (!draggedType && draggedBlockId !== block.id) {
        e.preventDefault();
        e.stopPropagation();
        imageFrame.style.borderColor = "var(--text-primary)";
        imageFrame.style.background = "var(--surface-secondary)";
      }
    });

    imageFrame.addEventListener("dragleave", () => {
      imageFrame.style.borderColor = "var(--border-color)";
      imageFrame.style.background = "transparent";
    });

    imageFrame.addEventListener("drop", async (e) => {
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        e.preventDefault();
        e.stopPropagation();
        imageFrame.style.borderColor = "var(--border-color)";
        imageFrame.innerHTML = `<div class="canvas-image-placeholder">Uploading to project-assets...</div>`;

        const publicUrl = await streamAssetToStorage(file, block.id);
        if (publicUrl) {
          window.canvasBlocks = updateBlockInTree(
            window.canvasBlocks,
            block.id,
            (b) => ({ ...b, content: publicUrl }),
          );
          localStorage.setItem(
            "activeCanvasBlocksBackup",
            JSON.stringify(window.canvasBlocks),
          );
        }
        renderEditor();
      }
    });
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
    if (e.target.hasAttribute("contenteditable")) {
      selectedBlockId = block.id;
      const fab = document.getElementById("canvas-context-fab");
      if (fab && fab.classList.contains("is-hidden")) {
        const activeBlock = findBlockInTree(
          window.canvasBlocks,
          selectedBlockId,
        );
        if (activeBlock) updateFabToolbar(activeBlock);
      }
      return;
    }
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

  const sorted = [...window.canvasBlocks].sort((a, b) => a.order - b.order);

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
      const parentContainer = afterElement.parentNode;
      if (parentContainer) {
        parentContainer.insertBefore(indicator, afterElement);
      }
    }
  });

  canvas.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) return;
    e.preventDefault();
    document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());

    const afterElement = getCanvasDropPosition(canvas, e.clientY);
    let sorted = [...window.canvasBlocks].sort((a, b) => a.order - b.order);

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
      if (sourceIndex !== -1) {
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
    }

    window.canvasBlocks = sorted.map((block, idx) => ({
      ...block,
      order: idx,
    }));
    localStorage.setItem(
      "activeCanvasBlocksBackup",
      JSON.stringify(window.canvasBlocks),
    );
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
    const targetId =
      e.target.dataset.id || e.target.closest("[data-id]")?.dataset.id;
    if (!targetId) return;

    window.canvasBlocks = updateBlockInTree(
      window.canvasBlocks,
      targetId,
      (block) => ({
        ...block,
        content: e.target.innerText,
      }),
    );
    localStorage.setItem(
      "activeCanvasBlocksBackup",
      JSON.stringify(window.canvasBlocks),
    );
  });
}

function initGlobalClickTracker() {
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".canvas-block-wrapper") &&
      !e.target.closest("#canvas-context-fab")
    ) {
      selectedBlockId = null;
      toggleFabVisibility(false);
    }
  });
}

function initNextStepInterceptors() {
  const nextBtn = document.querySelector('a[href="#/admin/dashboard/publish"]');
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
    });
  }
}

function toggleFabVisibility(visible) {
  const fab = document.getElementById("canvas-context-fab");
  if (!fab) return;
  if (visible) fab.classList.remove("is-hidden");
  else fab.classList.add("is-hidden");
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
    window.canvasBlocks = removeBlockFromTree(window.canvasBlocks, block.id);
    localStorage.setItem(
      "activeCanvasBlocksBackup",
      JSON.stringify(window.canvasBlocks),
    );
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
      window.canvasBlocks = updateBlockInTree(
        window.canvasBlocks,
        block.id,
        (b) => ({ ...b, level: e.target.value }),
      );
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
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
      window.canvasBlocks = updateBlockInTree(
        window.canvasBlocks,
        block.id,
        (b) => ({ ...b, variant: e.target.value }),
      );
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
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
      window.canvasBlocks = updateBlockInTree(
        window.canvasBlocks,
        block.id,
        (b) => ({ ...b, content: e.target.value }),
      );
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
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

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadLabel.textContent = "Uploading...";
      const publicUrl = await streamAssetToStorage(file, block.id);
      if (publicUrl) {
        window.canvasBlocks = updateBlockInTree(
          window.canvasBlocks,
          block.id,
          (b) => ({ ...b, content: publicUrl }),
        );
        localStorage.setItem(
          "activeCanvasBlocksBackup",
          JSON.stringify(window.canvasBlocks),
        );
        renderEditor();
      } else {
        uploadLabel.textContent = "Upload Failed";
      }
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
      window.canvasBlocks = updateContainerLayout(
        window.canvasBlocks,
        block.id,
        { columns: val },
      );
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
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
      window.canvasBlocks = updateContainerLayout(
        window.canvasBlocks,
        block.id,
        { rows: val },
      );
      localStorage.setItem(
        "activeCanvasBlocksBackup",
        JSON.stringify(window.canvasBlocks),
      );
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
        window.canvasBlocks = insertBlockIntoContainer(
          window.canvasBlocks,
          block.id,
          item.type,
        );
        localStorage.setItem(
          "activeCanvasBlocksBackup",
          JSON.stringify(window.canvasBlocks),
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
    const sortedBlocks = [...window.canvasBlocks].sort(
      (a, b) => a.order - b.order,
    );
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) return;

    previewWindow.previewDataBlocks = sortedBlocks;
    let documentHtmlContent = renderPreviewHtml(sortedBlocks);

    function renderPreviewHtml(blocks) {
      return blocks
        .map((block) => {
          if (block.type === "heading") {
            return `<${block.level || "h2"} class="canvas-heading">${block.content}</${block.level || "h2"}>`;
          }
          if (block.type === "paragraph") {
            return `<p class="canvas-paragraph ${block.variant === "caption" ? "is-caption" : ""}">${block.content}</p>`;
          }
          if (block.type === "image") {
            return `<img src="${block.content}" class="preview-image-element" onerror="this.style.display='none';" />`;
          }
          if (block.type === "container") {
            return `
            <div class="preview-grid-container" style="grid-template-columns: repeat(${block.layout?.columns ?? 2}, minmax(0, 1fr));">
              ${renderPreviewHtml(block.children || [])}
            </div>`;
          }
          return "";
        })
        .join("");
    }

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Case Study Preview</title><link rel="stylesheet" href="css/editor.css"></head>
      <body><article class="preview-document-container">${documentHtmlContent}</article></body>
      </html>
    `);
    previewWindow.document.close();
  });
}

window.addEventListener("hashchange", () => {
  if (window.location.hash.includes("/admin/dashboard/new")) {
    editorRuntimeInitialized = false;
    setTimeout(initializeEditorRuntime, 100);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  startEditorRuntimeWatch();
});
