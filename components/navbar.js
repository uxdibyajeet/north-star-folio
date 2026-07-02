(function () {
  async function renderNavbar(container = ".app") {
    const target =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    if (!target) {
      console.warn("Navbar target not found.");
      return;
    }

    if (!target.querySelector(".navbar-shell")) {
      target.innerHTML = `
        <div class="navbar-shell"></div>
        <main class="page-content"></main>
      `;
    }

    const navbarHost = target.querySelector(".navbar-shell");
    const response = await fetch("./components/navbar.html");
    if (!response.ok) {
      throw new Error("Failed to load navbar component");
    }

    navbarHost.innerHTML = await response.text();

    const toggleButton = navbarHost.querySelector(".nav-toggle");
    const navMenu = navbarHost.querySelector(".nav-menu");

    if (toggleButton && navMenu) {
      toggleButton.addEventListener("click", () => {
        navMenu.classList.toggle("is-open");
        toggleButton.classList.toggle("is-active");
      });

      navbarHost.querySelectorAll(".nav-link, .nav-btn").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("is-open");
          toggleButton.classList.remove("is-active");
        });
      });
    }
  }

  window.renderNavbar = renderNavbar;
})();
