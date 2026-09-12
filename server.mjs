import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const comfyUrl = normalizeBaseUrl(process.env.COMFYUI_URL ?? "http://127.0.0.1:8188");
const comfyTimeoutMs = Number(process.env.COMFYUI_TIMEOUT_MS ?? 3000);
const comfyWorkflowPath = resolveOptionalPath(process.env.COMFYUI_WORKFLOW_PATH);
const comfyGenerationTimeoutMs = Number(process.env.COMFYUI_GENERATION_TIMEOUT_MS ?? 120000);
const comfyPollIntervalMs = Number(process.env.COMFYUI_POLL_INTERVAL_MS ?? 1000);
const visionVlmUrl = normalizeBaseUrl(process.env.VISION_VLM_URL ?? "http://127.0.0.1:11434");
const visionVlmModel = process.env.VISION_VLM_MODEL ?? "gemma3:4b";
const visionVlmTimeoutMs = Number(process.env.VISION_VLM_TIMEOUT_MS ?? 90000);
const debugSourceDirectory = join(root, ".local-tools", "debug-sources");

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
    if (req.method === "GET" && url.pathname === "/api/comfy-status") {
      await handleComfyStatus(res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/vision-tags-status") {
      await handleVisionTagsStatus(res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/comfy-card-art") {
      await handleComfyCardArt(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/vision-tags") {
      await handleVisionTags(req, res);
      return;
    }

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

async function handleComfyStatus(res) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${comfyUrl}/system_stats`, {
      signal: AbortSignal.timeout(comfyTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      sendJson(res, 502, {
        ok: false,
        error: "comfyui_bad_response",
        url: comfyUrl,
        status: response.status,
        details: payload
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      url: comfyUrl,
      latencyMs: Date.now() - startedAt,
      system: payload.system ?? null,
      devices: summarizeComfyDevices(payload.devices),
      workflow: summarizeComfyWorkflow()
    });
  } catch (error) {
    sendJson(res, 503, {
      ok: false,
      error: "comfyui_unavailable",
      url: comfyUrl,
      message: error.message,
      hint: "Start ComfyUI on 127.0.0.1:8188 or set COMFYUI_URL in .env.local.",
      workflow: summarizeComfyWorkflow()
    });
  }
}

async function handleComfyCardArt(req, res) {
  if (!comfyWorkflowPath) {
    sendJson(res, 501, {
      error: "missing_comfy_workflow",
      message: "COMFYUI_WORKFLOW_PATH is not set. Export an API workflow JSON from ComfyUI and set the path in .env.local.",
      expectedPlaceholders: comfyPlaceholderContract()
    });
    return;
  }

  const body = await readJsonBody(req, 16 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  const prompt = String(body.prompt ?? "").slice(0, 5000);
  if (!image || !prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  try {
    const negativePrompt =
      String(body.negativePrompt ?? "").slice(0, 1600) ||
      "text, logo, watermark, extra people, identity document, low quality, distorted face, cropped head";
    const workflowTemplate = readComfyWorkflowTemplate();
    const sourceDebug = await saveDebugSourceImage(image);
    const upload = await uploadComfySourceImage(image);
    const workflow = fillComfyWorkflowTemplate(workflowTemplate, {
      sourceImage: upload.name,
      prompt,
      negativePrompt,
      seed: Number.isFinite(Number(body.seed)) ? Number(body.seed) : randomSeed(),
      width: Number.isFinite(Number(body.width)) ? Number(body.width) : 768,
      height: Number.isFinite(Number(body.height)) ? Number(body.height) : 1024,
      denoise: readNumber(body.denoise, Number(process.env.COMFYUI_DENOISE ?? 0.45)),
      loraStrength: readNumber(body.loraStrength, Number(process.env.COMFYUI_FACEID_LORA_STRENGTH ?? 0.6)),
      ipadapterWeight: readNumber(body.ipadapterWeight, Number(process.env.COMFYUI_IPADAPTER_WEIGHT ?? 1)),
      faceidv2Weight: readNumber(body.faceidv2Weight, Number(process.env.COMFYUI_FACEIDV2_WEIGHT ?? 2))
    });
    const promptResult = await submitComfyPrompt(workflow);
    const output = await waitForComfyOutput(promptResult.promptId);
    const imageDataUrl = await fetchComfyImageAsDataUrl(output.image);

    sendJson(res, 200, {
      imageDataUrl,
      provider: "comfyui",
      promptId: promptResult.promptId,
      workflow: summarizeComfyWorkflow(),
      source: {
        mime: image.mime,
        bytes: image.buffer.length,
        debugPath: sourceDebug.relativePath,
        comfyInput: upload.name
      },
      output: {
        filename: output.image.filename,
        subfolder: output.image.subfolder ?? "",
        type: output.image.type ?? "output"
      }
    });
  } catch (error) {
    const status = error.statusCode ?? 502;
    sendJson(res, status, {
      error: error.code ?? "comfyui_generation_failed",
      message: error.message,
      url: comfyUrl,
      workflow: summarizeComfyWorkflow(),
      details: error.details ?? null
    });
  }
}

async function handleVisionTagsStatus(res) {
  try {
    const response = await fetch(`${visionVlmUrl}/api/tags`, {
      signal: AbortSignal.timeout(Math.min(visionVlmTimeoutMs, 5000))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      sendJson(res, 502, {
        ok: false,
        error: "vision_vlm_bad_response",
        url: visionVlmUrl,
        model: visionVlmModel,
        status: response.status,
        details: payload
      });
      return;
    }

    const models = Array.isArray(payload.models) ? payload.models : [];
    const modelAvailable = models.some((model) => model?.name === visionVlmModel);
    sendJson(res, 200, {
      ok: true,
      url: visionVlmUrl,
      model: visionVlmModel,
      modelAvailable,
      models: models.map((model) => model?.name).filter(Boolean).slice(0, 20)
    });
  } catch (error) {
    sendJson(res, 503, {
      ok: false,
      error: "vision_vlm_unavailable",
      url: visionVlmUrl,
      model: visionVlmModel,
      message: error.message,
      hint: `Start Ollama and pull the configured vision model, for example: ollama pull ${visionVlmModel}`
    });
  }
}

async function handleVisionTags(req, res) {
  const body = await readJsonBody(req, 12 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  if (!image) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl is required." });
    return;
  }
  const subjectImage = parseDataUrl(body.subjectImageDataUrl) ?? image;
  const hasSubjectCrop = Boolean(body.subjectImageDataUrl && subjectImage !== image);

  try {
    const startedAt = Date.now();
    const subjectFocus = normalizeSubjectFocus(body.subjectFocus);
    const response = await fetch(`${visionVlmUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: visionVlmModel,
        stream: false,
        format: visionTagJsonSchema(),
        messages: [
          {
            role: "user",
            content: buildVisionTagPrompt(subjectFocus, hasSubjectCrop),
            images: hasSubjectCrop
              ? [subjectImage.buffer.toString("base64"), image.buffer.toString("base64")]
              : [image.buffer.toString("base64")]
          }
        ],
        options: {
          temperature: 0,
          num_predict: 900
        }
      }),
      signal: AbortSignal.timeout(visionVlmTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createHttpError(response.status, "vision_vlm_failed", "Local VLM tag generation failed.", payload);
    }

    const content = payload.message?.content ?? payload.response ?? "";
    const suggestions = normalizeVisionTagPayload(parseLooseJson(content));
    sendJson(res, 200, {
      ok: true,
      provider: "ollama",
      model: visionVlmModel,
      subjectFocus,
      subjectImageMode: hasSubjectCrop ? "center_crop_plus_full_image" : "full_image_only",
      latencyMs: Date.now() - startedAt,
      tags: suggestions.tags,
      groups: suggestions.groups,
      raw: {
        content
      }
    });
  } catch (error) {
    sendJson(res, error.statusCode ?? 503, {
      ok: false,
      error: error.code ?? "vision_vlm_unavailable",
      message: error.message,
      url: visionVlmUrl,
      model: visionVlmModel,
      hint: "Install/start Ollama and pull the configured vision model, then try VLM analysis again.",
      details: error.details ?? null
    });
  }
}

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

function summarizeComfyDevices(devices) {
  if (!Array.isArray(devices)) return [];
  return devices.map((device) => ({
    name: device.name ?? "unknown",
    type: device.type ?? "unknown",
    vramTotal: device.vram_total ?? null,
    vramFree: device.vram_free ?? null,
    torchVramTotal: device.torch_vram_total ?? null,
    torchVramFree: device.torch_vram_free ?? null
  }));
}

function summarizeComfyWorkflow() {
  return {
    configured: Boolean(comfyWorkflowPath),
    path: comfyWorkflowPath ? basename(comfyWorkflowPath) : null,
    timeoutMs: comfyGenerationTimeoutMs
  };
}

function comfyPlaceholderContract() {
  return {
    required: ["__SOURCE_IMAGE__", "__PROMPT__"],
    optional: [
      "__NEGATIVE_PROMPT__",
      "__SEED__",
      "__WIDTH__",
      "__HEIGHT__",
      "__DENOISE__",
      "__LORA_STRENGTH__",
      "__IPADAPTER_WEIGHT__",
      "__FACEIDV2_WEIGHT__"
    ]
  };
}

function readComfyWorkflowTemplate() {
  if (!existsSync(comfyWorkflowPath)) {
    throw createHttpError(500, "comfy_workflow_not_found", `Workflow file not found: ${comfyWorkflowPath}`);
  }

  try {
    return JSON.parse(readFileSync(comfyWorkflowPath, "utf8"));
  } catch (error) {
    throw createHttpError(500, "invalid_comfy_workflow", `Workflow file is not valid JSON: ${error.message}`);
  }
}

async function saveDebugSourceImage(image) {
  await mkdir(debugSourceDirectory, { recursive: true });
  const extension = image.mime === "image/jpeg" ? "jpg" : image.mime.split("/")[1] ?? "png";
  const filename = `comfy-source-${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = join(debugSourceDirectory, filename);
  await writeFile(absolutePath, image.buffer);
  return {
    absolutePath,
    relativePath: `.local-tools/debug-sources/${filename}`
  };
}

async function uploadComfySourceImage(image) {
  const form = new FormData();
  const extension = image.mime === "image/jpeg" ? "jpg" : image.mime.split("/")[1] ?? "png";
  const filename = `photo-character-lab-${Date.now()}-${randomUUID()}.${extension}`;
  form.append("image", new Blob([image.buffer], { type: image.mime }), filename);
  form.append("type", "input");
  form.append("overwrite", "true");

  const response = await fetch(`${comfyUrl}/upload/image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.name) {
    throw createHttpError(502, "comfy_upload_failed", "ComfyUI image upload failed.", {
      status: response.status,
      response: payload
    });
  }
  return payload;
}

async function submitComfyPrompt(workflow) {
  const response = await fetch(`${comfyUrl}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: randomUUID(),
      prompt: workflow
    }),
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.prompt_id) {
    throw createHttpError(502, "comfy_prompt_failed", "ComfyUI prompt submission failed.", {
      status: response.status,
      response: payload
    });
  }
  return { promptId: payload.prompt_id };
}

async function waitForComfyOutput(promptId) {
  const deadline = Date.now() + comfyGenerationTimeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${comfyUrl}/history/${encodeURIComponent(promptId)}`, {
      signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createHttpError(502, "comfy_history_failed", "ComfyUI history lookup failed.", {
        status: response.status,
        response: payload
      });
    }

    const item = payload[promptId];
    if (item?.status?.status_str === "error") {
      throw createHttpError(502, "comfy_prompt_error", "ComfyUI reported a workflow error.", item.status);
    }

    const image = findComfyOutputImage(item?.outputs);
    if (image) return { history: item, image };

    if (item?.status?.completed) {
      throw createHttpError(502, "comfy_missing_output_image", "ComfyUI finished but did not return an output image.", item);
    }

    await sleep(comfyPollIntervalMs);
  }

  throw createHttpError(504, "comfy_generation_timeout", "ComfyUI generation timed out before returning an image.");
}

async function fetchComfyImageAsDataUrl(image) {
  const params = new URLSearchParams({
    filename: image.filename,
    type: image.type ?? "output"
  });
  if (image.subfolder) params.set("subfolder", image.subfolder);

  const response = await fetch(`${comfyUrl}/view?${params.toString()}`, {
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  if (!response.ok) {
    throw createHttpError(502, "comfy_view_failed", "ComfyUI output image fetch failed.", {
      status: response.status
    });
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await response.arrayBuffer();
  return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
}

function fillComfyWorkflowTemplate(value, replacements) {
  if (Array.isArray(value)) {
    return value.map((item) => fillComfyWorkflowTemplate(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillComfyWorkflowTemplate(item, replacements)])
    );
  }
  if (typeof value !== "string") return value;

  const numericPlaceholders = {
    __SEED__: replacements.seed,
    __WIDTH__: replacements.width,
    __HEIGHT__: replacements.height,
    __DENOISE__: replacements.denoise,
    __LORA_STRENGTH__: replacements.loraStrength,
    __IPADAPTER_WEIGHT__: replacements.ipadapterWeight,
    __FACEIDV2_WEIGHT__: replacements.faceidv2Weight
  };
  if (Object.hasOwn(numericPlaceholders, value)) {
    return numericPlaceholders[value];
  }

  return value
    .replaceAll("__SOURCE_IMAGE__", replacements.sourceImage)
    .replaceAll("__PROMPT__", replacements.prompt)
    .replaceAll("__NEGATIVE_PROMPT__", replacements.negativePrompt)
    .replaceAll("__SEED__", String(replacements.seed))
    .replaceAll("__WIDTH__", String(replacements.width))
    .replaceAll("__HEIGHT__", String(replacements.height));
}

function findComfyOutputImage(outputs) {
  if (!outputs || typeof outputs !== "object") return null;
  for (const output of Object.values(outputs)) {
    if (!Array.isArray(output?.images)) continue;
    const image = output.images.find((candidate) => candidate?.filename);
    if (image) return image;
  }
  return null;
}

function buildVisionTagPrompt(subjectFocus = "center_primary_subject", hasSubjectCrop = false) {
  const imageModeRule = hasSubjectCrop
    ? "Input image rule: image 1 is the Target Subject Crop. Image 2 is the Full Source Photo. Use image 1 only for personAppearance, clothing, and subject-specific state. Use image 2 for World Context categories: scene, activity, object, lighting, composition, and visualSignal."
    : "Input image rule: one full image is provided. Select the Target Subject from the full image using the subject focus rule.";
  return [
    "You are the local VLM semantic tagger for a photo-to-game-card pipeline.",
    "Return only JSON. Do not include markdown, comments, or prose.",
    "Task: describe only visible, non-sensitive creative tags from the image.",
    imageModeRule,
    `Target Subject rule: describe one Target Subject only for personAppearance, clothing, and subject-specific state. Current subject focus: ${describeSubjectFocus(subjectFocus)}.`,
    "Default Target Subject priority: choose the centered, largest, clearest foreground person. If multiple people are visible, choose the person closest to the image center; if tied, choose the largest/clearest foreground person.",
    "World Context rule: scene, activity, object, lighting, composition, and visualSignal can describe the whole photo around the Target Subject, including background, props, environment, crowd presence, and visible action.",
    "Do not mix non-target people into personAppearance, clothing, or state. For non-target people, use only broad context tags such as background people, crowd, teammate, audience, group scene, or busy room when visible.",
    "For clothing, include only items clearly worn by the Target Subject. In crowded images, prefer head/torso clothing and accessories attached to the Target Subject; omit shoes, pants, jackets, or outfits that may belong to background people.",
    "If the Target Subject Crop contains partial people at the edge or people behind the foreground subject, ignore those people for personAppearance, clothing, and state.",
    "Allowed categories: personAppearance, scene, activity, object, state, clothing, lighting, composition, visualSignal.",
    "personAppearance is required when the Target Subject is visible. Use visible cues only from the Target Subject: hair shape, expression cue, pose, accessory, outfit silhouette, face visibility, or subject crop.",
    "Every tag must be grounded in visible pixels from the provided image. Do not copy category examples or instruction words unless the cue is clearly visible in the image.",
    "Never infer identity, age, gender, ethnicity, sexuality, politics, religion, health, personality, wealth, social status, or real name.",
    "Do not describe protected traits. Do not guess real age or gender. Prefer neutral words like person, subject, visible face, short hair, long hair, open-mouth expression, standing pose.",
    "Use state tags only when visually grounded, such as sweaty, tired-looking, celebrating, running, sitting, holding a ball, holding a controller.",
    "If uncertain, return fewer tags.",
    "JSON shape:",
    "{\"personAppearance\":[],\"scene\":[],\"activity\":[],\"object\":[],\"state\":[],\"clothing\":[],\"lighting\":[],\"composition\":[],\"visualSignal\":[]}"
  ].join("\n");
}

function normalizeSubjectFocus(value) {
  const normalized = String(value ?? "center_primary_subject")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "_")
    .slice(0, 48);
  if (!normalized) return "center_primary_subject";
  if (["center", "center_subject", "center_primary", "center_primary_subject"].includes(normalized)) {
    return "center_primary_subject";
  }
  if (["largest", "largest_subject", "largest_foreground_subject"].includes(normalized)) {
    return "largest_foreground_subject";
  }
  return normalized;
}

function describeSubjectFocus(subjectFocus) {
  if (subjectFocus === "largest_foreground_subject") return "largest/clearest foreground subject";
  if (subjectFocus === "center_primary_subject") return "centered primary subject";
  return subjectFocus.replace(/_/gu, " ");
}

function visionTagJsonSchema() {
  const arraySchema = {
    type: "array",
    items: {
      type: "string"
    }
  };
  return {
    type: "object",
    properties: {
      personAppearance: arraySchema,
      scene: arraySchema,
      activity: arraySchema,
      object: arraySchema,
      state: arraySchema,
      clothing: arraySchema,
      lighting: arraySchema,
      composition: arraySchema,
      visualSignal: arraySchema
    },
    required: ["personAppearance", "scene", "activity", "object", "state", "clothing", "lighting", "composition", "visualSignal"]
  };
}

function parseLooseJson(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const match = /\{[\s\S]*\}/u.exec(text);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function normalizeVisionTagPayload(payload) {
  const allowedKeys = ["personAppearance", "scene", "activity", "object", "state", "clothing", "lighting", "composition", "visualSignal"];
  const groups = Object.fromEntries(allowedKeys.map((key) => [key, []]));
  const tags = [];
  for (const key of allowedKeys) {
    const values = normalizeTagList(payload?.[key]);
    if (!values.length) continue;
    for (const value of values) {
      const category = chooseVisionTagCategory(value, key);
      groups[category].push(value);
    }
  }
  const filteredGroups = {};
  for (const key of allowedKeys) {
    const values = mergeUniqueStrings(groups[key], 8);
    if (!values.length) continue;
    filteredGroups[key] = values;
    tags.push(...values);
  }
  return {
    groups: filteredGroups,
    tags: mergeUniqueStrings(tags, 24)
  };
}

function chooseVisionTagCategory(tag, fallbackKey) {
  const lower = String(tag ?? "").toLocaleLowerCase();
  if (/(sweaty|tired|exhausted|celebrating|out of breath|氣喘|流汗|疲憊|慶祝)/u.test(lower)) return "state";
  if (/(wearing headphones|wearing glasses|wearing sunglasses|wearing headband|wearing cap|wearing hat|headphones on|戴耳機|戴眼鏡|戴墨鏡|戴頭帶|戴帽)/u.test(lower)) return "personAppearance";
  if (/(playing|dancing|holding|running|training|post-game|跳舞|跑步|訓練|打球|拿著)/u.test(lower)) return "activity";
  if (/(night club|nightclub|club room|club scene)/u.test(lower)) return "scene";
  if (/(game console|game machine|game machines|controller|microphone|poster|sign|pac-man|pacman|galaga|disco ball|phone|camera|laptop|book|headphones|手把|麥克風|海報|招牌|手機|相機|筆電|書|耳機)/u.test(lower)) return "object";
  const categoryPatterns = [
    {
      key: "personAppearance",
      patterns: [
        "visible face",
        "face visible",
        "face",
        "hair",
        "hairstyle",
        "curly",
        "short hair",
        "long hair",
        "bangs",
        "beard",
        "mustache",
        "glasses",
        "sunglasses",
        "smile",
        "smiling",
        "open mouth",
        "tongue",
        "expression",
        "pose",
        "standing",
        "sitting",
        "upper-body",
        "full-body",
        "headband",
        "visor",
        "cap",
        "hat",
        "accessory",
        "subject crop",
        "臉",
        "可見臉",
        "頭髮",
        "髮型",
        "捲髮",
        "短髮",
        "長髮",
        "瀏海",
        "鬍子",
        "眼鏡",
        "墨鏡",
        "微笑",
        "張嘴",
        "吐舌",
        "表情",
        "姿勢",
        "站姿",
        "坐姿",
        "半身",
        "全身",
        "頭帶",
        "帽子",
        "配件"
      ]
    },
    {
      key: "scene",
      patterns: ["basketball court", "court", "gym", "arcade", "street", "beach", "park", "office", "school", "indoor", "outdoor", "disco", "room", "籃球場", "球場", "健身房", "街機", "街道", "海邊", "公園", "辦公室", "學校", "室內", "戶外"]
    },
    {
      key: "activity",
      patterns: ["athlete", "player", "basketball", "running", "dancing", "post-game", "training", "playing", "holding", "運動", "球員", "籃球", "跑步", "跳舞", "比賽", "訓練", "賽後", "打球"]
    },
    {
      key: "object",
      patterns: ["ball", "controller", "phone", "camera", "microphone", "laptop", "book", "badge", "headphones", "poster", "sign", "console", "pac-man", "galaga", "球", "手把", "手機", "相機", "麥克風", "筆電", "書", "徽章", "耳機"]
    },
    {
      key: "state",
      patterns: ["sweaty", "tired", "exhausted", "celebrating", "post-game energy", "out of breath", "氣喘", "喘", "流汗", "疲憊", "興奮", "慶祝", "賽後能量"]
    },
    {
      key: "clothing",
      patterns: ["jersey", "sportswear", "hoodie", "jacket", "suit", "uniform", "dress", "windbreaker", "tank top", "pants", "jeans", "sneakers", "vest", "球衣", "運動服", "帽t", "外套", "西裝", "制服", "洋裝"]
    },
    {
      key: "lighting",
      patterns: ["neon", "sunny", "night", "rainy", "backlit", "low light", "bright light", "dim lighting", "霓虹", "晴朗", "夜晚", "雨天", "背光", "低光", "亮光"]
    },
    {
      key: "composition",
      patterns: ["centered", "close-up", "upper-body", "full-body", "balanced composition", "中心", "特寫", "半身", "全身", "平衡構圖"]
    },
    {
      key: "visualSignal",
      patterns: ["palette", "contrast", "color", "motion detail", "green environment", "warm", "cool", "vivid", "dramatic", "retro", "高對比", "色彩", "動勢", "暖色", "冷色", "鮮明"]
    }
  ];

  for (const category of categoryPatterns) {
    if (category.patterns.some((pattern) => lower.includes(pattern))) return category.key;
  }

  return fallbackKey;
}

function normalizeTagList(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,，、;\n]/u) : [];
  return mergeUniqueStrings(
    values
      .map((item) =>
        String(item ?? "")
          .trim()
          .replace(/\s+/gu, " ")
          .replace(/^["']|["']$/gu, "")
          .slice(0, 32)
      )
      .filter(Boolean),
    6
  );
}

function mergeUniqueStrings(values, limit) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function readNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  if (Number.isFinite(fallback)) return fallback;
  return 0;
}

function createHttpError(statusCode, code, message, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/u, "");
}

function resolveOptionalPath(value) {
  if (!value) return "";
  return isAbsolute(value) ? value : resolve(root, value);
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
