let canvasBlocks = [
  {
    id: "block-1",
    type: "heading",
    content: "Design Strategy & Deep Discovery Phase",
    order: 0,
  },
  {
    id: "block-2",
    type: "paragraph",
    content:
      "We conducted extensive multi-stage stakeholder workshops and contextual inquiries to map out user interactions across new application surfaces.",
    order: 1,
  },
];

let draggedType = null;
let draggedBlockId = null;

function renderEditor() {
  renderCanvas();
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

  sorted.forEach((block) => {
    const blockWrapper = document.createElement("div");
    blockWrapper.className = "canvas-block-wrapper";
    blockWrapper.setAttribute("draggable", "true");
    blockWrapper.dataset.id = block.id;

    // Build the actions action item toolbar element
    const toolbar = document.createElement("div");
    toolbar.className = "canvas-block-toolbar";
    toolbar.innerHTML = `<button class="ghost-btn delete-btn" data-id="${block.id}">Remove Block</button>`;
    blockWrapper.appendChild(toolbar);

    // Dynamic Element Markup Generation Routing
    const innerWrapper = document.createElement("div");

    if (block.type === "heading") {
      innerWrapper.innerHTML = `<h2 contenteditable="true" class="canvas-heading" data-id="${block.id}">${block.content}</h2>`;
    } else if (block.type === "paragraph") {
      innerWrapper.innerHTML = `<p contenteditable="true" class="canvas-paragraph" data-id="${block.id}">${block.content}</p>`;
    } else if (block.type === "image") {
      innerWrapper.innerHTML = `
        <div class="canvas-image-frame">
          <input type="text" value="${block.content}" class="canvas-image-input" data-id="${block.id}" placeholder="Paste image asset destination URL here..." />
        </div>`;
    } else if (block.type === "container") {
      innerWrapper.innerHTML = `
        <div class="canvas-grid-container">
          <div class="canvas-grid-column" contenteditable="true">Column Left Block</div>
          <div class="canvas-grid-column" contenteditable="true">Column Right Block</div>
        </div>`;
    }

    blockWrapper.appendChild(innerWrapper);

    // Native HTML5 drag handling configuration states
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

    canvas.appendChild(blockWrapper);
  });
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
      const defaultContent = {
        heading: "Untitled Section Header",
        paragraph:
          "Provide an insightful overview mapping execution metrics, problem criteria, or core methodology rules applied here.",
        image: "https://images.unsplash.com/photo-1581291518655-9523c932dedf",
        container: "",
      };

      const newBlock = {
        id: `block-${crypto.randomUUID().substring(0, 5)}`,
        type: draggedType,
        content: defaultContent[draggedType],
        order: 0,
      };

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
        return { offset: offset, element: child };
      } else {
        return closest;
      }
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

    const targetBlock = canvasBlocks.find((b) => b.id === targetId);
    if (targetBlock) {
      targetBlock.content =
        e.target.value !== undefined ? e.target.value : e.target.innerText;
    }
  });

  canvas.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-btn");
    if (!deleteBtn) return;

    const idToDelete = deleteBtn.dataset.id;
    canvasBlocks = canvasBlocks
      .filter((b) => b.id !== idToDelete)
      .map((b, idx) => ({ ...b, order: idx }));
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
    sortedBlocks.forEach((block) => {
      if (block.type === "heading") {
        documentHtmlContent += `<h2 class="canvas-heading">${block.content}</h2>`;
      } else if (block.type === "paragraph") {
        documentHtmlContent += `<p class="canvas-paragraph">${block.content}</p>`;
      } else if (block.type === "image") {
        documentHtmlContent += `<img src="${block.content}" class="preview-image-element" alt="Case Study Material" onerror="this.style.display='none';" />`;
      } else if (block.type === "container") {
        documentHtmlContent += `
          <div class="canvas-grid-container preview-override">
            <div class="canvas-grid-column">Column Left Content</div>
            <div class="canvas-grid-column">Column Right Content</div>
          </div>`;
      }
    });

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
  setTimeout(() => {
    renderEditor();
    initDndEngine();
    initMutationListeners();
    initPreviewEngine();
  }, 80);
});
