import type { Board } from "./room-activities-api";
const listeners = new Set<(board: Board) => void>();
export function subscribeBoardSnapshots(listener: (board: Board) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function publishBoardSnapshot(board: Board) {
  for (const listener of listeners) listener(board);
}
