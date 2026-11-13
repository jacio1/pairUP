import { api, type Message } from "./store";
import type { Attachment } from "./attachments";
export const filesApi = api
  .enhanceEndpoints({ addTagTypes: ["RoomFiles"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      roomFiles: builder.query<Attachment[], string>({
        query: (roomId) => `/rooms/${encodeURIComponent(roomId)}/files`,
        providesTags: (_, __, id) => [{ type: "RoomFiles", id }],
        keepUnusedDataFor: 120,
      }),
    }),
  });
export const { useRoomFilesQuery } = filesApi;
export function uploadFile(
  roomId: string,
  file: File,
  id: string,
  progress: (value: number) => void,
) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<{
    attachment: Attachment;
    message: Message | null;
  }>((resolve, reject) => {
    xhr.open("POST", `/api/rooms/${encodeURIComponent(roomId)}/files`);
    xhr.withCredentials = true;
    xhr.timeout = 300000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("UPLOAD_FAILED"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else
        reject(
          new Error(
            data.code ||
              (xhr.status === 413 ? "FILE_TOO_LARGE" : "UPLOAD_FAILED"),
          ),
        );
    };
    xhr.onerror = () => reject(new Error("UPLOAD_FAILED"));
    xhr.ontimeout = () => reject(new Error("UPLOAD_FAILED"));
    xhr.onabort = () => reject(new Error("UPLOAD_CANCELLED"));
    const body = new FormData();
    body.append("clientRequestId", id);
    body.append("file", file);
    xhr.send(body);
  });
  return { promise, cancel: () => xhr.abort() };
}
