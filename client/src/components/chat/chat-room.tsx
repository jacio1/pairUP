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
export function ChatRoom({ roomId }: { roomId: string }) {
  const chat = useChatActions(roomId);
  const { session, listing } = chat;
  const room = useTranslations("Room");
  const [activeTool, setActiveTool] = useState<SessionTool>("chat");
  return (
    <main className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
      <RoomHeader chat={chat} />
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
          <section
            className={`min-h-0 min-w-0 flex-1 flex-col bg-muted/25 ${activeTool === "chat" ? "flex" : "hidden lg:flex"}`}
            aria-label={room("chat")}
          >
            {!session ? (
              <GuestRoom title={listing?.title || "PairUp"} />
            ) : (
              <>
                <MessageList chat={chat} />
                <ChatComposer
                  chat={chat}
                  onFiles={() => setActiveTool("files")}
                />
              </>
            )}
          </section>
          {activeTool !== "chat" && (
            <ToolSidebar
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
