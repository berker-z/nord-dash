import React from "react";
import { AlertTriangle } from "lucide-react";
import { ModalFrame } from "./ui/ModalFrame";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <ModalFrame
      title={title}
      icon={<AlertTriangle size={20} />}
      tone={isDestructive ? "danger" : "info"}
      size="sm"
      onClose={onCancel}
      hideHeader
      bodyClassName="space-y-4 text-sm leading-relaxed"
      footer={
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-nord-4 hover:text-nord-6 transition-colors font-mono text-sm uppercase tracking-wider"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded text-nord-1 transition-colors font-mono text-sm uppercase tracking-wider ${
              isDestructive
                ? "bg-nord-11 hover:bg-nord-11/80"
                : "bg-nord-9 hover:bg-nord-9/80"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="font-mono text-nord-4">{message}</p>
    </ModalFrame>
  );
};
