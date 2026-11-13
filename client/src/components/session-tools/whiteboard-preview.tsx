"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Circle,
  Download,
  MousePointer2,
  Pencil,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
export function WhiteboardPreview() {
  const t = useTranslations("Room");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-2">
        {[MousePointer2, Pencil, ArrowUpRight, Square, Circle, Type].map(
          (Icon, index) => (
            <Button
              key={index}
              variant={index === 1 ? "secondary" : "ghost"}
              size="icon-sm"
              disabled
              aria-label={t(
                ["pointer", "pencil", "line", "square", "circle", "text"][
                  index
                ],
              )}
            >
              <Icon className="size-3.5" />
            </Button>
          ),
        )}
        <span className="ml-auto size-4 rounded-full border-2 border-card bg-primary ring-1 ring-border" />
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
        <svg
          viewBox="0 0 380 350"
          className="w-full"
          role="img"
          aria-label={t("boardExample")}
        >
          <rect
            x="81"
            y="25"
            width="218"
            height="48"
            rx="12"
            fill="var(--muted)"
            stroke="var(--border)"
          />
          <text
            x="190"
            y="55"
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="16"
            fontWeight="600"
          >
            Talking about the future
          </text>
          <path
            d="M190 73V110M190 110H80V145M190 110H300V145"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="20"
            y="145"
            width="145"
            height="108"
            rx="10"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeOpacity=".4"
          />
          <text
            x="36"
            y="171"
            fill="var(--primary)"
            fontSize="15"
            fontWeight="600"
          >
            going to
          </text>
          <text x="36" y="195" fill="var(--muted-foreground)" fontSize="11">
            Plans & intentions
          </text>
          <text x="36" y="222" fill="var(--foreground)" fontSize="11">
            I’m going to travel.
          </text>
          <rect
            x="215"
            y="145"
            width="145"
            height="108"
            rx="10"
            fill="var(--background)"
            stroke="var(--border)"
          />
          <text
            x="231"
            y="171"
            fill="var(--primary)"
            fontSize="15"
            fontWeight="600"
          >
            will
          </text>
          <text x="231" y="195" fill="var(--muted-foreground)" fontSize="11">
            Spontaneous decisions
          </text>
          <text x="231" y="222" fill="var(--foreground)" fontSize="11">
            I’ll help you!
          </text>
          <path
            d="M43 285Q170 270 330 288"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text x="75" y="317" fill="var(--muted-foreground)" fontSize="12">
            Make 3 examples of your own ✨
          </text>
        </svg>
        <span className="absolute right-3 bottom-3 rounded-md border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
          100%
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" disabled>
          <Trash2 className="size-3.5" />
          {t("clearBoard")}
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Download className="size-3.5" />
          {t("exportBoard")}
        </Button>
      </div>
    </div>
  );
}
