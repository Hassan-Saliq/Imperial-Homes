const loader = document.querySelector(".page-loader");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const currentPage = document.body.dataset.page;
const topbar = document.querySelector(".topbar");
const chatToggle = document.querySelector(".chat-toggle");
const chatPanel = document.querySelector(".chat-panel");
let lastScrollY = window.scrollY;

window.addEventListener("load", () => {
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
  }, 650);
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });
}

if (currentPage) {
  const activeLink = document.querySelector(`[data-nav="${currentPage}"]`);
  activeLink?.classList.add("is-active");
}

if (chatToggle && chatPanel) {
  chatToggle.addEventListener("click", () => {
    const isOpen = chatPanel.classList.toggle("is-open");
    chatToggle.setAttribute("aria-expanded", String(isOpen));
    chatPanel.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("chat-open", isOpen);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!chatPanel.contains(target) && !chatToggle.contains(target)) {
      chatPanel.classList.remove("is-open");
      chatToggle.setAttribute("aria-expanded", "false");
      chatPanel.setAttribute("aria-hidden", "true");
      document.body.classList.remove("chat-open");
    }
  });
}

window.addEventListener("scroll", () => {
  if (!topbar || document.body.classList.contains("menu-open")) {
    return;
  }

  const currentScrollY = window.scrollY;

  if (currentScrollY <= 16) {
    topbar.classList.remove("topbar-hidden");
    lastScrollY = currentScrollY;
    return;
  }

  if (currentScrollY > lastScrollY && currentScrollY > 120) {
    topbar.classList.add("topbar-hidden");
  } else if (currentScrollY < lastScrollY) {
    topbar.classList.remove("topbar-hidden");
  }

  lastScrollY = currentScrollY;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));
