"use client";

import { useCallback, useEffect, useId, useRef } from "react";

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Ha false, a háttér kattintás nem zárja (pl. kötelező megerősítés) */
  closeOnBackdrop?: boolean;
};

export function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
}: AppModalProps): React.ReactElement | null {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Bezárás"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={() => {
          if (closeOnBackdrop) {
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/50 outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          {title}
        </h2>
        <div className="mt-4 text-sm leading-relaxed text-zinc-300">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Igen",
  cancelLabel = "Mégse",
  variant = "primary",
}: ConfirmModalProps): React.ReactElement | null {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              variant === "danger"
                ? "rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                : "rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            }
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </AppModal>
  );
}
