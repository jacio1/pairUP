import { io } from "socket.io-client";
import { randomUUID } from "node:crypto";

async function main() {
  const base = process.env.TEST_API_URL;
  if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(base))
    throw new Error(
      "Set TEST_API_URL to your local test server, e.g. http://localhost:4000",
    );
  const clients = [];
  const samples: number[] = [];
  try {
    for (let i = 0; i < 50; i++) {
      const result = await fetch(`${base}/api/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!result.ok) throw new Error(`Login failed: ${result.status}`);
      const cookie = result.headers.get("set-cookie")!.split(";")[0];
      const socket = io(base, {
        autoConnect: false,
        transports: ["websocket"],
        extraHeaders: { Cookie: cookie },
      });
      clients.push(socket);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("connection timeout")),
          5000,
        );
        socket.once("room:ready", () => {
          clearTimeout(timer);
          resolve();
        });
        socket.connect();
      });
    }
    const arrivals = new Map<string, number>();
    clients.forEach((client) =>
      client.on("message:created", (message) => {
        if (arrivals.has(message.text))
          samples.push(performance.now() - arrivals.get(message.text)!);
      }),
    );
    for (let i = 0; i < 50; i++) {
      const text = `Load test ${randomUUID()}`;
      arrivals.set(text, performance.now());
      await new Promise<void>((resolve, reject) =>
        clients[i]
          .timeout(5000)
          .emit(
            "message:send",
            { text, clientRequestId: randomUUID() },
            (err: Error | null, data: { ok: boolean }) =>
              err || !data.ok
                ? reject(err || new Error("send failed"))
                : resolve(),
          ),
      );
    }
    const deadline = Date.now() + 5000;
    while (samples.length < 2500 && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 20));
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.ceil(samples.length * 0.95) - 1];
    console.log(
      JSON.stringify(
        {
          connections: clients.length,
          broadcasts: samples.length,
          expected: 2500,
          p95Ms: Math.round(p95),
        },
        null,
        2,
      ),
    );
    if (samples.length !== 2500 || p95 > 2000)
      throw new Error("Load acceptance criteria failed");
  } finally {
    clients.forEach((client) => client.disconnect());
  }
}
void main();
