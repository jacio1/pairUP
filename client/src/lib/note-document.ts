import * as Y from "yjs";
export const encodeNote = (doc: Y.Doc) => {
  const bytes = Y.encodeStateAsUpdate(doc);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};
export const applyNote = (doc: Y.Doc, state: string, origin: string) =>
  Y.applyUpdate(
    doc,
    Uint8Array.from(atob(state), (character) => character.charCodeAt(0)),
    origin,
  );

// Replace only the changed range, preserving concurrent edits outside it.
export function editNote(doc: Y.Doc, field: "title" | "body", value: string) {
  const text = doc.getText(field),
    previous = text.toString();
  let start = 0,
    end = 0;
  while (
    start < previous.length &&
    start < value.length &&
    previous[start] === value[start]
  )
    start++;
  while (
    end < previous.length - start &&
    end < value.length - start &&
    previous[previous.length - 1 - end] === value[value.length - 1 - end]
  )
    end++;
  doc.transact(() => {
    const count = previous.length - start - end;
    if (count) text.delete(start, count);
    const added = value.slice(start, value.length - end);
    if (added) text.insert(start, added);
  }, "local");
}
