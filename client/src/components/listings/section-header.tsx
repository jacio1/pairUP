"use client";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
export function SectionHeader({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: typeof BookOpen;
  title: string;
  text: string;
}) {
  return (
    <CardHeader className="border-b border-border/60 pb-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {number}
          </p>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </CardHeader>
  );
}
