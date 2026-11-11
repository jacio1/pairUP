import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3000";
if (!/^https?:\/\//.test(base) || !process.env.PRESENTER_PASSWORD)
  throw new Error(
    "Usage: set PRESENTER_PASSWORD, then npm run record -- https://your-domain",
  );
await mkdir("../artifacts/rehearsal", { recursive: true });
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  slowMo: 250,
});
const presenter = await browser.newContext({
  locale: "en-US",
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: "../artifacts/rehearsal",
    size: { width: 1440, height: 900 },
  },
});
try {
  const host = await presenter.newPage();
  await host.goto(base);
  await host.getByRole("button", { name: "EN", exact: true }).click();
  await host.goto(`${base}/profile`);
  await host.getByLabel("Host password").fill(process.env.PRESENTER_PASSWORD);
  await host.getByRole("button", { name: "Sign in as host" }).click();
  await host.getByRole("heading", { name: "Presenter", exact: true }).waitFor();
  await host.getByRole("button", { name: /Open the conversation/ }).click();
  await host
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  await host
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await host
    .getByRole("dialog")
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  const guests = await browser.newContext({ locale: "en-US" });
  const guest = await guests.newPage();
  await guest.goto(base);
  await guest.getByRole("button", { name: /Continue as TEST/ }).click();
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  for (const text of [
    "Hello! I am learning React and TypeScript.",
    "I sometimes procrastinate. A study partner would help me stay focused.",
  ]) {
    await guest.getByRole("textbox").fill(text);
    await guest
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await host.getByText(text, { exact: true }).waitFor();
  }
  await host.getByRole("button", { name: "Ask Neuron", exact: true }).click();
  await host
    .getByRole("textbox")
    .fill(
      "Translate the recent student messages into Russian, keeping the author labels.",
    );
  await host.getByRole("button", { name: "Send message", exact: true }).click();
  await host.locator(".neuron-message").waitFor({ timeout: 120000 });
  await host.waitForTimeout(5000);
  const video = host.video();
  await guests.close();
  await presenter.close();
  await video.saveAs("../artifacts/rehearsal/pairup-demo-en.webm");
  console.log(
    "Recorded real AI session: artifacts/rehearsal/pairup-demo-en.webm",
  );
} finally {
  await browser.close();
}
