import { type ReactNode, type RefObject } from "react";
import { Dialog } from "radix-ui";
import { X } from "./icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Radix owns focus trapping, Escape, scroll locking and focus restoration. */
export function MobileSheet({ open, onOpenChange, title, children, returnFocus, placement = "bottom" }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode; returnFocus: RefObject<HTMLButtonElement | null>; placement?: "bottom" | "right";
}) {
  const { t } = useI18n();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="catalog-sheet-overlay fixed inset-0 z-50 bg-black/45" />
      <Dialog.Content aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus({ preventScroll: true }); }} className={cn("catalog-sheet fixed z-50 flex flex-col border bg-card text-foreground shadow-xl focus:outline-none", placement === "right" ? "catalog-nav-sheet inset-y-0 right-0 w-[min(22rem,92vw)] rounded-l-2xl" : "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:max-h-[calc(100dvh-6rem)] sm:w-96 sm:rounded-2xl")}>
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Close className="flex size-11 items-center justify-center rounded-lg hover:bg-muted" aria-label={t.mobile.close}><X className="size-5" /></Dialog.Close>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
