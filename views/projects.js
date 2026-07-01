export function ProjectsView() {
  return `
        <div class="builder-container" style="display: grid; grid-template-columns: 280px 1fr; gap: 2rem; margin-top: 1rem; height: calc(100vh - 140px);">
            
            <div class="sidebar-palette" style="background: var(--bg-surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem;">
                <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary);">Component Palette</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 0.5rem;">Drag components onto the workspace canvas canvas.</p>
                
                <div class="draggable-block" draggable="true" data-type="hero" style="padding: 1rem; background: var(--bg-dark); border: 1px dashed var(--accent); border-radius: 6px; cursor: grab; font-weight: 500; font-size: 0.9rem;">
                    ⚡ Hero Banner Block
                </div>
                <div class="draggable-block" draggable="true" data-type="text-block" style="padding: 1rem; background: var(--bg-dark); border: 1px dashed var(--accent); border-radius: 6px; cursor: grab; font-weight: 500; font-size: 0.9rem;">
                    📝 Rich Text Block
                </div>
                <div class="draggable-block" draggable="true" data-type="image-grid" style="padding: 1rem; background: var(--bg-dark); border: 1px dashed var(--accent); border-radius: 6px; cursor: grab; font-weight: 500; font-size: 0.9rem;">
                    🖼️ Image Grid Display
                </div>

                <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <label style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.5rem;">PROJECT NAME</label>
                    <input type="text" id="project-title-input" placeholder="My New Project" style="width:100%; padding:0.6rem; background:var(--bg-dark); border:1px solid var(--border); border-radius:6px; color:white; margin-bottom:1rem; outline:none;">
                    
                    <button id="save-builder-btn" style="width: 100%; padding: 0.75rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        Save Portfolio Page
                    </button>
                </div>
            </div>

            <div id="builder-canvas" style="background: var(--bg-surface); border: 2px dashed var(--border); border-radius: 12px; padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; position: relative;">
                <div id="canvas-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-secondary); pointer-events: none; text-align: center;">
                    <p style="font-size: 1.2rem; margin-bottom: 0.25rem;">Canvas Area Empty</p>
                    <p style="font-size: 0.85rem;">Drop design blocks here to construct layout</p>
                </div>
            </div>

        </div>
    `;
}
