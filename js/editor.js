let canvasBlocks = [
  {
    id: "block-1",
    type: "heading",
    content: "Design Strategy & Deep Discovery Phase",
    order: 0,
    children: [],
  },
  {
    id: "block-2",
    type: "paragraph",
    content:
      "We conducted extensive multi-stage stakeholder workshops and contextual inquiries to map out user interactions across new application surfaces.",
    order: 1,
    children: [],
  },
];

let draggedType = null;
let draggedBlockId = null;
let editorRuntimeInitialized = false;
let editorRuntimeObserver = null;

function renderEditor() {
  renderCanvas();
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

  if (depth > 0) {
    blockWrapper.classList.add("canvas-block-wrapper--nested");
  }

  const toolbar = document.createElement("div");
  toolbar.className = "canvas-block-toolbar";
  toolbar.innerHTML = `<button class="ghost-btn delete-btn" data-id="${block.id}">Remove Block</button>`;
  blockWrapper.appendChild(toolbar);

  const innerWrapper = document.createElement("div");

  if (block.type === "heading") {
    innerWrapper.innerHTML = `<h2 contenteditable="true" class="canvas-heading" data-id="${block.id}">${block.content}</h2>`;
  } else if (block.type === "paragraph") {
    innerWrapper.innerHTML = `<p contenteditable="true" class="canvas-paragraph" data-id="${block.id}">${block.content}</p>`;
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
      placeholder.textContent = "Upload a file or paste an image URL.";
      previewShell.appendChild(placeholder);
    }

    const controls = document.createElement("div");
    controls.className = "canvas-image-controls";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = block.content || "";
    urlInput.className = "canvas-image-input";
    urlInput.dataset.id = block.id;
    urlInput.placeholder = "Paste image URL or upload a file";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.className = "canvas-image-upload";
    fileInput.dataset.id = block.id;

    const uploadLabel = document.createElement("label");
    uploadLabel.className = "canvas-image-upload-btn";
    uploadLabel.textContent = "Upload Image";
    uploadLabel.appendChild(fileInput);

    controls.appendChild(urlInput);
    controls.appendChild(uploadLabel);
    imageFrame.appendChild(previewShell);
    imageFrame.appendChild(controls);
    innerWrapper.appendChild(imageFrame);
  } else if (block.type === "container") {
    const containerShell = document.createElement("div");
    containerShell.className = "canvas-container-shell";

    const containerToolbar = document.createElement("div");
    containerToolbar.className = "canvas-container-toolbar";

    const addActions = document.createElement("div");
    addActions.className = "canvas-container-actions";

    [
      { label: "Heading", type: "heading" },
      { label: "Paragraph", type: "paragraph" },
      { label: "image", type: "image" },
      { label: "Container", type: "container" },
    ].forEach((item) => {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "canvas-inline-btn";
      addBtn.textContent = `+ ${item.label}`;
      addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvasBlocks = insertBlockIntoContainer(
          canvasBlocks,
          block.id,
          item.type,
        );
        renderEditor();
      });
      addActions.appendChild(addBtn);
    });

    const layoutLabel = document.createElement("span");
    layoutLabel.className = "canvas-layout-label";
    layoutLabel.textContent = "Grid";

    const columnsSelect = document.createElement("select");
    columnsSelect.className = "canvas-layout-select";
    columnsSelect.innerHTML = [1, 2, 3]
      .map(
        (value) =>
          `<option value="${value}" ${value === (block.layout?.columns || 2) ? "selected" : ""}>${value} cols</option>`,
      )
      .join("");
    columnsSelect.addEventListener("change", (e) => {
      e.stopPropagation();
      canvasBlocks = updateContainerLayout(canvasBlocks, block.id, {
        columns: Number(e.target.value),
      });
      renderEditor();
    });

    const rowsSelect = document.createElement("select");
    rowsSelect.className = "canvas-layout-select";
    rowsSelect.innerHTML = [1, 2, 3]
      .map(
        (value) =>
          `<option value="${value}" ${value === (block.layout?.rows || 2) ? "selected" : ""}>${value} rows</option>`,
      )
      .join("");
    rowsSelect.addEventListener("change", (e) => {
      e.stopPropagation();
      canvasBlocks = updateContainerLayout(canvasBlocks, block.id, {
        rows: Number(e.target.value),
      });
      renderEditor();
    });

    containerToolbar.appendChild(addActions);
    containerToolbar.appendChild(layoutLabel);
    containerToolbar.appendChild(columnsSelect);
    containerToolbar.appendChild(rowsSelect);

    const childGrid = document.createElement("div");
    childGrid.className = "canvas-container-children";
    const columns = block.layout?.columns || 2;
    const rows = block.layout?.rows || 2;
    childGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    childGrid.style.gridTemplateRows =
      rows > 1 ? `repeat(${rows}, minmax(0, auto))` : "auto";

    (block.children || []).forEach((childBlock) => {
      childGrid.appendChild(buildBlockElement(childBlock, depth + 1));
    });

    containerShell.appendChild(containerToolbar);
    containerShell.appendChild(childGrid);
    innerWrapper.appendChild(containerShell);
  }

  blockWrapper.appendChild(innerWrapper);

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
      canvas.insertBefore(indicator, afterElement);
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

    if (
      targetBlock.type === "image" &&
      e.target.classList.contains("canvas-image-input")
    ) {
      canvasBlocks = updateBlockInTree(canvasBlocks, targetId, (block) => ({
        ...block,
        content: e.target.value,
      }));
      return;
    }

    canvasBlocks = updateBlockInTree(canvasBlocks, targetId, (block) => ({
      ...block,
      content:
        e.target.value !== undefined ? e.target.value : e.target.innerText,
    }));
  });

  canvas.addEventListener("change", (e) => {
    const targetId = e.target.dataset.id;
    if (!targetId) return;

    const targetBlock = findBlockInTree(canvasBlocks, targetId);
    if (!targetBlock) return;

    if (
      targetBlock.type === "image" &&
      e.target.classList.contains("canvas-image-input")
    ) {
      canvasBlocks = updateBlockInTree(canvasBlocks, targetId, (block) => ({
        ...block,
        content: e.target.value,
      }));
      renderEditor();
      return;
    }

    if (
      targetBlock.type === "image" &&
      e.target.classList.contains("canvas-image-upload")
    ) {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        canvasBlocks = updateBlockInTree(canvasBlocks, targetId, (block) => ({
          ...block,
          content: reader.result,
        }));
        renderEditor();
      };
      reader.readAsDataURL(file);
    }
  });

  canvas.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-btn");
    if (!deleteBtn) return;

    const idToDelete = deleteBtn.dataset.id;
    canvasBlocks = removeBlockFromTree(canvasBlocks, idToDelete);
    renderEditor();
  });
}

function initPreviewEngine() {
  const previewBtn = document.getElementById("canvas-preview-btn");
  if (!previewBtn) return;

  previewBtn.addEventListener("click", () => {
    const sortedBlocks = [...canvasBlocks].sort((a, b) => a.order - b.order);
    sessionStorage.setItem(
      "portfolio_case_study_preview",
      JSON.stringify(sortedBlocks),
    );

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      alert("Please allow popups to preview your layout draft.");
      return;
    }

    let documentHtmlContent = "";

    function renderPreviewHtml(blocks) {
      return blocks
        .map((block) => {
          if (block.type === "heading") {
            return `<h2 class="canvas-heading">${block.content}</h2>`;
          }

          if (block.type === "paragraph") {
            return `<p class="canvas-paragraph">${block.content}</p>`;
          }

          if (block.type === "image") {
            return `<img src="${block.content}" class="preview-image-element" alt="Case Study Material" onerror="this.style.display='none';" />`;
          }

          if (block.type === "container") {
            const columns = block.layout?.columns || 2;
            const rows = block.layout?.rows || 2;
            const childrenHtml = renderPreviewHtml(block.children || []);
            return `
              <div class="canvas-grid-container preview-override" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr)); grid-template-rows: ${rows > 1 ? `repeat(${rows}, minmax(0, auto))` : "auto"};">
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
