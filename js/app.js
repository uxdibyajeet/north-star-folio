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
  "/admin/dashboard/publish": "publish",
};

// Guard loop execution variable to prevent redundant routing fetches
let isRoutingFetchActive = false;

function renderPage(pageName) {
  const appRoot = document.querySelector(".app");
  const contentHost = appRoot?.querySelector(".page-content");

  if (!contentHost) {
    return;
  }

  isRoutingFetchActive = true;

  fetch(`/pages/${pageName}.html`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load page: ${pageName}`);
      }
      return response.text();
    })
    .then((html) => {
      contentHost.innerHTML = html;
      isRoutingFetchActive = false;

      // IMMEDIATE ROUTE LIFECYCLE INITIALIZATION HOOKS
      if (
        pageName === "home" &&
        typeof window.initHomePortfolio === "function"
      ) {
        window.initHomePortfolio();
      } else if (
        pageName === "dashboard" &&
        typeof window.initDynamicDashboard === "function"
      ) {
        window.initDynamicDashboard();
      } else if (
        pageName === "project" &&
        typeof window.initProjectDetailViewer === "function"
      ) {
        window.initProjectDetailViewer();
      }
    })
    .catch((error) => {
      console.error("Rendering pipeline exception:", error);
      contentHost.innerHTML = "<p>Page could not be loaded.</p>";
      isRoutingFetchActive = false;
    });
}

function getRouteFromHash() {
  const hash = window.location.hash;
  return hash.replace(/^#/, "") || "/";
}

function navigateToRoute(pathname) {
  if (isRoutingFetchActive) return;

  const targetPath = pathname || getRouteFromHash();
  const normalizedPath = targetPath.replace(/\/+$/, "") || "/";

  // 1. DYNAMIC MATCH OVERRIDE CHECK FOR CLIENT-SIDE PROJECT VIEWS
  if (normalizedPath.startsWith("/project/")) {
    renderPage("project");
    return;
  }

  // 2. STANDARD ROUTE MAP FALLBACK CHECKLIST
  const pageName =
    routeMap[targetPath] ||
    routeMap[normalizedPath] ||
    routeMap[`${normalizedPath}/`] ||
    routeMap["/"];

  // 3. ADMIN ACCESS VALIDATION WITH 2FA ENFORCEMENT
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

  // 4. DEFAULT RENDER FOR PUBLIC STATIC PAGES
  renderPage(pageName);
}

document.addEventListener("DOMContentLoaded", () => {
  window.renderNavbar?.(".app");
  window.navigateToRoute = navigateToRoute;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-route]");

    if (!trigger) {
      return;
    }

    event.preventDefault();
    const nextPath = trigger.getAttribute("data-route");
    window.location.hash = nextPath;
  });

  window.addEventListener("hashchange", () => {
    navigateToRoute(getRouteFromHash());
  });

  navigateToRoute(getRouteFromHash());
});
