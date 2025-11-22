import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-nord-0 border-2 border-nord-11 w-full max-w-sm p-6 rounded-xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-nord-11 border-b border-nord-11/30 pb-2">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {title}
          </h3>
        </div>

        <p className="text-nord-4 mb-8 text-sm leading-relaxed font-mono">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-nord-4 hover:text-nord-6 transition-colors font-mono text-sm uppercase tracking-wider"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded font-bold text-nord-1 transition-colors font-mono text-sm uppercase tracking-wider ${
              isDestructive
                ? "bg-nord-11 hover:bg-nord-11/80"
                : "bg-nord-9 hover:bg-nord-9/80"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
