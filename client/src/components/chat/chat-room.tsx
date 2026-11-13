"use client";
import { type SessionTool } from "@/components/session-tools/tools";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChatComposer } from "./chat-composer";
import { ClearChatDialog } from "./clear-chat-dialog";
import { GuestRoom } from "./guest-room";
import { MessageList } from "./message-list";
import { RoomHeader } from "./room-header";
import { ToolNav } from "./tool-nav";
import { ToolSidebar } from "./tool-sidebar";
import { useChatActions } from "./use-chat-actions";
import { VoicePanel } from "@/components/voice/voice-panel";
import { RoomUploadProvider } from "@/components/files/upload-provider";
import { FileDropZone } from "@/components/files/file-drop-zone";
function ChatWorkspace({ roomId }: { roomId: string }) {
  const chat = useChatActions(roomId);
  const { session, listing } = chat;
  const room = useTranslations("Room");
  const [activeTool, setActiveTool] = useState<SessionTool>("chat");
  return (
    <main className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
      <RoomHeader chat={chat} />
      <VoicePanel roomId={roomId} />
      <Tabs
        value={activeTool}
        onValueChange={(value) => setActiveTool(value as SessionTool)}
        className="min-h-0 flex-1 gap-0"
      >
        <ToolNav />
        <TabsContent
          value={activeTool}
          className="flex min-h-0 flex-1 overflow-hidden"
        >
          <FileDropZone
            className={`workspace-surface min-h-0 min-w-0 flex-1 flex-col ${activeTool === "chat" ? "flex" : "hidden lg:flex"}`}
            label={room("chat")}
          >
            {!session ? (
              <GuestRoom title={listing?.title || "PairUp"} />
            ) : (
              <>
                <MessageList chat={chat} />
                <ChatComposer chat={chat} />
              </>
            )}
          </FileDropZone>
          {activeTool !== "chat" && (
            <ToolSidebar
              roomId={roomId}
              activeTool={activeTool}
              onClose={() => setActiveTool("chat")}
            />
          )}
        </TabsContent>
      </Tabs>
      <ClearChatDialog chat={chat} />
    </main>
  );
}
export function ChatRoom({ roomId }: { roomId: string }) {
  return (
    <RoomUploadProvider key={roomId} roomId={roomId}>
      <ChatWorkspace roomId={roomId} />
    </RoomUploadProvider>
  );
}
