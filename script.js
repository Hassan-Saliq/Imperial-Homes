const assistantConfig = {
  companyName: "Imperial Houses",
  tagline: "D.R Construction & Best Homes",
  assistantName: "Safa AI",
  greeting: "Welcome to Imperial Houses. I'm Safa, your AI assistant. How can I help you today?",
  autoGreetingDelayMs: 1200,
  phone: "+919677555912",
  phoneLabel: "+91 96775 55912",
  whatsappNumber: "919677555912",
  whatsappMessage:
    "Hello Imperial Houses, I would like to know more about your premium construction services and projects.",
  email: "info.imperialhomes@gmail.com",
  promptChips: [
    "Luxury home construction",
    "Renovation and interiors",
    "Joint venture projects",
    "Book a site visit",
  ],
};

const assistantSessionKey = "imperial-ai-session-id";
const assistantStateKey = "imperial-ai-chat-state";
const assistantAutoGreetKey = "imperial-ai-greeted";

const whatsappIcon = `
  <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
    <path d="M27.3 4.6A15.17 15.17 0 0 0 16.5 0C8 0 1.1 6.9 1.1 15.4c0 2.7.7 5.3 2 7.7L0 32l9.2-3A15.34 15.34 0 0 0 16.5 31c8.5 0 15.4-6.9 15.4-15.4 0-4.1-1.6-8-4.6-11ZM16.5 28.4c-2.3 0-4.6-.6-6.6-1.8l-.5-.3-5.5 1.8 1.8-5.3-.3-.5a12.56 12.56 0 0 1-1.9-6.8c0-7.1 5.8-12.9 12.9-12.9 3.5 0 6.7 1.3 9.1 3.8a12.77 12.77 0 0 1 3.8 9.1c0 7.1-5.8 12.9-12.8 12.9Zm7.1-9.7c-.4-.2-2.5-1.2-2.9-1.4-.4-.1-.7-.2-1 .2-.3.4-1.1 1.4-1.4 1.7-.2.3-.5.3-.9.1-.4-.2-1.8-.7-3.3-2.1-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.5-.7.2-.3.1-.6 0-.8-.1-.2-1-2.4-1.4-3.3-.3-.8-.7-.7-1-.7h-.9c-.3 0-.8.1-1.2.6-.4.4-1.5 1.4-1.5 3.5s1.5 4 1.7 4.3c.2.3 3 4.6 7.4 6.4 4.4 1.9 4.4 1.2 5.2 1.1.8-.1 2.5-1 2.8-2 .4-1 .4-1.9.3-2.1-.1-.2-.4-.3-.8-.5Z"></path>
  </svg>
`;

const mountAssistant = () => {
  document.querySelectorAll(".chat-widget, .whatsapp-float, .call-float, .floating-contact-stack").forEach((node) => {
    node.remove();
  });

  const stack = document.createElement("div");
  stack.className = "floating-contact-stack";

  const whatsappHref = `https://wa.me/${assistantConfig.whatsappNumber}?text=${encodeURIComponent(
    assistantConfig.whatsappMessage
  )}`;

  stack.innerHTML = `
    <div class="chat-widget" data-ai-assistant>
      <div id="chat-panel" class="chat-panel" aria-hidden="true" role="dialog" aria-label="${assistantConfig.assistantName}">
        <div class="chat-panel-header">
          <div class="chat-panel-brand">
            <span class="chat-panel-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M12 1.5 14.5 9l7.5 2.5-7.5 2.5L12 21.5 9.5 14 2 11.5 9.5 9 12 1.5Z"></path>
              </svg>
            </span>
            <div>
              <strong>${assistantConfig.assistantName}</strong>
              <span data-chat-status>Premium construction assistant</span>
            </div>
          </div>
          <button class="chat-close" type="button" aria-label="Close assistant">x</button>
        </div>

        <div class="chat-quick-actions" aria-label="Suggested questions">
          ${assistantConfig.promptChips
            .map(
              (chip) =>
                `<button class="chat-chip" type="button" data-quick-message="${chip}">${chip}</button>`
            )
            .join("")}
        </div>

        <div class="chat-messages" data-chat-messages aria-live="polite"></div>

        <form class="chat-form" data-chat-form>
          <label class="chat-input-wrap">
            <span class="sr-only">Ask ${assistantConfig.assistantName}</span>
            <input
              class="chat-input"
              data-chat-input
              type="text"
              name="message"
              placeholder="Ask about services, projects, pricing, or site visits..."
              autocomplete="off"
              required
            >
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
        <span class="chat-toggle-text">AI</span>
        <span class="float-label" aria-hidden="true">Safa AI</span>
      </button>
    </div>

    <a
      class="whatsapp-float action-float"
      href="${whatsappHref}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Imperial Houses on WhatsApp"
    >
      ${whatsappIcon}
      <span class="float-label" aria-hidden="true">Chat with WhatsApp</span>
    </a>

    <a class="call-float action-float" href="tel:${assistantConfig.phone}" aria-label="Contact Imperial Houses at ${assistantConfig.phoneLabel}">
      <span>Call</span>
      <span class="float-label" aria-hidden="true">Contact Us</span>
    </a>
  `;

  document.body.append(stack);
};

mountAssistant();

const loader = document.querySelector(".page-loader");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const currentPage = document.body.dataset.page;
const topbar = document.querySelector(".topbar");
const assistantRoot = document.querySelector("[data-ai-assistant]");
const chatToggle = assistantRoot?.querySelector(".chat-toggle");
const chatPanel = assistantRoot?.querySelector(".chat-panel");
const chatClose = assistantRoot?.querySelector(".chat-close");
const chatMessages = assistantRoot?.querySelector("[data-chat-messages]");
const chatForm = assistantRoot?.querySelector("[data-chat-form]");
const chatInput = assistantRoot?.querySelector("[data-chat-input]");
const chatStatus = assistantRoot?.querySelector("[data-chat-status]");
const chatChips = assistantRoot?.querySelectorAll("[data-quick-message]");
const prefetchedPages = new Set();
const transitionStorageKey = "imperial-page-transition";
const transitionStartedAtKey = "imperial-page-transition-started-at";
const transitionDurationMs = 1100;
const transitionNavigateDelayMs = 80;
const isTransitioningPage = document.documentElement.classList.contains("is-transitioning-page");
let lastScrollY = window.scrollY;
let hasFinishedPageEntry = false;
let isNavigating = false;
let typingIndicator = null;

const assistantState = {
  sessionId: "",
  history: [],
  messages: [],
  isRequestPending: false,
};

const isInputLocked = () =>
  isNavigating || document.documentElement.classList.contains("is-transitioning-page");

const getTransitionRemainingMs = () => {
  if (!isTransitioningPage) {
    return 0;
  }

  try {
    const startedAt = Number(sessionStorage.getItem(transitionStartedAtKey));
    if (Number.isFinite(startedAt) && startedAt > 0) {
      return Math.max(0, transitionDurationMs - (Date.now() - startedAt));
    }
  } catch (error) {}

  return transitionDurationMs;
};

const hideLoader = () => {
  loader?.classList.add("is-hidden");
  loader?.classList.remove("is-transitioning");
  loader?.style.removeProperty("--loader-duration");
};

const finishPageEntry = () => {
  if (!isTransitioningPage || hasFinishedPageEntry) {
    hideLoader();
    return;
  }

  hasFinishedPageEntry = true;
  const remainingMs = getTransitionRemainingMs();
  loader?.style.setProperty("--loader-duration", `${remainingMs}ms`);

  window.setTimeout(() => {
    hideLoader();
    document.documentElement.classList.remove("is-transitioning-page");
    try {
      sessionStorage.removeItem(transitionStorageKey);
      sessionStorage.removeItem(transitionStartedAtKey);
    } catch (error) {}
  }, remainingMs);
};

const showPageTransition = (href) => {
  if (isNavigating) {
    return;
  }

  isNavigating = true;

  if (!loader) {
    window.location.href = href;
    return;
  }

  try {
    sessionStorage.setItem(transitionStorageKey, "1");
    sessionStorage.setItem(transitionStartedAtKey, String(Date.now()));
  } catch (error) {}

  document.documentElement.classList.add("is-transitioning-page");
  loader.classList.remove("is-hidden");
  loader.classList.add("is-transitioning");
  loader.style.setProperty("--loader-duration", `${transitionDurationMs}ms`);
  window.setTimeout(() => {
    window.location.href = href;
  }, transitionNavigateDelayMs);
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

const setChatStatus = (message) => {
  if (chatStatus) {
    chatStatus.textContent = message;
  }
};

const createSessionId = () =>
  `imperial-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const getAssistantSessionId = () => {
  try {
    const stored = sessionStorage.getItem(assistantSessionKey);
    if (stored) {
      return stored;
    }
    const sessionId = createSessionId();
    sessionStorage.setItem(assistantSessionKey, sessionId);
    return sessionId;
  } catch (error) {
    return createSessionId();
  }
};

const persistAssistantState = () => {
  try {
    sessionStorage.setItem(
      assistantStateKey,
      JSON.stringify({
        sessionId: assistantState.sessionId,
        messages: assistantState.messages.slice(-18),
        history: assistantState.history.slice(-12),
      })
    );
  } catch (error) {}
};

const restoreAssistantState = () => {
  assistantState.sessionId = getAssistantSessionId();

  try {
    const rawState = sessionStorage.getItem(assistantStateKey);
    if (!rawState) {
      return;
    }

    const parsed = JSON.parse(rawState);
    if (Array.isArray(parsed.messages)) {
      assistantState.messages = parsed.messages.filter(
        (entry) => entry && typeof entry.role === "string" && typeof entry.content === "string"
      );
    }

    if (Array.isArray(parsed.history)) {
      assistantState.history = parsed.history.filter(
        (entry) => entry && typeof entry.role === "string" && typeof entry.content === "string"
      );
    }
  } catch (error) {
    assistantState.messages = [];
    assistantState.history = [];
  }
};

const scrollMessagesToBottom = () => {
  if (!chatMessages) {
    return;
  }

  window.requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
};

const renderMessage = (role, content, options = {}) => {
  if (!chatMessages || !content) {
    return null;
  }

  const message = document.createElement("div");
  message.className = `chat-message chat-message-${role}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble";
  bubble.textContent = content;
  message.append(bubble);
  chatMessages.append(message);

  if (options.persist !== false) {
    assistantState.messages.push({ role, content });

    if ((role === "user" || role === "assistant") && options.toHistory !== false) {
      assistantState.history.push({ role, content });
    }

    persistAssistantState();
  }

  scrollMessagesToBottom();
  return message;
};

const removeTypingIndicator = () => {
  if (typingIndicator) {
    typingIndicator.remove();
    typingIndicator = null;
  }
};

const showTypingIndicator = () => {
  removeTypingIndicator();

  if (!chatMessages) {
    return;
  }

  typingIndicator = document.createElement("div");
  typingIndicator.className = "chat-message chat-message-assistant chat-message-typing";
  typingIndicator.innerHTML = `
    <div class="chat-message-bubble">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.append(typingIndicator);
  scrollMessagesToBottom();
};

const getFallbackReply = (message) => {
  const normalizedMessage = message.trim().toLowerCase();
  const greetingPattern = /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i;
  const strongIntentPattern =
    /\b(buy|price|cost|invest|investment|contact|call|visit|site visit|book|booking|quote|estimate|interested)\b/;

  if (!assistantState.history.some((entry) => entry.role === "user") || greetingPattern.test(normalizedMessage)) {
    return "Welcome to Imperial Houses. I'm Safa, your AI assistant. How can I help you today?";
  }

  if (strongIntentPattern.test(normalizedMessage)) {
    return "That is great. Our team will contact you shortly.";
  }

  if (/\b(joint venture|joint-venture|landowner|land owner|property owner|develop my land)\b/.test(normalizedMessage)) {
    return "Imperial Houses supports joint venture development for landowners with planning, approvals, construction, branding, and sales coordination.";
  }

  if (/\b(price|cost|budget|quote|estimate)\b/.test(normalizedMessage)) {
    return "Pricing depends on scope, location, specifications, and finish level. Share your requirement and our team can guide you on the best next step.";
  }

  if (/\b(ongoing|completed|project|projects|apartment)\b/.test(normalizedMessage)) {
    return "Current highlights include Imperial Regal in Thiruvanmiyur, Imperial Royale in Nanganallur, and Imperial Park along the ECR belt.";
  }

  if (/\b(service|construction|build|home|renovation|interior|interiors|property development)\b/.test(normalizedMessage)) {
    return "Imperial Houses supports construction, interiors, renovation, project management, total-home solutions, and premium residential development.";
  }

  return "Imperial Houses can help with premium construction services, project guidance, joint venture opportunities, pricing direction, and site visit coordination.";
};

const restoreAssistantMessages = () => {
  if (!chatMessages) {
    return;
  }

  chatMessages.innerHTML = "";

  if (!assistantState.messages.length) {
    renderMessage("assistant", assistantConfig.greeting);
    setChatStatus("Ready to assist");
    return;
  }

  assistantState.messages.forEach((message) => {
    renderMessage(message.role, message.content, {
      persist: false,
      toHistory: false,
    });
  });

  scrollMessagesToBottom();
};

const setChatOpen = (isOpen) => {
  if (!chatPanel || !chatToggle) {
    return;
  }

  chatPanel.classList.toggle("is-open", isOpen);
  chatPanel.setAttribute("aria-hidden", String(!isOpen));
  chatToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("chat-open", isOpen && window.innerWidth <= 640);

  if (isOpen) {
    chatInput?.focus();
    scrollMessagesToBottom();
  }
};

const autoGreetAssistant = () => {
  if (!chatPanel || !chatToggle) {
    return;
  }

  try {
    if (sessionStorage.getItem(assistantAutoGreetKey) === "1") {
      return;
    }
    sessionStorage.setItem(assistantAutoGreetKey, "1");
  } catch (error) {}

  window.setTimeout(() => {
    setChatOpen(true);
    window.setTimeout(() => setChatOpen(false), 3400);
  }, assistantConfig.autoGreetingDelayMs);
};

const submitAssistantMessage = async (rawMessage) => {
  const message = rawMessage.trim();
  if (!message || assistantState.isRequestPending) {
    return;
  }

  renderMessage("user", message);
  setChatStatus("Thinking...");
  assistantState.isRequestPending = true;
  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    renderMessage("assistant", data.reply || getFallbackReply(message));
    setChatStatus(data.shouldNotify ? "Lead captured" : "Ready to assist");
  } catch (error) {
    removeTypingIndicator();
    renderMessage("assistant", getFallbackReply(message));
    setChatStatus("Offline fallback active");
  } finally {
    assistantState.isRequestPending = false;
  }
};

const attachAssistantEvents = () => {
  if (!assistantRoot || !chatToggle || !chatPanel) {
    return;
  }

  chatToggle.addEventListener("click", () => {
    const isOpen = !chatPanel.classList.contains("is-open");
    setChatOpen(isOpen);
  });

  chatClose?.addEventListener("click", () => {
    setChatOpen(false);
  });

  chatForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!chatInput) {
      return;
    }

    const nextMessage = chatInput.value;
    chatInput.value = "";
    submitAssistantMessage(nextMessage);
  });

  chatChips?.forEach((chip) => {
    chip.addEventListener("click", () => {
      const quickMessage = chip.getAttribute("data-quick-message") || "";
      setChatOpen(true);
      submitAssistantMessage(quickMessage);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!chatPanel.contains(target) && !chatToggle.contains(target)) {
      setChatOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setChatOpen(false);
    }
  });
};

const attachJointVentureFormHandler = () => {
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
  const defaultButtonLabel = submitButton?.textContent || "Submit Enquiry";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = Object.fromEntries(new FormData(form).entries());

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    statusMessage.textContent = "";

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "joint-venture-form",
          page: currentPage,
          path: window.location.pathname,
          sessionId: assistantState.sessionId,
          formData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Lead request failed with ${response.status}`);
      }

      const data = await response.json();
      statusMessage.textContent = data.message || "Thanks. Our team will contact you shortly.";
      form.reset();
    } catch (error) {
      statusMessage.textContent =
        "We could not submit the enquiry right now. Please call +91 96775 55912 or email info.imperialhomes@gmail.com.";
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonLabel;
      }
    }
  });
};

const setupLetterAnimations = () => {
  const words = document.querySelectorAll("[data-letter-fx]");
  words.forEach((word, index) => {
    const text = (word.textContent || "").trim();
    if (!text || word.dataset.letterReady === "1") {
      return;
    }

    word.dataset.letterReady = "1";
    word.classList.add("split-word");
    word.textContent = "";

    [...text].forEach((character, charIndex) => {
      const span = document.createElement("span");
      span.className = "split-char";
      span.textContent = character;
      span.style.animationDelay = `${index * 180 + charIndex * 45}ms`;
      word.append(span);
    });
  });

  const animateWords = () => {
    words.forEach((word) => word.classList.add("is-visible"));
  };

  if (document.readyState === "complete") {
    window.setTimeout(animateWords, 220);
  } else {
    window.addEventListener("load", () => window.setTimeout(animateWords, 220), { once: true });
  }
};

const setupCounters = () => {
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
    const duration = 1700;
    const startTime = performance.now();

    const update = (currentTime) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) {
        window.requestAnimationFrame(update);
      }
    };

    window.requestAnimationFrame(update);
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
    { threshold: 0.55 }
  );

  counters.forEach((counter) => observer.observe(counter));
};

const setupTextAnimations = () => {
  const textNodes = document.querySelectorAll(
    "header a, header button, main h1, main h2, main h3, main p, main li, main span, footer h3, footer p, footer a"
  );

  textNodes.forEach((node, index) => {
    if (node.closest(".chat-panel, .float-label")) {
      return;
    }

    node.classList.add("text-fade");
    node.style.setProperty("--text-fade-delay", `${Math.min(index * 20, 320)}ms`);
  });

  const visibleTextObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          visibleTextObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  textNodes.forEach((node) => {
    if (!node.classList.contains("text-fade")) {
      return;
    }
    visibleTextObserver.observe(node);
  });
};

restoreAssistantState();
restoreAssistantMessages();
attachAssistantEvents();
attachJointVentureFormHandler();
setupLetterAnimations();
setupCounters();
setupTextAnimations();

if (isTransitioningPage) {
  loader?.classList.remove("is-hidden");
  loader?.classList.add("is-transitioning");
  loader?.style.setProperty("--loader-duration", `${getTransitionRemainingMs()}ms`);
}

window.addEventListener("load", () => {
  finishPageEntry();
  autoGreetAssistant();
});
window.addEventListener("pageshow", finishPageEntry);

["pointerdown", "click", "touchend"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    (event) => {
      if (!isInputLocked()) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && loader?.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
});

document.querySelectorAll("a[href]").forEach((link) => {
  const linkUrl = new URL(link.href, window.location.href);

  if (shouldHandleAsInternalPage(linkUrl, link)) {
    link.addEventListener("mouseenter", () => prefetchPage(linkUrl), { passive: true });
    link.addEventListener(
      "touchstart",
      () => {
        prefetchPage(linkUrl);
      },
      {
        passive: true,
        once: true,
      }
    );
  }

  link.addEventListener("click", (event) => {
    if (isNavigating) {
      event.preventDefault();
      return;
    }

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
