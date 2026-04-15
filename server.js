const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const projectRoot = __dirname;
const dataDirectory = path.join(projectRoot, "data");
loadEnvFile(path.join(projectRoot, ".env"));

const businessContext = {
  company: "Imperial Houses",
  tagline: "D.R Construction & Best Homes",
  industry: "Luxury construction and real estate development",
  locations: ["Chennai", "Thiruvanmiyur", "Nanganallur", "ECR Belt"],
  offices: [
    "No. 6, 13th East Street, Kamaraj Nagar, Thiruvanmiyur, Chennai - 600041",
    "No. 12/21, 45th Street, Nanganallur, Chennai - 600061",
  ],
  contacts: {
    phonePrimary: "+91 96775 55912",
    phoneSecondary: "+91 96776 66812",
    email: "info.imperialhomes@gmail.com",
    whatsappNumber: "919677555912",
  },
  services: [
    "Building construction",
    "Luxury interiors",
    "Renovation",
    "Project management",
    "Property development",
    "Joint venture development",
    "Total home solutions",
  ],
  projects: [
    "Imperial Regal in Thiruvanmiyur with 3 BHK apartments",
    "Imperial Royale in Nanganallur with ready-to-occupy 2 and 3 BHK homes",
    "Imperial Park on the ECR belt as a featured layout",
  ],
  process: ["Define", "Design", "Determine", "Develop", "Deliver"],
};

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      return sendJson(response, 200, { ok: true, service: "imperial-homes-site" });
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
      return handleChat(await readJsonBody(request), response);
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/lead") {
      return handleLead(await readJsonBody(request), response);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return serveStaticFile(requestUrl.pathname, response, request.method === "HEAD");
    }

    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`Imperial Houses site running on http://localhost:${port}`);
});

async function handleChat(payload, response) {
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return sendJson(response, 400, { error: "Message is required" });
  }

  const history = Array.isArray(payload?.history)
    ? payload.history.filter((entry) => entry && typeof entry.role === "string" && typeof entry.content === "string").slice(-8)
    : [];

  const analysis = analyzeIntent(message);
  const record = {
    type: "chat",
    createdAt: new Date().toISOString(),
    sessionId: payload?.sessionId || null,
    page: payload?.page || null,
    path: payload?.path || null,
    message,
    history,
    intent: analysis,
  };

  await appendJsonLine("chat-log.jsonl", record);

  let replyPayload = null;
  let usedAi = false;

  try {
    replyPayload = await generateAiReply(message, history, analysis);
    usedAi = Boolean(replyPayload?.reply);
  } catch (error) {
    console.error("AI reply failed:", error.message);
  }

  if (!replyPayload?.reply) {
    replyPayload = generateFallbackReply(message, analysis);
  }

  let notifications = [];
  if (analysis.shouldNotify) {
    notifications = await notifyOwner({
      kind: "chat-intent",
      summary: `New client inquiry: ${message}`,
      details: record,
    });

    await appendJsonLine("lead-log.jsonl", {
      ...record,
      reply: replyPayload.reply,
      usedAi,
      notifications,
    });
  }

  return sendJson(response, 200, {
    reply: replyPayload.reply,
    actions: replyPayload.actions || [],
    action: replyPayload.action || null,
    shouldNotify: analysis.shouldNotify,
    intent: analysis.primaryIntent,
    notifications,
  });
}

async function handleLead(payload, response) {
  const formData = payload?.formData;
  if (!formData || typeof formData !== "object") {
    return sendJson(response, 400, { error: "Form data is required" });
  }

  if (!String(formData.name || "").trim() || !String(formData.phone || "").trim() || !String(formData.email || "").trim()) {
    return sendJson(response, 400, { error: "Name, phone, and email are required" });
  }

  const record = {
    type: "form",
    source: payload?.source || "website-form",
    createdAt: new Date().toISOString(),
    sessionId: payload?.sessionId || null,
    page: payload?.page || null,
    path: payload?.path || null,
    formData,
  };

  await appendJsonLine("form-log.jsonl", record);

  const summary = [
    `New client inquiry: ${formData.name || "Unknown lead"}`,
    formData.phone ? `Phone: ${formData.phone}` : "",
    formData.email ? `Email: ${formData.email}` : "",
    formData.location ? `Location: ${formData.location}` : "",
    formData.land_area ? `Land Area: ${formData.land_area}` : "",
    formData.message ? `Message: ${formData.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const notifications = await notifyOwner({
    kind: "website-form",
    summary,
    details: record,
  });

  return sendJson(response, 200, {
    ok: true,
    message: "Thanks. Our team will contact you shortly.",
    notifications,
  });
}

async function generateAiReply(message, history, analysis) {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const systemPrompt = [
    `You are ${businessContext.company}'s website assistant, also called Safa AI.`,
    "Respond like a polished luxury construction concierge.",
    "Keep replies short, natural, specific, and human.",
    "Do not repeat the same opening every time.",
    `Services: ${businessContext.services.join(", ")}.`,
    `Projects: ${businessContext.projects.join("; ")}.`,
    `Process: ${businessContext.process.join(", ")}.`,
    `Locations: ${businessContext.locations.join(", ")}.`,
    `Offices: ${businessContext.offices.join("; ")}.`,
    `Contacts: ${businessContext.contacts.phonePrimary}, ${businessContext.contacts.phoneSecondary}, ${businessContext.contacts.email}.`,
    "If pricing is asked, explain briefly that pricing depends on scope, location, structural system, and finish level.",
    "If the user wants to contact the owner, asks for WhatsApp, or wants to discuss a project, invite them to continue on WhatsApp in one short sentence.",
    `Detected intent: ${analysis.primaryIntent}.`,
  ].join(" ");

  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 160,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: entry.content,
        })),
        { role: "user", content: message },
      ],
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`OpenAI API error ${aiResponse.status}: ${await aiResponse.text()}`);
  }

  const data = await aiResponse.json();
  const reply = String(data?.choices?.[0]?.message?.content || "").trim();
  const basePayload = { reply };

  if (analysis.contactOwner || analysis.primaryIntent === "contact") {
    return withWhatsappAction(basePayload, message);
  }

  if (analysis.primaryIntent === "pricing") {
    basePayload.actions = [{ label: "Get project guidance", url: buildWhatsappLink("Hi, I want to discuss pricing for my project with Imperial Homes"), targetBlank: true }];
  }

  return basePayload;
}

function analyzeIntent(message) {
  const normalizedMessage = message.toLowerCase();
  const strongIntentPatterns = [
    /\b(price|cost|quote|estimate|book|visit|site visit|interested|contact|call|meeting)\b/,
    /\b(i want|need to|looking to|can we discuss|can we meet|talk to)\b/,
  ];

  const contactOwner =
    /\b(owner|founder|boss|management|team head)\b/.test(normalizedMessage) ||
    /\bwhatsapp\b/.test(normalizedMessage) ||
    /\bdiscuss a project\b/.test(normalizedMessage);

  let primaryIntent = "general";
  if (/\b(joint venture|joint-venture|landowner|land owner|develop my land)\b/.test(normalizedMessage)) {
    primaryIntent = "joint-venture";
  } else if (/\b(price|cost|budget|quote|estimate)\b/.test(normalizedMessage)) {
    primaryIntent = "pricing";
  } else if (/\b(project|projects|ongoing|completed|apartment|royale|regal|park)\b/.test(normalizedMessage)) {
    primaryIntent = "projects";
  } else if (/\b(construction|build|renovation|interior|interiors|service|services|project management)\b/.test(normalizedMessage)) {
    primaryIntent = "services";
  } else if (/\b(contact|call|visit|meeting|site visit|whatsapp|owner)\b/.test(normalizedMessage)) {
    primaryIntent = "contact";
  }

  const isStrongIntent = strongIntentPatterns.some((pattern) => pattern.test(normalizedMessage)) || contactOwner;
  const shouldNotify = isStrongIntent || primaryIntent === "contact";

  return {
    primaryIntent,
    isStrongIntent,
    shouldNotify,
    contactOwner,
  };
}

function generateFallbackReply(message, analysis) {
  const normalizedMessage = message.toLowerCase();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalizedMessage)) {
    return { reply: "Welcome to Imperial Houses. How can I help with your project today?" };
  }

  if (analysis.contactOwner) {
    return withWhatsappAction(
      { reply: "I can connect you to the owner on WhatsApp right away." },
      "Hi, I want to discuss a project with Imperial Homes"
    );
  }

  if (analysis.primaryIntent === "pricing") {
    return {
      reply: "Pricing depends on scope, location, structural requirement, and finish level. Share your project details and we can guide the next step.",
      actions: [{ label: "Discuss pricing", url: buildWhatsappLink("Hi, I want to discuss pricing for my project with Imperial Homes"), targetBlank: true }],
    };
  }

  if (analysis.primaryIntent === "joint-venture") {
    return {
      reply: "We work with landowners on planning, approvals, construction, and sales coordination for joint venture projects.",
      actions: [{ label: "Discuss joint venture", url: buildWhatsappLink("Hi, I want to discuss a joint venture opportunity with Imperial Homes"), targetBlank: true }],
    };
  }

  if (analysis.primaryIntent === "projects") {
    return { reply: `Current highlights include ${businessContext.projects.join(", ")}.` };
  }

  if (analysis.primaryIntent === "services") {
    return { reply: `We handle ${businessContext.services.join(", ")}.` };
  }

  if (analysis.primaryIntent === "contact") {
    return withWhatsappAction(
      { reply: `You can reach us at ${businessContext.contacts.phonePrimary} or continue on WhatsApp.` },
      message
    );
  }

  if (/\b(location|office|address|nanganallur|thiruvanmiyur|chennai)\b/.test(normalizedMessage)) {
    return { reply: `We work across Chennai, including Thiruvanmiyur, Nanganallur, and the ECR belt.` };
  }

  return { reply: "I can help with services, pricing, projects, site visits, or owner contact. Tell me what you need." };
}

function withWhatsappAction(payload, message) {
  const whatsappMessage = normalizeWhatsappMessage(message);
  const url = buildWhatsappLink(whatsappMessage);

  return {
    ...payload,
    actions: [{ label: "Open WhatsApp", url, targetBlank: true }],
    action: { type: "whatsapp", url },
  };
}

function normalizeWhatsappMessage(message) {
  const base = String(message || "").trim();
  if (!base) {
    return "Hi, I want to discuss a project with Imperial Homes";
  }
  if (/^hi,\s*i want to discuss/i.test(base)) {
    return base;
  }
  return `Hi, I want to discuss this with Imperial Homes: ${base}`;
}

function buildWhatsappLink(message) {
  return `https://wa.me/${businessContext.contacts.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

async function notifyOwner(notification) {
  const deliveries = [];
  const text = notification.summary;

  if (process.env.OWNER_WEBHOOK_URL) {
    try {
      const webhookResponse = await fetch(process.env.OWNER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      deliveries.push({ channel: "webhook", ok: webhookResponse.ok, status: webhookResponse.status });
    } catch (error) {
      deliveries.push({ channel: "webhook", ok: false, error: error.message });
    }
  }

  if (process.env.RESEND_API_KEY && process.env.OWNER_EMAIL_TO && process.env.OWNER_EMAIL_FROM) {
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.OWNER_EMAIL_FROM,
          to: [process.env.OWNER_EMAIL_TO],
          subject: "Imperial Houses Lead Notification",
          text,
        }),
      });
      deliveries.push({ channel: "email", ok: emailResponse.ok, status: emailResponse.status });
    } catch (error) {
      deliveries.push({ channel: "email", ok: false, error: error.message });
    }
  }

  return deliveries;
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function appendJsonLine(fileName, payload) {
  await fs.promises.mkdir(dataDirectory, { recursive: true });
  await fs.promises.appendFile(path.join(dataDirectory, fileName), `${JSON.stringify(payload)}\n`, "utf8");
}

async function serveStaticFile(requestPath, response, isHeadRequest) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.normalize(path.join(projectRoot, cleanPath));

  if (!resolvedPath.startsWith(projectRoot)) {
    return sendJson(response, 403, { error: "Forbidden" });
  }

  let fileStat;
  try {
    fileStat = await fs.promises.stat(resolvedPath);
  } catch {
    return sendJson(response, 404, { error: "Not found" });
  }

  if (!fileStat.isFile()) {
    return sendJson(response, 404, { error: "Not found" });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Content-Length": fileStat.size,
  });

  if (isHeadRequest) {
    return response.end();
  }

  fs.createReadStream(resolvedPath).pipe(response);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  fileContents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}
