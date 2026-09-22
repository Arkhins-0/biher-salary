"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CloseIcon,
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "./icons";

export type NotificationVariant = "info" | "warning" | "success" | "error";

interface ToastItem {
  id: number;
  variant: NotificationVariant;
  title: string;
  description?: string;
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ToastContextValue {
  showToast: (input: Omit<ToastItem, "id">) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within NotificationsProvider");
  }
  return useMemo(
    () => ({
      info: (title: string, description?: string) =>
        ctx.showToast({ variant: "info", title, description }),
      success: (title: string, description?: string) =>
        ctx.showToast({ variant: "success", title, description }),
      warning: (title: string, description?: string) =>
        ctx.showToast({ variant: "warning", title, description }),
      error: (title: string, description?: string) =>
        ctx.showToast({ variant: "error", title, description }),
    }),
    [ctx],
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within NotificationsProvider");
  }
  return ctx.confirm;
}

const VARIANT_STYLES: Record<
  NotificationVariant,
  {
    border: string;
    bg: string;
    iconBg: string;
    iconColor: string;
    Icon: typeof InfoIcon;
  }
> = {
  info: {
    border: "border-blue-200 dark:border-blue-900",
    bg: "bg-blue-50 dark:bg-blue-950",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-300",
    Icon: InfoIcon,
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-300",
    Icon: WarningIcon,
  },
  success: {
    border: "border-green-200 dark:border-green-900",
    bg: "bg-green-50 dark:bg-green-950",
    iconBg: "bg-green-100 dark:bg-green-900",
    iconColor: "text-green-600 dark:text-green-300",
    Icon: SuccessIcon,
  },
  error: {
    border: "border-red-200 dark:border-red-900",
    bg: "bg-red-50 dark:bg-red-950",
    iconBg: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600 dark:text-red-300",
    Icon: ErrorIcon,
  },
};

const TOAST_DURATION_MS = 5000;

export default function NotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null,
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (input: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...input, id }]);
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmRequest({ ...options, resolve });
    });
  }, []);

  const toastContextValue = useMemo(() => ({ showToast }), [showToast]);
  const confirmContextValue = useMemo(() => ({ confirm }), [confirm]);

  function resolveConfirm(result: boolean) {
    confirmRequest?.resolve(result);
    setConfirmRequest(null);
  }

  return (
    <ToastContext.Provider value={toastContextValue}>
      <ConfirmContext.Provider value={confirmContextValue}>
        {children}

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
          {toasts.map((t) => {
            const style = VARIANT_STYLES[t.variant];
            const Icon = style.Icon;
            return (
              <div
                key={t.id}
                role="status"
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${style.border} ${style.bg}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  aria-label="Dismiss"
                  className="shrink-0 text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {confirmRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className={`w-full max-w-sm rounded-xl border p-5 shadow-xl ${VARIANT_STYLES.warning.border} ${VARIANT_STYLES.warning.bg}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${VARIANT_STYLES.warning.iconBg} ${VARIANT_STYLES.warning.iconColor}`}
                >
                  <WarningIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {confirmRequest.title}
                  </p>
                  <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                    {confirmRequest.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => resolveConfirm(false)}
                  className="h-9 rounded-md border border-black/15 px-3 text-sm dark:border-white/20"
                >
                  {confirmRequest.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => resolveConfirm(true)}
                  className="h-9 rounded-md bg-amber-600 px-3 text-sm font-medium text-white hover:bg-amber-700"
                >
                  {confirmRequest.confirmLabel ?? "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
