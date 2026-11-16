"use client";
import { useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function BoardViewport({
  children,
}: {
  children: (view: { expanded: boolean; zoom: number }) => ReactNode;
}) {
  const t = useTranslations("Activities"),
    [expanded, setExpanded] = useState(false),
    [zoom, setZoom] = useState(1.5);
  return (
    <>
      {!expanded && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="mb-3 w-full"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 className="size-4" />
            {t("expandBoard")}
          </Button>
          {children({ expanded: false, zoom: 1 })}
        </>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          showCloseButton={false}
          className="board-fullscreen"
        >
          <div className="flex shrink-0 items-center justify-between gap-2">
            <DialogTitle className="text-sm">{t("canvas")}</DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("zoomOut")}
                disabled={zoom <= 1}
                onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
              >
                <Minus className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("fitBoard")}
                onClick={() => setZoom(1)}
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("zoomIn")}
                disabled={zoom >= 3}
                onClick={() => setZoom((v) => Math.min(3, v + 0.25))}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={t("collapseBoard")}
                onClick={() => setExpanded(false)}
              >
                <Minimize2 className="size-4" />
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {t("panHint")}
          </DialogDescription>
          {expanded && children({ expanded: true, zoom })}
        </DialogContent>
      </Dialog>
    </>
  );
}
