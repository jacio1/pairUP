import * as Y from "yjs";
import { HttpException } from "@nestjs/common";

export const toolError = (code: string, status = 400): never => {
  throw new HttpException({ code }, status);
};
export const versionInput = (value: unknown) => {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    return toolError("INVALID_INPUT");
  return value as number;
};

export function noteState(existing: Uint8Array | undefined, input?: unknown) {
  const doc = new Y.Doc();
  try {
    if (existing) Y.applyUpdate(doc, existing);
    if (input !== undefined) {
      if (
        typeof input !== "string" ||
        input.length > 350000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(input)
      )
        return toolError("INVALID_INPUT");
      Y.applyUpdate(doc, new Uint8Array(Buffer.from(input, "base64")));
    }
    const title = doc.getText("title").toString();
    const body = doc.getText("body").toString();
    const state = Buffer.from(Y.encodeStateAsUpdate(doc));
    if (
      title.length > 120 ||
      body.length > 20000 ||
      state.length > 262144 ||
      doc.share.size > 2
    )
      return toolError("TOOL_LIMIT");
    return { title, state };
  } catch (error) {
    if (error instanceof HttpException) throw error;
    return toolError("INVALID_INPUT");
  } finally {
    doc.destroy();
  }
}
