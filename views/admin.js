export function AdminView() {
  return `
        <div class="page-container" style="max-width: 420px; margin: 4rem auto;">
            <div style="background: var(--bg-surface); padding: 2.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 700;">Admin Console</h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2rem;">Please authenticate to access the builder workspace.</p>
                
                <form id="login-form">
                    <div style="margin-bottom: 1.25rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">EMAIL ADDRESS</label>
                        <input type="email" id="admin-email" required style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.95rem; outline: none; border: 1px solid var(--border);">
                    </div>
                    <div style="margin-bottom: 1.75rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary);">SECURITY PASSWORD</label>
                        <input type="password" id="admin-password" required style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.95rem; outline: none; border: 1px solid var(--border);">
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer;">Verify Credentials</button>
                </form>

                <form id="mfa-form" style="display: none;">
                    <div style="margin-bottom: 1.5rem; text-align: center;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-secondary);">ENTER 6-DIGIT AUTHENTICATOR TOKEN</label>
                        <input type="text" id="mfa-token" placeholder="000000" maxlength="6" pattern="[0-9]*" inputmode="numeric" required style="width: 160px; text-align: center; font-size: 1.75rem; letter-spacing: 0.25em; padding: 0.5rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); outline: none;">
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer;">Confirm Token</button>
                </form>

                <div id="mfa-enrollment" style="display: none; text-align: center;">
                    <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem;">Secure Your Account</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Scan this code using Google Authenticator or multi-token apps to link security profiles.</p>
                    
                    <div id="mfa-qr-container" style="background: white; padding: 1rem; display: inline-block; border-radius: 8px; margin-bottom: 1.5rem;">
                        </div>

                    <form id="mfa-setup-form">
                        <div style="margin-bottom: 1.5rem;">
                            <input type="text" id="mfa-setup-token" placeholder="000000" maxlength="6" pattern="[0-9]*" inputmode="numeric" required style="width: 160px; text-align: center; font-size: 1.5rem; letter-spacing: 0.2em; padding: 0.5rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); outline: none;">
                        </div>
                        <button type="submit" style="width: 100%; padding: 0.75rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Verify & Activate 2FA</button>
                    </form>
                </div>

                <div id="auth-error-msg" style="color: #ef4444; font-size: 0.85rem; margin-top: 1rem; text-align: center; display: none;"></div>
            </div>
        </div>
    `;
}
