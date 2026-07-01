export async function initEditor(supabase) {
  const draggables = document.querySelectorAll(".draggable-block");
  const canvas = document.getElementById("builder-canvas");
  const placeholder = document.getElementById("canvas-placeholder");
  const saveBtn = document.getElementById("save-builder-btn");
  const backBtn = document.getElementById("back-to-dash-btn");

  if (!canvas) return;

  // Check URL parameters to see if we're parsing an existing project instance record index
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const activeId = urlParams.get("id");
  window.activeEditingProjectId = activeId; // Track state globally on runtime window frame

  if (backBtn)
    backBtn.onclick = () => {
      window.location.hash = "#/dashboard";
    };

  // Setup HTML5 Drag events listeners loops
  draggables.forEach((block) => {
    block.ondragstart = (e) =>
      e.dataTransfer.setData("text/plain", block.dataset.type);
  });

  canvas.ondragover = (e) => e.preventDefault();
  canvas.ondrop = (e) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("text/plain");
    if (placeholder) placeholder.style.display = "none";
    canvas.appendChild(generateCanvasElementNode(blockType));
  };

  // If activeId exists, query and populate database layouts structure arrays context back onto viewport canvas
  if (activeId) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", activeId)
      .single();
    if (data && !error) {
      document.getElementById("project-title-input").value = data.title;
      if (placeholder) placeholder.style.display = "none";

      data.layout_data.forEach((block) => {
        const node = generateCanvasElementNode(block.type);
        if (block.type === "hero") {
          node.querySelector("h2").innerText = block.content.heading;
          node.querySelector("p").innerText = block.content.subheading;
        } else if (block.type === "text-block") {
          node.querySelector("p").innerText = block.content.body;
        }
        canvas.appendChild(node);
      });
    }
  }

  if (saveBtn) saveBtn.onclick = () => saveCanvasToSupabase(supabase);
}

// Keep your clean canvas node generation functions neatly isolated within code module
function generateCanvasElementNode(type) {
  const blockRow = document.createElement("div");
  blockRow.className = "canvas-row";
  blockRow.dataset.componentType = type;
  blockRow.style.cssText =
    "position: relative; padding: 1.5rem; margin: -1.5rem; border: 1px transparent solid; border-radius: 8px; transition: border-color 0.2s ease;";

  blockRow.onmouseover = (e) => {
    e.stopPropagation();
    blockRow.style.borderColor = "var(--border)";
  };
  blockRow.onmouseout = (e) => {
    e.stopPropagation();
    blockRow.style.borderColor = "transparent";
  };

  let innerContent = "";
  if (type === "hero") {
    innerContent = `<div style="max-width: 800px; margin: 0 auto; padding: 2rem 0;">
        <h2 contenteditable="true" style="font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 1.25rem; outline: none; color: var(--text-primary);">Click to Edit Core Heading</h2>
        <p contenteditable="true" style="font-size: 1.25rem; line-height: 1.6; color: var(--text-secondary); outline: none;">Write a captivating project introduction hook right here.</p>
    </div>`;
  } else if (type === "text-block") {
    innerContent = `<div style="max-width: 680px; margin: 0 auto; padding: 1rem 0;">
        <p contenteditable="true" style="font-size: 1.1rem; line-height: 1.8; color: var(--text-primary); outline: none;">This is an editorial paragraph block context detail stories.</p>
    </div>`;
  } else if (type === "image-grid") {
    innerContent = `<div style="max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; padding: 1.5rem 0;">
        <div style="background: var(--bg-surface); border: 1px dashed var(--border); aspect-ratio: 16/10; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Primary Presentation Asset (16:10)</div>
        <div style="background: var(--bg-surface); border: 1px dashed var(--border); aspect-ratio: 10/12; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Context View (10:12)</div>
    </div>`;
  }

  blockRow.innerHTML = `${innerContent}<button onclick="this.parentElement.remove()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--bg-surface); border: 1px solid var(--border); color: #ef4444; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">✕ Delete</button>`;
  return blockRow;
}

async function saveCanvasToSupabase(supabase) {
  const titleInput = document
    .getElementById("project-title-input")
    .value.trim();
  const rows = document.querySelectorAll(".canvas-row");

  if (!titleInput) {
    alert("Please input a valid Project Title, Sir!");
    return;
  }
  if (rows.length === 0) {
    alert("Your design canvas is empty!");
    return;
  }

  const serializedLayout = [];
  rows.forEach((row) => {
    const type = row.dataset.componentType;
    const record = { type: type, content: {} };
    if (type === "hero") {
      record.content.heading = row.querySelector("h2").innerText;
      record.content.subheading = row.querySelector("p").innerText;
    } else if (type === "text-block") {
      record.content.body = row.querySelector("p").innerText;
    } else if (type === "image-grid") {
      record.content.meta = "static_placeholders";
    }
    serializedLayout.push(record);
  });

  const slug = titleInput
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  let response;

  if (window.activeEditingProjectId) {
    response = await supabase
      .from("projects")
      .update({ title: titleInput, slug: slug, layout_data: serializedLayout })
      .eq("id", window.activeEditingProjectId);
  } else {
    response = await supabase
      .from("projects")
      .insert([
        { title: titleInput, slug: slug, layout_data: serializedLayout },
      ]);
  }

  if (response.error) {
    alert("Sync error: " + response.error.message);
  } else {
    alert("Project synchronized perfectly to Supabase!");
    window.location.hash = "#/dashboard";
  }
}
