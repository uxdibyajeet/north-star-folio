// js/editor.js

export async function initEditor(supabase) {
  const saveBtn = document.getElementById("save-project-btn");
  const backBtn = document.getElementById("back-to-dash-btn");

  // 1. Hide the global navbar by switching on the editor mode flag
  document.body.classList.add("in-editor-mode");

  // Intercept parameter identification tokens out of active routing space hashes
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const activeId = urlParams.get("id");
  window.activeEditingProjectId = activeId;

  if (backBtn) {
    backBtn.onclick = () => {
      // 2. Clean up and restore the global navbar before navigating away
      document.body.classList.remove("in-editor-mode");
      window.location.hash = "#/dashboard";
    };
  }

  // Bind and run native cover storage layer upload inputs
  initCoverUploadPipeline(supabase);

  // IF ID DETECTED: Query entry metadata fields and map into inputs
  if (activeId) {
    const { data, error } = await supabase
      .from("projects")
      .select("title, cover_image_url, description, tags")
      .eq("id", activeId)
      .single();

    if (data && !error) {
      document.getElementById("project-title-input").value = data.title || "";
      document.getElementById("project-cover-input").value =
        data.cover_image_url || "";
      document.getElementById("project-desc-input").value =
        data.description || "";
      document.getElementById("project-tags-input").value = Array.isArray(
        data.tags,
      )
        ? data.tags.join(", ")
        : "";
    }
  }

  if (saveBtn) {
    saveBtn.onclick = () => saveProjectMetaToSupabase(supabase);
  }
}
/**
 * Initializes clean dual-state text links and bucket uploads for the Cover image block
 */
function initCoverUploadPipeline(supabase) {
  const container = document.getElementById("cover-file-upload-wrapper");
  if (!container) return;

  container.innerHTML = `
    <span>Or upload asset:</span>
    <input type="file" id="project-cover-file-input" accept="image/*">
  `;

  const fileInput = document.getElementById("project-cover-file-input");
  const textInput = document.getElementById("project-cover-input");

  if (fileInput && textInput) {
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;

      textInput.value = "Uploading to bucket storage container...";

      const fileExt = file.name.split(".").pop();
      const uniqueName = `cover-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${uniqueName}`;

      const { data, error } = await supabase.storage
        .from("project-assets")
        .upload(filePath, file);

      if (error) {
        alert("Upload infrastructure fault: " + error.message);
        textInput.value = "";
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-assets").getPublicUrl(filePath);

      textInput.value = publicUrl;
    };
  }
}

/**
 * Commits the Panel A settings data directly back down into the active schema
 */
async function saveProjectMetaToSupabase(supabase) {
  const titleVal = document.getElementById("project-title-input").value.trim();
  const coverVal = document.getElementById("project-cover-input").value.trim();
  const descVal = document.getElementById("project-desc-input").value.trim();
  const tagsVal = document.getElementById("project-tags-input").value.trim();

  if (!titleVal) {
    alert("Please enter a project title, Sir.");
    return;
  }

  const tagsArray = tagsVal
    ? tagsVal
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
    : [];
  const slug = titleVal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const projectPayload = {
    title: titleVal,
    slug: slug,
    cover_image_url:
      coverVal ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
    description:
      descVal ||
      "A case study exploring interaction mechanics and architectural system frameworks.",
    tags: tagsArray,
    // layout_data is preserved or handled cleanly once Panel B is built out
  };

  let response;
  if (window.activeEditingProjectId) {
    response = await supabase
      .from("projects")
      .update(projectPayload)
      .eq("id", window.activeEditingProjectId);
  } else {
    response = await supabase.from("projects").insert([projectPayload]);
  }

  if (response.error) {
    alert("Sync aborted: " + response.error.message);
  } else {
    alert("Project card metadata updated successfully, Sir!");
    window.location.hash = "#/dashboard";
  }
}
