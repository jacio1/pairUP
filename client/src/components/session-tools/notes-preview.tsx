"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bold, Highlighter, Italic, List, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
export function NotesPreview() {
  const t = useTranslations("Room");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {t("sharedDocument")}
        </span>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("sharedAccess")}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex gap-0.5 border-b border-border bg-muted/30 p-2">
          {[Bold, Italic, Highlighter, List].map((Icon, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label={t(["bold", "italic", "highlight", "list"][index])}
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>
        <div className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-[10px] font-medium tracking-widest text-muted-foreground">
              ENGLISH / UNIT 04
            </p>
            <h3 className="text-xl font-semibold tracking-tight">
              Let’s talk about our plans
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("notesIntro")}
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Useful expressions</h4>
            <ul className="space-y-2 text-sm leading-6">
              <li>“I’m thinking of…”</li>
              <li>“What would you like to…?”</li>
              <li>“That sounds like a good idea.”</li>
            </ul>
          </div>
          <div className="border-l-2 border-primary bg-primary/5 p-3 text-sm leading-6">
            <span className="font-medium">Remember:</span>
            <br />
            going to + verb → a plan or intention
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Pencil className="size-3" />
            {t("notesDraft")}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full" disabled>
        <Plus className="size-3.5" />
        {t("newNote")}
      </Button>
    </div>
  );
}
