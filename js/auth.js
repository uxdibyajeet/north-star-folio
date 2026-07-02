// auth.js

// A clean initialization function called whenever the admin page mounts
function initAdminAuth() {
  const loginForm = document.getElementById("admin-login-form");
  const authenticatorStep = document.getElementById("authenticator-step");
  const twoFactorStep = document.getElementById("two-factor-step");
  const verifyButton = document.getElementById("verify-code-btn");
  const continueButton = document.getElementById("continue-to-code-btn");
  const statusMessage = document.getElementById("auth-status");
  const codeInput = document.getElementById("admin-code");
  const qrBox = document.querySelector(".qr-box");

  // If the admin form elements aren't present on the current view, exit silently
  if (!loginForm) return;

  const sb = window.supabaseClient;
  if (!sb || !sb.auth) {
    if (statusMessage) {
      statusMessage.textContent = "Supabase is not configured yet.";
      statusMessage.style.color = "#b91c1c";
    }
    return;
  }

  let factorId = null;
  let challengeId = null;

  function setStatus(msg, ok = false) {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.style.color = ok ? "#15803d" : "#b91c1c";
  }

  function showStep(step) {
    loginForm.hidden = step !== "credentials";
    if (authenticatorStep) authenticatorStep.hidden = step !== "qr";
    if (twoFactorStep) twoFactorStep.hidden = step !== "code";
  }

  // Ensure fresh display state on init
  showStep("credentials");

  // 1. Submit Credentials Step
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    setStatus("Checking credentials...");

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus(error.message);
      return;
    }

    // Check MFA level status
    const { data: aal, error: aalErr } =
      await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr) return setStatus(aalErr.message);

    if (aal.currentLevel === "aal2") {
      setStatus("Login verified successfully.", true);
      window.location.hash = "/admin/dashboard";
      return;
    }

    const { data: factors, error: facErr } = await sb.auth.mfa.listFactors();
    if (facErr) return setStatus(facErr.message);

    const totpFactor = factors.totp && factors.totp[0];

    if (totpFactor) {
      // User has configured TOTP already -> Challenge them directly
      factorId = totpFactor.id;
      const { data: challenge, error: chErr } = await sb.auth.mfa.challenge({
        factorId,
      });
      if (chErr) return setStatus(chErr.message);

      challengeId = challenge.id;
      showStep("code");
      setStatus("Enter the code from your authenticator app.", true);
    } else {
      // First time configuration -> Enroll new factor
      const { data: enroll, error: enErr } = await sb.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enErr) return setStatus(enErr.message);

      factorId = enroll.id;
      // Supabase supplies a raw SVG string for qr_code
      if (qrBox) {
        qrBox.innerHTML = enroll.totp.qr_code;
      }
      showStep("qr");
      setStatus("Scan the QR code in your authenticator app.", true);
    }
  });

  // 2. Continue after scanning QR code
  continueButton?.addEventListener("click", async () => {
    const { data: challenge, error } = await sb.auth.mfa.challenge({
      factorId,
    });
    if (error) return setStatus(error.message);

    challengeId = challenge.id;
    showStep("code");
    setStatus("Enter the code from your authenticator app.", true);
  });

  // 3. Verify final Code token
  verifyButton?.addEventListener("click", async () => {
    const { data, error } = await sb.auth.mfa.verify({
      factorId,
      challengeId,
      code: codeInput.value.trim(),
    });
    if (error) return setStatus(error.message);

    setStatus("Login verified successfully!", true);
    window.location.hash = "/admin/dashboard";
  });
}

// Global listener hook: wait for router announcements or check on hash change
window.addEventListener("hashchange", () => {
  // Wait brief microtask execution frame for the router DOM to populate HTML page files
  setTimeout(initAdminAuth, 50);
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initAdminAuth, 50);
});
