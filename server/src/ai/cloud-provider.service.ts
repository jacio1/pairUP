import { Injectable } from "@nestjs/common";
import { validText } from "../core";
import { buildContext } from "./ai-context";
@Injectable()
export class CloudProvider {
  async complete(
    messages: ReturnType<typeof buildContext>,
    signal: AbortSignal,
  ) {
    if (!process.env.YANDEX_API_KEY || !process.env.YANDEX_MODEL)
      throw new Error("CLOUD_NOT_CONFIGURED");
    const response = await fetch(
      process.env.YANDEX_API_URL ||
        "https://ai.api.cloud.yandex.net/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.any([signal, AbortSignal.timeout(45000)]),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.YANDEX_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 1024,
          stream: false,
        }),
      },
    );
    if (!response.ok) throw new Error("CLOUD_ERROR");
    const body = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const text = body.choices?.[0]?.message?.content;
    if (!validText(text, 16000)) throw new Error("CLOUD_ERROR");
    return text;
  }
}
