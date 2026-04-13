const loader = document.querySelector(".page-loader");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const currentPage = document.body.dataset.page;
const topbar = document.querySelector(".topbar");
const chatToggle = document.querySelector(".chat-toggle");
const chatPanel = document.querySelector(".chat-panel");
const prefetchedPages = new Set();
const transitionStorageKey = "imperial-page-transition";
const isTransitioningPage = document.documentElement.classList.contains("is-transitioning-page");
let lastScrollY = window.scrollY;

const hideLoader = () => {
  loader?.classList.add("is-hidden");
  loader?.classList.remove("is-transitioning");
  document.body.classList.remove("is-leaving");
};

const finishPageEntry = () => {
  window.setTimeout(() => {
    hideLoader();
    document.documentElement.classList.remove("is-transitioning-page");
    document.body.classList.remove("is-entering");
    try {
      sessionStorage.removeItem(transitionStorageKey);
    } catch (error) {
      // Ignore storage failures and continue with the transition.
    }
  }, isTransitioningPage ? 320 : 0);
};

if (isTransitioningPage) {
  loader?.classList.remove("is-hidden");
  loader?.classList.add("is-transitioning");
  document.body.classList.add("is-entering");
}

window.addEventListener("load", finishPageEntry);
window.addEventListener("pageshow", finishPageEntry);

const showPageTransition = (href) => {
  if (!loader) {
    window.location.href = href;
    return;
  }

  try {
    sessionStorage.setItem(transitionStorageKey, "1");
  } catch (error) {
    // Ignore storage failures and continue with navigation.
  }

  document.body.classList.add("is-leaving");
  loader.classList.remove("is-hidden");
  loader.classList.add("is-transitioning");
  window.setTimeout(() => {
    window.location.href = href;
  }, 260);
};

const prefetchPage = (url) => {
  if (prefetchedPages.has(url.href)) {
    return;
  }

  prefetchedPages.add(url.href);

  const prefetchLink = document.createElement("link");
  prefetchLink.rel = "prefetch";
  prefetchLink.href = url.href;
  prefetchLink.as = "document";
  document.head.append(prefetchLink);
};

const shouldHandleAsInternalPage = (url, link) =>
  url.origin === window.location.origin &&
  (url.protocol === "http:" || url.protocol === "https:") &&
  !link.hasAttribute("download") &&
  link.target !== "_blank";

const prefetchAllInternalPages = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.href);

    if (shouldHandleAsInternalPage(url, link) && url.pathname !== window.location.pathname) {
      prefetchPage(url);
    }
  });
};

document.querySelectorAll("a[href]").forEach((link) => {
  const linkUrl = new URL(link.href, window.location.href);

  if (shouldHandleAsInternalPage(linkUrl, link)) {
    link.addEventListener("mouseenter", () => prefetchPage(linkUrl), { passive: true });
    link.addEventListener("touchstart", () => prefetchPage(linkUrl), { passive: true, once: true });
  }

  link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (!shouldHandleAsInternalPage(url, link)) {
      return;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
      return;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) {
      return;
    }

    event.preventDefault();
    showPageTransition(url.href);
  });
});

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(prefetchAllInternalPages, { timeout: 1200 });
} else {
  window.setTimeout(prefetchAllInternalPages, 800);
}

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
