import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/ai-retouch") {
      await handleAiRetouch(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }

    await serveStatic(url.pathname, res, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Photo Character Lab running at http://${host}:${port}`);
});

async function handleAiRetouch(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 501, {
      error: "missing_api_key",
      message: "OPENAI_API_KEY is not set. Set it in Terminal before starting the server."
    });
    return;
  }

  const body = await readJsonBody(req, 12 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  const prompt = String(body.prompt ?? "").slice(0, 3800);
  if (!image || !prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  const form = new FormData();
  form.append("model", imageModel);
  form.append("image", new Blob([image.buffer], { type: image.mime }), "source.png");
  form.append("prompt", prompt);
  form.append("size", body.size ?? "1024x1536");
  form.append("quality", body.quality ?? "medium");
  form.append("input_fidelity", body.inputFidelity ?? "high");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form
  });

  const resultText = await response.text();
  let result;
  try {
    result = JSON.parse(resultText);
  } catch {
    result = { raw: resultText };
  }

  if (!response.ok) {
    sendJson(res, response.status, {
      error: "openai_error",
      status: response.status,
      details: result
    });
    return;
  }

  const first = result.data?.[0];
  if (first?.b64_json) {
    sendJson(res, 200, {
      imageDataUrl: `data:image/png;base64,${first.b64_json}`,
      model: imageModel,
      revisedPrompt: first.revised_prompt ?? null
    });
    return;
  }

  if (first?.url) {
    const imageResponse = await fetch(first.url);
    if (!imageResponse.ok) {
      sendJson(res, 502, { error: "image_url_fetch_failed", status: imageResponse.status });
      return;
    }
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    sendJson(res, 200, {
      imageDataUrl: `data:${contentType};base64,${base64}`,
      model: imageModel,
      revisedPrompt: first.revised_prompt ?? null
    });
    return;
  }

  sendJson(res, 502, { error: "missing_image", details: result });
}

async function serveStatic(pathname, res, headOnly) {
  const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const relativePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]/, "");
  const filePath = join(root, relativePath);
  if (!filePath.startsWith(root)) {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    if (!headOnly) res.end(data);
    else res.end();
  } catch {
    sendJson(res, 404, { error: "not_found" });
  }
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function parseDataUrl(value) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([\s\S]+)$/i.exec(String(value ?? ""));
  if (!match) return null;
  return {
    mime: match[1] === "image/jpg" ? "image/jpeg" : match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
