import { existsSync, readFileSync } from "node:fs";
import { basename, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));
const comfyUrl = normalizeBaseUrl(process.env.COMFYUI_URL ?? "http://127.0.0.1:8188");
const timeoutMs = Number(process.env.COMFYUI_TIMEOUT_MS ?? 3000);
const workflowPath = resolveOptionalPath(process.env.COMFYUI_WORKFLOW_PATH);
const startedAt = Date.now();

try {
  const response = await fetch(`${comfyUrl}/system_stats`, {
    signal: AbortSignal.timeout(timeoutMs)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: "comfyui_bad_response",
          url: comfyUrl,
          status: response.status,
          details: payload
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: comfyUrl,
        latencyMs: Date.now() - startedAt,
        system: payload.system ?? null,
        devices: summarizeDevices(payload.devices),
        workflow: summarizeWorkflow()
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: "comfyui_unavailable",
        url: comfyUrl,
        message: error.message,
        hint: "Start ComfyUI on 127.0.0.1:8188 or set COMFYUI_URL.",
        workflow: summarizeWorkflow()
      },
      null,
      2
    )
  );
  process.exit(1);
}

function summarizeDevices(devices) {
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

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/u, "");
}

function summarizeWorkflow() {
  return {
    configured: Boolean(workflowPath),
    path: workflowPath ? basename(workflowPath) : null,
    exists: workflowPath ? existsSync(workflowPath) : false
  };
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
