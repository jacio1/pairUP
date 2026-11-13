"use client";
import { sessionTools } from "@/components/session-tools/tools";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
export function ToolNav() {
  const room = useTranslations("Room");
  return (
    <div className="shrink-0 overflow-x-auto border-b border-border bg-card px-2 py-2 [scrollbar-width:none] sm:px-5">
      <TabsList
        className="h-11 min-w-max gap-1 bg-transparent p-0 sm:h-9"
        aria-label={room("tools")}
      >
        <TabsTrigger
          value="chat"
          className="min-w-[52px] flex-col gap-0.5 px-1.5 text-[10px] data-active:bg-primary/8 data-active:text-primary sm:flex-row sm:gap-1.5 sm:px-3 sm:text-xs"
        >
          <MessageCircle className="size-3.5" />
          {room("chat")}
        </TabsTrigger>
        {sessionTools.map(({ key, icon: Icon }) => (
          <TabsTrigger
            key={key}
            value={key}
            className="min-w-[52px] flex-col gap-0.5 px-1.5 text-[10px] data-active:bg-primary/8 data-active:text-primary sm:flex-row sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <Icon className="size-3.5" />
            {room(key)}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
