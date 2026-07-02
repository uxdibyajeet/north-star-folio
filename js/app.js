const routeMap = {
  "/": "home",
  "/home": "home",
  "/home.html": "home",
  "/about": "about",
  "/about.html": "about",
  "/admin": "admin",
  "/admin.html": "admin",
};

function renderPage(pageName) {
  const appRoot = document.querySelector(".app");
  const contentHost = appRoot?.querySelector(".page-content");

  if (!contentHost) {
    return;
  }

  fetch(`./pages/${pageName}.html`)
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

function navigateToRoute(pathname = window.location.pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const pageName = routeMap[normalizedPath] || routeMap["/"];

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
    history.pushState({}, "", nextPath);
    navigateToRoute(nextPath);
  });

  window.addEventListener("popstate", () => {
    navigateToRoute(window.location.pathname);
  });

  navigateToRoute(window.location.pathname);
});
