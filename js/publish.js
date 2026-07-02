// js/publish.js

function initPublishWizard() {
  const form = document.getElementById("portfolio-metadata-form");
  if (!form) return;

  const sb = window.supabaseClient;
  const statusBanner = document.getElementById("wizard-status-banner");
  const imagesGrid = document.getElementById("extracted-images-grid");
  const fileInput = document.getElementById("meta-upload-file");
  const urlInput = document.getElementById("meta-fallback-url");
  const titleInput = document.getElementById("meta-project-title");
  const descInput = document.getElementById("meta-project-desc");

  let selectedCoverUrl = "";

  function displayStatus(msg, isSuccess = true) {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.style.display = "block";
    statusBanner.style.background = isSuccess
      ? "oklch(0.85 0.1 140)"
      : "oklch(0.85 0.15 25)";
    statusBanner.style.color = isSuccess
      ? "oklch(0.3 0.1 140)"
      : "oklch(0.3 0.15 25)";
  }

  const diskBlocksRaw = localStorage.getItem("activeCanvasBlocksBackup");
  if (diskBlocksRaw) {
    window.canvasBlocks = JSON.parse(diskBlocksRaw);
  }

  if (
    window.currentEditingProjectId ||
    localStorage.getItem("currentEditingProjectId")
  ) {
    window.currentEditingProjectId =
      window.currentEditingProjectId ||
      localStorage.getItem("currentEditingProjectId");
    const cachedMeta = localStorage.getItem("activeProjectMetadata");
    if (cachedMeta && !window.activeProjectMetadata) {
      window.activeProjectMetadata = JSON.parse(cachedMeta);
    }

    if (window.activeProjectMetadata) {
      titleInput.value = window.activeProjectMetadata.title || "";
      descInput.value = window.activeProjectMetadata.description || "";
      urlInput.value = window.activeProjectMetadata.cover_image || "";
      selectedCoverUrl = window.activeProjectMetadata.cover_image || "";
    }
  }

  const activeCanvasBlocks = window.canvasBlocks || [];

  function extractImages(blocks) {
    let urls = [];
    blocks.forEach((b) => {
      if (b.type === "image" && b.content && !b.content.startsWith("data:")) {
        urls.push(b.content);
      }
      if (b.type === "container" && b.children) {
        urls = urls.concat(extractImages(b.children));
      }
    });
    return [...new Set(urls)];
  }

  const projectImages = extractImages(activeCanvasBlocks);
  if (imagesGrid) imagesGrid.innerHTML = "";

  if (projectImages.length === 0) {
    if (imagesGrid)
      imagesGrid.innerHTML = `<p class="helper-text" style="grid-column: 1/-1; font-style: italic;">No canvas image files identified in your draft.</p>`;
  } else if (imagesGrid) {
    projectImages.forEach((imgUrl) => {
      const cardOption = document.createElement("div");
      cardOption.className = "extracted-img-option-card";

      const isSelected = selectedCoverUrl === imgUrl;
      cardOption.style = `
        position: relative; border: 2px solid ${isSelected ? "var(--text-primary)" : "var(--border-color)"}; 
        border-radius: 0.5rem; overflow: hidden; cursor: pointer; aspect-ratio: 16/10; background: var(--surface-secondary);
      `;
      cardOption.innerHTML = `
        <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Source Choice" />
        <div class="check-badge" style="display:${isSelected ? "block" : "none"}; position:absolute; top:4px; right:4px; background:var(--text-primary); color:white; border-radius:50%; width:20px; height:20px; font-size:11px; text-align:center; line-height:20px; font-weight:bold;">✓</div>
      `;

      cardOption.addEventListener("click", () => {
        document
          .querySelectorAll(".extracted-img-option-card")
          .forEach((el) => {
            el.style.borderColor = "var(--border-color)";
            el.querySelector(".check-badge").style.display = "none";
          });
        cardOption.style.borderColor = "var(--text-primary)";
        cardOption.querySelector(".check-badge").style.display = "block";

        fileInput.value = "";
        selectedCoverUrl = imgUrl;
        urlInput.value = imgUrl;
      });

      imagesGrid.appendChild(cardOption);
    });
  }

  urlInput.addEventListener("input", (e) => {
    selectedCoverUrl = e.target.value;
  });

  fileInput.addEventListener("change", () => {
    selectedCoverUrl = "";
    document.querySelectorAll(".extracted-img-option-card").forEach((el) => {
      el.style.borderColor = "var(--border-color)";
      el.querySelector(".check-badge").style.display = "none";
    });
  });

  async function processCoverUrl() {
    const localFile = fileInput.files?.[0];
    if (!localFile) {
      return selectedCoverUrl || urlInput.value;
    }

    if (!sb) return "";

    const fileExt = localFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadErr } = await sb.storage
      .from("project-assets")
      .upload(filePath, localFile);

    if (uploadErr) {
      console.error("Storage bucket submission failed:", uploadErr);
      return "";
    }

    const { data: publicUrlData } = sb.storage
      .from("project-assets")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async function syncProjectToSupabase(statusValue) {
    if (!sb) {
      displayStatus("Supabase client is uninitialized.", false);
      return;
    }

    displayStatus(
      "Saving layout blocks & parameters to database... please wait.",
    );

    const titleZone = titleInput.value.trim();
    const descriptionZone = descInput.value.trim();
    const finalCoverImage = await processCoverUrl();

    const blocksToSave =
      JSON.parse(localStorage.getItem("activeCanvasBlocksBackup")) ||
      window.canvasBlocks ||
      [];

    const recordPayload = {
      title: titleZone || "Untitled Project Draft",
      description: descriptionZone,
      cover_image: finalCoverImage,
      canvas_blocks: blocksToSave,
      status: statusValue,
    };

    if (window.currentEditingProjectId) {
      recordPayload.id = window.currentEditingProjectId;
    }

    const { error } = await sb
      .from("portfolio_projects")
      .upsert([recordPayload]);

    if (error) {
      displayStatus(`Database integration failure: ${error.message}`, false);
    } else {
      displayStatus(`Success! Case study saved.`, true);

      localStorage.removeItem("currentEditingProjectId");
      localStorage.removeItem("activeCanvasBlocksBackup");
      localStorage.removeItem("activeProjectMetadata");

      window.currentEditingProjectId = null;
      window.activeProjectMetadata = null;
      window.canvasBlocks = [];

      setTimeout(() => {
        window.location.hash = "/admin/dashboard";
      }, 1200);
    }
  }

  const draftBtn = document.getElementById("wizard-btn-save");
  if (draftBtn) {
    draftBtn.addEventListener("click", (e) => {
      e.preventDefault();
      syncProjectToSupabase("save");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    syncProjectToSupabase("publish");
  });
}

window.addEventListener("hashchange", () => {
  if (window.location.hash.includes("/admin/dashboard/publish")) {
    setTimeout(initPublishWizard, 100);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash.includes("/admin/dashboard/publish")) {
    setTimeout(initPublishWizard, 100);
  }
});
