import { ContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import { NeuronMascot } from "@/components/neuron-mascot";
import { Ellipsis, Reply, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const itemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground";
const popupClass =
  "min-w-40 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-lg";

export function MessageMenu({
  children,
  onReply,
  onAskNeuron,
  onDelete,
}: {
  children: ReactNode;
  onReply: () => void;
  onAskNeuron?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("ChatExtras");
  const demo = useTranslations("Demo");
  const items = (
    <>
      <Menu.Item className={itemClass} onClick={onReply}>
        <Reply className="size-4" /> {t("reply")}
      </Menu.Item>
      {onAskNeuron && (
        <Menu.Item className={itemClass} onClick={onAskNeuron}>
          <NeuronMascot icon decorative className="size-4" />
          {demo("askNeuron")}
        </Menu.Item>
      )}
      {onDelete && (
        <Menu.Item
          className={`${itemClass} text-destructive`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" /> {t("deleteMessage")}
        </Menu.Item>
      )}
    </>
  );
  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-50">
            <ContextMenu.Popup
              aria-label={t("messageActions")}
              className={popupClass}
            >
              {items}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <Menu.Root>
        <Menu.Trigger
          aria-label={t("messageActions")}
          className="mt-1 ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        >
          <Ellipsis className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50" align="end" sideOffset={4}>
            <Menu.Popup aria-label={t("messageActions")} className={popupClass}>
              {items}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </>
  );
}
