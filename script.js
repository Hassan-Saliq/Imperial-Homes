const assistantConfig = {
  companyName: "Imperial Houses",
  tagline: "D.R Construction & Best Homes",
  assistantName: "Safa AI",
  greeting: "Welcome to Imperial Houses. Ask about services, pricing, projects, or site visits.",
  phone: "+919677555912",
  phoneLabel: "+91 96775 55912",
  whatsappNumber: "919677555912",
  ownerWhatsappTemplate: "Hi, I want to discuss a project with Imperial Homes",
  email: "info.imperialhomes@gmail.com",
  promptChips: ["Project pricing", "Luxury construction", "Joint venture", "Talk to owner"],
};

const sessionKey = "imperial-ai-session-id";
const stateKey = "imperial-ai-chat-state";
const transitionStorageKey = "imperial-page-transition";
const transitionStartedAtKey = "imperial-page-transition-started-at";
const transitionDurationMs = 1100;
const transitionNavigateDelayMs = 80;
const currentPage = document.body.dataset.page || "home";
const isTransitioningPage = document.documentElement.classList.contains("is-transitioning-page");

const assistantState = {
  sessionId: "",
  history: [],
  messages: [],
  isPending: false,
};

const loader = document.querySelector(".page-loader");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const topbar = document.querySelector(".topbar");
const prefetchedPages = new Set();
let isNavigating = false;
let lastScrollY = window.scrollY;
let typingIndicator = null;

const whatsappIcon = `
  <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
    <path d="M27.3 4.6A15.17 15.17 0 0 0 16.5 0C8 0 1.1 6.9 1.1 15.4c0 2.7.7 5.3 2 7.7L0 32l9.2-3A15.34 15.34 0 0 0 16.5 31c8.5 0 15.4-6.9 15.4-15.4 0-4.1-1.6-8-4.6-11ZM16.5 28.4c-2.3 0-4.6-.6-6.6-1.8l-.5-.3-5.5 1.8 1.8-5.3-.3-.5a12.56 12.56 0 0 1-1.9-6.8c0-7.1 5.8-12.9 12.9-12.9 3.5 0 6.7 1.3 9.1 3.8a12.77 12.77 0 0 1 3.8 9.1c0 7.1-5.8 12.9-12.8 12.9Zm7.1-9.7c-.4-.2-2.5-1.2-2.9-1.4-.4-.1-.7-.2-1 .2-.3.4-1.1 1.4-1.4 1.7-.2.3-.5.3-.9.1-.4-.2-1.8-.7-3.3-2.1-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.5-.7.2-.3.1-.6 0-.8-.1-.2-1-2.4-1.4-3.3-.3-.8-.7-.7-1-.7h-.9c-.3 0-.8.1-1.2.6-.4.4-1.5 1.4-1.5 3.5s1.5 4 1.7 4.3c.2.3 3 4.6 7.4 6.4 4.4 1.9 4.4 1.2 5.2 1.1.8-.1 2.5-1 2.8-2 .4-1 .4-1.9.3-2.1-.1-.2-.4-.3-.8-.5Z"></path>
  </svg>
`;

function buildWhatsappLink(message = assistantConfig.ownerWhatsappTemplate) {
  return `https://wa.me/${assistantConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function createSessionId() {
  return `imperial-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function getSessionId() {
  try {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      return stored;
    }
    const sessionId = createSessionId();
    sessionStorage.setItem(sessionKey, sessionId);
    return sessionId;
  } catch {
    return createSessionId();
  }
}

function persistAssistantState() {
  try {
    sessionStorage.setItem(
      stateKey,
      JSON.stringify({
        sessionId: assistantState.sessionId,
        messages: assistantState.messages.slice(-18),
        history: assistantState.history.slice(-12),
      })
    );
  } catch {}
}

function restoreAssistantState() {
  assistantState.sessionId = getSessionId();

  try {
    const raw = sessionStorage.getItem(stateKey);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    assistantState.messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    assistantState.history = Array.isArray(parsed.history) ? parsed.history : [];
  } catch {
    assistantState.messages = [];
    assistantState.history = [];
  }
}

function mountAssistant() {
  document.querySelectorAll(".chat-widget, .whatsapp-float, .call-float, .floating-contact-stack").forEach((node) => {
    node.remove();
  });

  const stack = document.createElement("div");
  stack.className = "floating-contact-stack";
  stack.innerHTML = `
    <div class="chat-widget" data-ai-assistant>
      <div id="chat-panel" class="chat-panel" aria-hidden="true" role="dialog" aria-label="${assistantConfig.assistantName}">
        <div class="chat-panel-header">
          <div class="chat-panel-brand">
            <span class="chat-panel-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M12 1.5 14.6 8.9 22 11.5l-7.4 2.6L12 21.5l-2.6-7.4L2 11.5l7.4-2.6L12 1.5Z"></path>
              </svg>
            </span>
            <div>
              <strong>${assistantConfig.assistantName}</strong>
              <span data-chat-status>Luxury construction concierge</span>
            </div>
          </div>
          <button class="chat-close" type="button" aria-label="Close assistant">x</button>
        </div>
        <div class="chat-quick-actions">
          ${assistantConfig.promptChips
            .map((chip) => `<button class="chat-chip" type="button" data-quick-message="${chip}">${chip}</button>`)
            .join("")}
        </div>
        <div class="chat-messages" data-chat-messages aria-live="polite"></div>
        <form class="chat-form" data-chat-form>
          <label class="chat-input-wrap">
            <span class="sr-only">Ask ${assistantConfig.assistantName}</span>
            <input class="chat-input" data-chat-input type="text" name="message" placeholder="Ask about pricing, projects, services, or contact..." autocomplete="off" required>
          </label>
          <button class="chat-send" type="submit">Send</button>
        </form>
      </div>
      <button class="chat-toggle action-float" type="button" aria-expanded="false" aria-controls="chat-panel" aria-label="Open ${assistantConfig.assistantName}">
        <span class="chat-toggle-glow" aria-hidden="true"></span>
        <span class="chat-toggle-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 1.5 14.6 8.9 22 11.5l-7.4 2.6L12 21.5l-2.6-7.4L2 11.5l7.4-2.6L12 1.5Z"></path>
          </svg>
        </span>
        <span class="float-label" aria-hidden="true">Hover to chat</span>
      </button>
    </div>
    <div class="action-float" data-hover-popup>
      <a class="whatsapp-float" href="${buildWhatsappLink()}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Imperial Houses on WhatsApp">
        ${whatsappIcon}
        <span class="float-label" aria-hidden="true">WhatsApp</span>
      </a>
      <div class="contact-popup" aria-hidden="true">
        <p>Start a project discussion directly on WhatsApp.</p>
        <a class="contact-popup-link" href="${buildWhatsappLink()}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
      </div>
    </div>
    <div class="action-float" data-hover-popup>
      <a class="call-float" href="tel:${assistantConfig.phone}" aria-label="Contact Imperial Houses at ${assistantConfig.phoneLabel}">
        <span>Call</span>
        <span class="float-label" aria-hidden="true">Call us</span>
      </a>
      <div class="contact-popup" aria-hidden="true">
        <p>Speak to the team directly at ${assistantConfig.phoneLabel}.</p>
        <a class="contact-popup-link" href="tel:${assistantConfig.phone}">Call now</a>
      </div>
    </div>
  `;

  document.body.append(stack);
}

function setChatStatus(message) {
  const chatStatus = document.querySelector("[data-chat-status]");
  if (chatStatus) {
    chatStatus.textContent = message;
  }
}

function scrollMessagesToBottom() {
  const container = document.querySelector("[data-chat-messages]");
  if (!container) {
    return;
  }
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function renderMessage(role, payload, options = {}) {
  const container = document.querySelector("[data-chat-messages]");
  if (!container || !payload || !payload.content) {
    return null;
  }

  const message = document.createElement("div");
  message.className = `chat-message chat-message-${role}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble";

  const content = document.createElement("div");
  content.textContent = payload.content;
  bubble.append(content);

  if (Array.isArray(payload.actions) && payload.actions.length) {
    const actions = document.createElement("div");
    actions.className = "chat-message-actions";
    payload.actions.forEach((action) => {
      const link = document.createElement("a");
      link.href = action.url;
      link.textContent = action.label;
      if (action.targetBlank !== false) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actions.append(link);
    });
    bubble.append(actions);
  }

  message.append(bubble);
  container.append(message);

  if (options.persist !== false) {
    assistantState.messages.push({ role, ...payload });
    if ((role === "assistant" || role === "user") && options.toHistory !== false) {
      assistantState.history.push({ role, content: payload.content });
    }
    persistAssistantState();
  }

  scrollMessagesToBottom();
  return message;
}

function showTypingIndicator() {
  removeTypingIndicator();
  const container = document.querySelector("[data-chat-messages]");
  if (!container) {
    return;
  }
  typingIndicator = document.createElement("div");
  typingIndicator.className = "chat-message chat-message-assistant chat-message-typing";
  typingIndicator.innerHTML = `<div class="chat-message-bubble"><span></span><span></span><span></span></div>`;
  container.append(typingIndicator);
  scrollMessagesToBottom();
}

function removeTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.remove();
    typingIndicator = null;
  }
}

function restoreAssistantMessages() {
  const container = document.querySelector("[data-chat-messages]");
  if (!container) {
    return;
  }
  container.innerHTML = "";

  if (!assistantState.messages.length) {
    renderMessage("assistant", { content: assistantConfig.greeting });
    setChatStatus("Ready to assist");
    return;
  }

  assistantState.messages.forEach((message) => {
    renderMessage(message.role, { content: message.content, actions: message.actions }, { persist: false, toHistory: false });
  });
}

function setChatOpen(isOpen) {
  const panel = document.querySelector(".chat-panel");
  const toggle = document.querySelector(".chat-toggle");
  if (!panel || !toggle) {
    return;
  }

  panel.classList.toggle("is-open", isOpen);
  panel.setAttribute("aria-hidden", String(!isOpen));
  toggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    document.querySelector("[data-chat-input]")?.focus();
    scrollMessagesToBottom();
  }
}

function bindHoverPanel(root, panel, openDelay = 80, closeDelay = 140) {
  let openTimer = 0;
  let closeTimer = 0;

  const open = () => {
    clearTimeout(closeTimer);
    openTimer = window.setTimeout(() => {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      if (panel.classList.contains("chat-panel")) {
        setChatOpen(true);
      }
    }, openDelay);
  };

  const close = () => {
    clearTimeout(openTimer);
    closeTimer = window.setTimeout(() => {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      if (panel.classList.contains("chat-panel")) {
        setChatOpen(false);
      }
    }, closeDelay);
  };

  [root, panel].forEach((node) => {
    node.addEventListener("mouseenter", open);
    node.addEventListener("mouseleave", close);
    node.addEventListener("focusin", open);
    node.addEventListener("focusout", (event) => {
      const related = event.relatedTarget;
      if (!(related instanceof Node) || (!root.contains(related) && !panel.contains(related))) {
        close();
      }
    });
  });
}

function attachAssistantEvents() {
  const assistantRoot = document.querySelector("[data-ai-assistant]");
  const panel = assistantRoot?.querySelector(".chat-panel");
  const toggle = assistantRoot?.querySelector(".chat-toggle");
  const closeButton = assistantRoot?.querySelector(".chat-close");
  const form = assistantRoot?.querySelector("[data-chat-form]");
  const input = assistantRoot?.querySelector("[data-chat-input]");
  const chips = assistantRoot?.querySelectorAll("[data-quick-message]");

  if (!assistantRoot || !panel || !toggle) {
    return;
  }

  bindHoverPanel(toggle, panel);

  document.querySelectorAll("[data-hover-popup]").forEach((popupRoot) => {
    const popup = popupRoot.querySelector(".contact-popup");
    const trigger = popupRoot.querySelector("a,button");
    if (popup && trigger) {
      bindHoverPanel(trigger, popup, 60, 120);
    }
  });

  closeButton?.addEventListener("click", () => setChatOpen(false));

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input) {
      return;
    }
    const message = input.value;
    input.value = "";
    submitAssistantMessage(message);
  });

  chips?.forEach((chip) => {
    chip.addEventListener("click", () => {
      submitAssistantMessage(chip.getAttribute("data-quick-message") || "");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setChatOpen(false);
    }
  });
}

async function submitAssistantMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message || assistantState.isPending) {
    return;
  }

  renderMessage("user", { content: message });
  assistantState.isPending = true;
  setChatStatus("Thinking...");
  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: assistantState.history.slice(-8),
        page: currentPage,
        path: window.location.pathname,
        sessionId: assistantState.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed with ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();

    const payload = {
      content: String(data.reply || "Tell me what you need and I will guide you."),
      actions: Array.isArray(data.actions) ? data.actions : [],
    };

    renderMessage("assistant", payload);
    setChatStatus(data.shouldNotify ? "Owner notified" : "Ready to assist");

    if (data.action?.type === "whatsapp" && data.action.url) {
      window.setTimeout(() => {
        window.open(data.action.url, "_blank", "noopener,noreferrer");
      }, 160);
    }
  } catch {
    removeTypingIndicator();
    const fallbackUrl = buildWhatsappLink();
    renderMessage("assistant", {
      content: "I can help with services, pricing, projects, or owner contact. If you want, I can move this to WhatsApp.",
      actions: [{ label: "Open WhatsApp", url: fallbackUrl }],
    });
    setChatStatus("Offline fallback active");
  } finally {
    assistantState.isPending = false;
  }
}

function attachJointVentureFormHandler() {
  const form = document.querySelector(".joint-venture-form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  let statusMessage = form.querySelector(".form-status");
  if (!(statusMessage instanceof HTMLElement)) {
    statusMessage = document.createElement("p");
    statusMessage.className = "form-status";
    form.append(statusMessage);
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const defaultLabel = submitButton?.textContent || "Submit Enquiry";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "joint-venture-form",
          page: currentPage,
          path: window.location.pathname,
          sessionId: assistantState.sessionId,
          formData: Object.fromEntries(new FormData(form).entries()),
        }),
      });

      if (!response.ok) {
        throw new Error("Lead request failed");
      }

      const data = await response.json();
      statusMessage.textContent = data.message || "Thanks. Our team will contact you shortly.";
      form.reset();
    } catch {
      statusMessage.textContent = `We could not submit this right now. Please call ${assistantConfig.phoneLabel}.`;
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    }
  });
}

function setupLetterAnimations() {
  const words = document.querySelectorAll("[data-letter-fx]");
  words.forEach((word, wordIndex) => {
    const text = (word.textContent || "").trim();
    if (!text || word.dataset.letterReady === "1") {
      return;
    }
    word.dataset.letterReady = "1";
    word.classList.add("split-word");
    word.textContent = "";
    [...text].forEach((character, characterIndex) => {
      const span = document.createElement("span");
      span.className = "split-char";
      span.textContent = character;
      span.style.animationDelay = `${wordIndex * 180 + characterIndex * 45}ms`;
      word.append(span);
    });
  });

  const revealWords = () => words.forEach((word) => word.classList.add("is-visible"));
  if (document.readyState === "complete") {
    setTimeout(revealWords, 220);
  } else {
    window.addEventListener("load", () => setTimeout(revealWords, 220), { once: true });
  }
}

function setupRevealAnimations() {
  const items = document.querySelectorAll(".reveal, .text-fade");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((item) => observer.observe(item));
}

function setupTextAnimations() {
  document
    .querySelectorAll("header a, header button, main h1, main h2, main h3, main p, main li, main span, footer h3, footer p, footer a")
    .forEach((node, index) => {
      if (node.closest(".chat-panel, .float-label, .contact-popup")) {
        return;
      }
      node.classList.add("text-fade");
      node.style.setProperty("--text-fade-delay", `${Math.min(index * 18, 320)}ms`);
    });
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-counter-target]");
  if (!counters.length) {
    return;
  }

  const animateCounter = (element) => {
    const target = Number(element.getAttribute("data-counter-target"));
    if (!Number.isFinite(target) || element.dataset.counted === "1") {
      return;
    }

    element.dataset.counted = "1";
    const duration = Math.min(1800, 900 + target * 4);
    let startTime = 0;

    const frame = (time) => {
      if (!startTime) {
        startTime = time;
      }
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(target * eased);
      if (element.textContent !== String(nextValue)) {
        element.textContent = String(nextValue);
      }
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupParallax() {
  const nodes = document.querySelectorAll(".hero-video, .hero-orb, .hero-card");
  if (!nodes.length) {
    return;
  }

  const update = () => {
    const scrollY = window.scrollY || 0;
    nodes.forEach((node) => {
      if (node.classList.contains("hero-video")) {
        node.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0) scale(1.06)`;
        return;
      }

      if (node.classList.contains("hero-card")) {
        node.style.transform = `translate3d(0, ${scrollY * -0.03}px, 0)`;
        return;
      }

      node.style.transform = `translate3d(0, ${scrollY * 0.05}px, 0)`;
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function prefetchPage(url) {
  if (prefetchedPages.has(url.href)) {
    return;
  }
  prefetchedPages.add(url.href);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url.href;
  link.as = "document";
  document.head.append(link);
}

function shouldHandleAsInternalPage(url, link) {
  return url.origin === window.location.origin && !link.hasAttribute("download") && link.target !== "_blank";
}

function showPageTransition(href) {
  if (isNavigating) {
    return;
  }
  isNavigating = true;
  try {
    sessionStorage.setItem(transitionStorageKey, "1");
    sessionStorage.setItem(transitionStartedAtKey, String(Date.now()));
  } catch {}

  document.documentElement.classList.add("is-transitioning-page");
  loader?.classList.remove("is-hidden");
  loader?.classList.add("is-transitioning");

  setTimeout(() => {
    window.location.href = href;
  }, transitionNavigateDelayMs);
}

function finishPageEntry() {
  if (!isTransitioningPage) {
    loader?.classList.add("is-hidden");
    return;
  }

  const startedAt = Number(sessionStorage.getItem(transitionStartedAtKey));
  const remainingMs =
    Number.isFinite(startedAt) && startedAt > 0 ? Math.max(0, transitionDurationMs - (Date.now() - startedAt)) : transitionDurationMs;

  setTimeout(() => {
    loader?.classList.add("is-hidden");
    loader?.classList.remove("is-transitioning");
    document.documentElement.classList.remove("is-transitioning-page");
    try {
      sessionStorage.removeItem(transitionStorageKey);
      sessionStorage.removeItem(transitionStartedAtKey);
    } catch {}
  }, remainingMs);
}

function setupNavigation() {
  if (currentPage) {
    document.querySelector(`[data-nav="${currentPage}"]`)?.classList.add("is-active");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });
  }

  navLinks.forEach((link) => {
    const url = new URL(link.href, window.location.href);

    link.addEventListener("mouseenter", () => {
      if (shouldHandleAsInternalPage(url, link)) {
        prefetchPage(url);
      }
    });

    link.addEventListener("click", (event) => {
      if (isNavigating || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      if (!shouldHandleAsInternalPage(url, link)) {
        return;
      }

      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      showPageTransition(url.href);
    });

    link.addEventListener("click", () => {
      siteNav?.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });
}

function setupTopbarScroll() {
  window.addEventListener(
    "scroll",
    () => {
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
    },
    { passive: true }
  );
}

mountAssistant();
restoreAssistantState();
restoreAssistantMessages();
attachAssistantEvents();
attachJointVentureFormHandler();
setupNavigation();
setupTopbarScroll();
setupLetterAnimations();
setupTextAnimations();
setupRevealAnimations();
setupCounters();
setupParallax();

if (isTransitioningPage) {
  loader?.classList.remove("is-hidden");
  loader?.classList.add("is-transitioning");
}

window.addEventListener("load", finishPageEntry, { once: true });
window.addEventListener("pageshow", finishPageEntry);
