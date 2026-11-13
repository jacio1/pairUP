import { toolError } from "./study-note";
export const HISTORY_PAGE_SIZE = 50;
export function historyWindow(after?: number, before?: number) {
  for (const cursor of [after, before])
    if (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 0))
      return toolError("INVALID_INPUT");
  if (after !== undefined && before !== undefined)
    return toolError("INVALID_INPUT");
  return after !== undefined
    ? { mode: "after" as const, where: { gt: after }, order: "asc" as const }
    : {
        mode: before !== undefined ? ("older" as const) : ("latest" as const),
        where: before !== undefined ? { lt: before } : {},
        order: "desc" as const,
      };
}
