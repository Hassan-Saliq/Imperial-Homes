const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const projectRoot = __dirname;
const dataDirectory = path.join(projectRoot, "data");

const businessContext = {
  company: "Imperial Houses",
  tagline: "D.R Construction & Best Homes",
  industry: "Real Estate / Construction",
  tone: "Premium, professional, friendly",
  locations: ["Chennai", "Thiruvanmiyur", "Nanganallur", "ECR Belt"],
  offices: [
    "No. 6, 13th East Street, Kamaraj Nagar, Thiruvanmiyur, Chennai - 600041",
    "No. 12/21, 45th Street, Nanganallur, Chennai - 600061",
  ],
  contacts: [
    "Phone: +91 96775 55912",
    "Phone: +91 96776 66812",
    "Email: info.imperialhomes@gmail.com",
  ],
  services: [
    "Building construction",
    "Joint venture projects",
    "Property development",
    "Renovation",
    "Interiors",
    "Project management",
    "Total home solutions",
  ],
  target: [
    "Clients looking to build homes",
    "Apartment buyers",
    "Landowners for joint ventures",
  ],
  projects: [
    "Imperial Regal - ongoing - Thiruvanmiyur, Chennai - 3 BHK apartments",
    "Imperial Royale - ready to occupy - Nanganallur, Chennai - 2 & 3 BHK",
    "Imperial Park - featured layout - ECR Belt, Chennai - community layout",
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
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

loadEnvFile(path.join(projectRoot, ".env"));

const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "imperial-homes-site",
      });
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
      const payload = await readJsonBody(request);
      return handleChat(payload, response);
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/lead") {
      const payload = await readJsonBody(request);
      return handleLead(payload, response);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return serveStaticFile(requestUrl.pathname, response, request.method === "HEAD");
    }

    return sendJson(response, 405, {
      error: "Method not allowed",
    });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, {
      error: "Internal server error",
    });
  }
});

server.listen(port, () => {
  console.log(`Imperial Houses site running on http://localhost:${port}`);
});

async function handleChat(payload, response) {
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return sendJson(response, 400, {
      error: "Message is required",
    });
  }

  const history = Array.isArray(payload?.history)
    ? payload.history
        .filter((entry) => entry && typeof entry.role === "string" && typeof entry.content === "string")
        .slice(-8)
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

  let reply = "";
  let usedAi = false;

  try {
    reply = await generateAiReply(message, history, analysis);
    usedAi = Boolean(reply);
  } catch (error) {
    console.error("AI reply failed:", error.message);
  }

  if (!reply) {
    reply = generateFallbackReply(message, analysis);
  }

  if (analysis.isStrongIntent) {
    reply = "That’s great! Our team will contact you shortly.";
  }

  let notifications = [];
  if (analysis.shouldNotify) {
    notifications = await notifyOwner({
      kind: "chat-intent",
      summary: `New client inquiry: ${message}`,
      details: record,
    });
  }

  if (analysis.shouldNotify) {
    await appendJsonLine("lead-log.jsonl", {
      ...record,
      reply,
      usedAi,
      notifications,
    });
  }

  return sendJson(response, 200, {
    reply,
    shouldNotify: analysis.shouldNotify,
    intent: analysis.primaryIntent,
    notifications,
  });
}

async function handleLead(payload, response) {
  const formData = payload?.formData;
  if (!formData || typeof formData !== "object") {
    return sendJson(response, 400, {
      error: "Form data is required",
    });
  }

  if (!String(formData.name || "").trim() || !String(formData.phone || "").trim() || !String(formData.email || "").trim()) {
    return sendJson(response, 400, {
      error: "Name, phone, and email are required",
    });
  }

  const leadRecord = {
    type: "form",
    source: payload?.source || "website-form",
    createdAt: new Date().toISOString(),
    sessionId: payload?.sessionId || null,
    page: payload?.page || null,
    path: payload?.path || null,
    formData,
  };

  await appendJsonLine("form-log.jsonl", leadRecord);

  const leadSummary = [
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
    summary: leadSummary,
    details: leadRecord,
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
    return "";
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const systemPrompt = [
    `You are the website sales and support assistant for ${businessContext.company}.`,
    "You are also known as Safa AI.",
    `Tagline: ${businessContext.tagline}.`,
    `Tone: ${businessContext.tone}.`,
    `Industry: ${businessContext.industry}.`,
    `Office locations: ${businessContext.offices.join("; ")}.`,
    `Service areas: ${businessContext.locations.join(", ")}.`,
    `Primary contacts: ${businessContext.contacts.join("; ")}.`,
    `Services: ${businessContext.services.join(", ")}.`,
    `Target customers: ${businessContext.target.join(", ")}.`,
    `Current project highlights: ${businessContext.projects.join("; ")}.`,
    `Process: ${businessContext.process.join(", ")}.`,
    "Keep every answer short, clear, and professional.",
    "Answer as a real estate and construction company assistant, not as a generic AI.",
    "If the user says hi, hello, or starts the first interaction, reply with exactly: Welcome to Imperial Houses. I'm Safa, your AI assistant. How can I help you today?",
    "Answer questions about services, locations, project types, process, contact details, joint ventures, interiors, and construction naturally using the business context.",
    "If the user shows strong buying or investment intent, asks for price, contact, call, or visit, reply with exactly: That’s great! Our team will contact you shortly.",
    "If pricing is asked, explain briefly that pricing depends on scope, location, and specifications.",
    "If ongoing or completed projects are asked, use the listed project highlights.",
    "If the request needs a human team, say the team will contact them shortly.",
    "If a detail is not available on the website, say that clearly and invite the user to share the requirement for a follow-up.",
    `Detected intent: ${analysis.primaryIntent}.`,
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...history.map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: entry.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

function analyzeIntent(message) {
  const normalizedMessage = message.toLowerCase();
  const strongIntentPatterns = [
    /\b(buy|book|booking|invest|investment|contact|call|visit|site visit|price|cost|quote|estimate|interested)\b/,
    /\b(i want|looking to|need to|can we meet|schedule)\b/,
  ];
  const hasStrongIntent = strongIntentPatterns.some((pattern) => pattern.test(normalizedMessage));
  const hasContactDetails =
    /(?:\+?\d[\d\s-]{7,}\d)|(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i.test(message);

  let primaryIntent = "general";

  if (/\b(joint venture|joint-venture|landowner|land owner|property owner|develop my land)\b/.test(normalizedMessage)) {
    primaryIntent = "joint-venture";
  } else if (/\b(price|cost|budget|quote|estimate)\b/.test(normalizedMessage)) {
    primaryIntent = "pricing";
  } else if (/\b(project|projects|ongoing|completed|apartment|royale|regal|park)\b/.test(normalizedMessage)) {
    primaryIntent = "projects";
  } else if (/\b(construction|build|renovation|interior|interiors|property development|service|services)\b/.test(normalizedMessage)) {
    primaryIntent = "services";
  } else if (/\b(contact|call|visit|meeting|site visit)\b/.test(normalizedMessage)) {
    primaryIntent = "contact";
  } else if (hasStrongIntent) {
    primaryIntent = "contact";
  }

  const shouldNotify = hasStrongIntent || hasContactDetails || primaryIntent === "contact";

  return {
    isStrongIntent: hasStrongIntent,
    hasContactDetails,
    shouldNotify,
    primaryIntent,
  };
}

function generateFallbackReply(message, analysis) {
  const normalizedMessage = message.toLowerCase();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalizedMessage)) {
    return "Welcome to Imperial Houses. I'm Safa, your AI assistant. How can I help you today?";
  }

  if (analysis.primaryIntent === "joint-venture") {
    return "Imperial Houses works with landowners on transparent joint venture projects covering planning, approvals, construction, and sales coordination.";
  }

  if (/\b(where|location|office|address|located|nanganallur|thiruvanmiyur|chennai)\b/.test(normalizedMessage)) {
    return "Imperial Houses works across Chennai, including Thiruvanmiyur, Nanganallur, and the ECR belt, with offices in Thiruvanmiyur and Nanganallur.";
  }

  if (/\b(phone|email|whatsapp|contact details|reach)\b/.test(normalizedMessage)) {
    return "You can reach Imperial Houses at +91 96775 55912, +91 96776 66812, or info.imperialhomes@gmail.com. WhatsApp is also available from the floating button.";
  }

  if (analysis.primaryIntent === "pricing") {
    return "Pricing depends on the scope, location, specifications, and project type. Share your requirement and our team can guide you better.";
  }

  if (analysis.primaryIntent === "projects") {
    return "Imperial Houses currently highlights Imperial Regal in Thiruvanmiyur, Imperial Royale in Nanganallur, and Imperial Park along the ECR belt.";
  }

  if (analysis.primaryIntent === "services" || /\b(home|build|construction)\b/.test(normalizedMessage)) {
    return "Imperial Houses offers building construction, joint venture development, property development, interiors, renovation, and project management.";
  }

  if (/\b(interior|interiors|design)\b/.test(normalizedMessage)) {
    return "Imperial Houses delivers luxury interiors, design coordination, total home solutions, and premium finishing for residential spaces.";
  }

  if (/\b(method|process|timeline|steps|how do you work)\b/.test(normalizedMessage)) {
    return "Imperial Houses follows a five-step method: Define, Design, Determine, Develop, and Deliver, so clients can track every phase clearly.";
  }

  return "Imperial Houses can help with construction services, joint venture projects, pricing guidance, and current developments. Tell me what you would like to know.";
}

async function notifyOwner(notification) {
  const deliveries = [];
  const text = notification.summary;

  if (process.env.OWNER_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.OWNER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });

      deliveries.push({
        channel: "webhook",
        ok: response.ok,
        status: response.status,
      });
    } catch (error) {
      deliveries.push({
        channel: "webhook",
        ok: false,
        error: error.message,
      });
    }
  }

  if (process.env.RESEND_API_KEY && process.env.OWNER_EMAIL_TO && process.env.OWNER_EMAIL_FROM) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
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

      deliveries.push({
        channel: "email",
        ok: response.ok,
        status: response.status,
      });
    } catch (error) {
      deliveries.push({
        channel: "email",
        ok: false,
        error: error.message,
      });
    }
  }

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM &&
    process.env.OWNER_WHATSAPP_TO
  ) {
    try {
      const twilioBody = new URLSearchParams({
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        To: `whatsapp:${process.env.OWNER_WHATSAPP_TO}`,
        Body: text,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: twilioBody,
        }
      );

      deliveries.push({
        channel: "whatsapp",
        ok: response.ok,
        status: response.status,
      });
    } catch (error) {
      deliveries.push({
        channel: "whatsapp",
        ok: false,
        error: error.message,
      });
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
  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

async function appendJsonLine(fileName, payload) {
  await fs.promises.mkdir(dataDirectory, { recursive: true });
  await fs.promises.appendFile(path.join(dataDirectory, fileName), `${JSON.stringify(payload)}\n`, "utf8");
}

async function serveStaticFile(requestPath, response, isHeadRequest) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.normalize(path.join(projectRoot, cleanPath));

  if (!resolvedPath.startsWith(projectRoot)) {
    return sendJson(response, 403, {
      error: "Forbidden",
    });
  }

  let fileStat;
  try {
    fileStat = await fs.promises.stat(resolvedPath);
  } catch (error) {
    return sendJson(response, 404, {
      error: "Not found",
    });
  }

  if (!fileStat.isFile()) {
    return sendJson(response, 404, {
      error: "Not found",
    });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  response.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": fileStat.size,
  });

  if (isHeadRequest) {
    return response.end();
  }

  fs.createReadStream(resolvedPath).pipe(response);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  fileContents.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}
