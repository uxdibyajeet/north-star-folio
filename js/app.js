const routeMap = {
  "/": "home",
  "/home": "home",
  "/home/": "home",
  "/about": "about",
  "/admin": "admin",
  "/admin/": "admin",
  "/admin/dashboard": "dashboard",
  "/admin/dashboard/": "dashboard",
  "/admin/dashboard/new": "editor",
  "/admin/dashboard/new/": "editor",
};

function renderPage(pageName) {
  const appRoot = document.querySelector(".app");
  const contentHost = appRoot?.querySelector(".page-content");

  if (!contentHost) {
    return;
  }

  fetch(`/pages/${pageName}.html`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load page");
      }
      return response.text();
    })
    .then((html) => {
      contentHost.innerHTML = html;
    })
    .catch((error) => {
      console.error(error);
      contentHost.innerHTML = "<p>Page could not be loaded.</p>";
    });
}

// Extracts the route from the hash (e.g., "#/about" becomes "/about")
function getRouteFromHash() {
  const hash = window.location.hash;
  // If hash is empty or just "#", fallback to root "/"
  return hash.replace(/^#/, "") || "/";
}

function navigateToRoute(pathname) {
  const targetPath = pathname || getRouteFromHash();
  const normalizedPath = targetPath.replace(/\/+$/, "") || "/";
  const pageName =
    routeMap[targetPath] ||
    routeMap[normalizedPath] ||
    routeMap[`${normalizedPath}/`] ||
    routeMap["/"];

  if (normalizedPath.startsWith("/admin") && normalizedPath !== "/admin") {
    const sb = window.supabaseClient;

    if (sb?.auth) {
      sb.auth.mfa
        .getAuthenticatorAssuranceLevel()
        .then((result) => {
          if (result?.data?.currentLevel !== "aal2") {
            console.warn("Access Denied: 2FA Required.");
            window.location.hash = "/admin";
            return;
          }

          renderPage(pageName);
        })
        .catch((err) => {
          console.error("MFA Check failed:", err);
          window.location.hash = "/admin";
        });

      return;
    }
  }

  renderPage(pageName);
}

document.addEventListener("DOMContentLoaded", () => {
  window.renderNavbar?.(".app");
  window.navigateToRoute = navigateToRoute;

  // Intercept clicks on navigation elements
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-route]");

    if (!trigger) {
      return;
    }

    event.preventDefault();
    const nextPath = trigger.getAttribute("data-route"); // Expects clean paths like "/about"

    // Set the hash. This automatically fires the 'hashchange' event.
    window.location.hash = nextPath;
  });

  // Listen for back/forward browser navigation or direct URL hash changes
  window.addEventListener("hashchange", () => {
    navigateToRoute(getRouteFromHash());
  });

  // Initial routing call on page load
  navigateToRoute(getRouteFromHash());
});
