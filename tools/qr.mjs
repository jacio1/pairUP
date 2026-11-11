import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url))
  throw new Error("Usage: npm run qr -- https://your-domain");
await mkdir("../artifacts", { recursive: true });
await QRCode.toFile("../artifacts/pairup-qr.png", url, {
  width: 1000,
  margin: 3,
  errorCorrectionLevel: "M",
  color: { dark: "#33214e", light: "#ffffff" },
});
console.log("Saved artifacts/pairup-qr.png for", url);
