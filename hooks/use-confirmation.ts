import { useState, useCallback } from "react";

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  itemName?: string;
  onConfirm: () => void;
}

export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const showConfirmation = useCallback(
    (config: Omit<ConfirmationState, "isOpen">) => {
      setConfirmation({
        isOpen: true,
        ...config,
      });
    },
    []
  );

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const confirm = useCallback(() => {
    if (confirmation?.onConfirm) {
      confirmation.onConfirm();
    }
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    confirm,
  };
}

