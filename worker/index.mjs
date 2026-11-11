import { io } from "socket.io-client";

const {
  SERVER_URL,
  WORKER_SECRET,
  OLLAMA_URL = "http://127.0.0.1:11434",
  OLLAMA_MODEL = "qwen3:8b",
} = process.env;
if (!SERVER_URL || !WORKER_SECRET)
  throw new Error("Set SERVER_URL and WORKER_SECRET in worker/.env");
if (
  !SERVER_URL.startsWith("https://") &&
  !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(SERVER_URL)
)
  throw new Error("Remote connections require HTTPS");
// Do not advertise a local worker until model loading and first CUDA kernels
// are ready. A first-ever GPU request can exceed the normal job timeout.
console.log("Warming the local model… First startup may take a few minutes.");
const warmup = await fetch(`${OLLAMA_URL}/api/chat`, {
  method: "POST",
  signal: AbortSignal.timeout(180000),
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: OLLAMA_MODEL,
    messages: [{ role: "user", content: "Hello" }],
    stream: false,
    think: false,
    keep_alive: "30m",
    options: { num_ctx: 8192, num_predict: 1 },
  }),
});
if (!warmup.ok)
  throw new Error(
    "Ollama warm-up failed. Start Ollama and pull the configured model before running the worker.",
  );
await warmup.json();
console.log("Model warm-up complete.");
const socket = io(SERVER_URL, {
  auth: { kind: "worker", secret: WORKER_SECRET },
  transports: ["websocket"],
  reconnectionDelayMax: 10000,
});
let active;
socket.on("worker:ready", () =>
  console.log("PairUp worker ready. Model:", OLLAMA_MODEL),
);
socket.on("connect_error", () =>
  console.error("Server unavailable; reconnecting…"),
);
socket.on("disconnect", () => {
  active?.controller.abort();
  console.log("Disconnected");
});
socket.on("worker:cancel", ({ id }) => {
  if (active?.id === id) active.controller.abort();
});
socket.on("worker:job", async ({ id, messages }) => {
  if (active) {
    socket.emit("worker:result", { id, error: "BUSY" });
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 44000);
  active = { id, controller };
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        think: false,
        keep_alive: "30m",
        options: { num_ctx: 8192, num_predict: 1024, temperature: 0.3 },
      }),
    });
    if (!response.ok) throw new Error("OLLAMA_ERROR");
    const data = await response.json();
    if (!data.message?.content?.trim()) throw new Error("EMPTY_RESPONSE");
    socket.emit("worker:result", { id, text: data.message.content });
  } catch {
    socket.emit("worker:result", { id, error: "OLLAMA_ERROR" });
  } finally {
    clearTimeout(timer);
    if (active?.id === id) active = undefined;
  }
});
