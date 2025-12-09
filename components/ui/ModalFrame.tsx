import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalTone = "default" | "info" | "danger";
type ModalSize = "sm" | "md" | "lg";

interface ModalFrameProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: ModalTone;
  size?: ModalSize;
  children: React.ReactNode;
  onClose?: () => void;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  hideHeader?: boolean;
}

const toneStyles: Record<
  ModalTone,
  { border: string; header: string; accent: string; icon: string }
> = {
  default: {
    border: "border-nord-16",
    header: "bg-nord-16/30",
    accent: "text-nord-4",
    icon: "bg-nord-16/60 text-nord-4",
  },
  info: {
    border: "border-nord-9/50",
    header: "bg-nord-9/15",
    accent: "text-nord-9",
    icon: "bg-nord-9/20 text-nord-9",
  },
  danger: {
    border: "border-nord-11/50",
    header: "bg-nord-11/15",
    accent: "text-nord-11",
    icon: "bg-nord-11/15 text-nord-11",
  },
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
};

export const ModalFrame: React.FC<ModalFrameProps> = ({
  title,
  subtitle,
  icon,
  tone = "default",
  size = "md",
  children,
  onClose,
  headerActions,
  footer,
  className,
  bodyClassName,
  bodyStyle,
  hideHeader = false,
}) => {
  const toneClass = toneStyles[tone];
  const containerClasses = className
    ? `relative bg-nord-0/90 border-2 rounded-modal backdrop-blur-md flex flex-col overflow-hidden ${toneClass.border} ${className}`
    : `relative bg-nord-0/90 border-2 rounded-modal backdrop-blur-md flex flex-col overflow-hidden ${toneClass.border}`;
  const bodyClasses = bodyClassName
    ? `p-5 text-nord-4 ${bodyClassName}`
    : "p-5 text-nord-4";

  React.useEffect(() => {
    if (!onClose) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-nord-0/70 backdrop-blur-md p-4"
      onClick={() => onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div
        className={`w-full ${sizeClasses[size]} max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={containerClasses}>
          {!hideHeader && (
            <div
              className={`flex items-start justify-between gap-3 px-5 py-4 border-b border-nord-16/70 ${toneClass.header}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {icon && (
                  <div className={`p-2 rounded-xl border border-transparent ${toneClass.icon}`}>
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h3
                    className={`text-sm md:text-base font-semibold ${toneClass.accent} truncate`}
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-nord-3 mt-1 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-nord-3">
                {headerActions}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-nord-2 hover:text-nord-13 transition-colors"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={`flex-1 overflow-auto ${bodyClasses}`} style={bodyStyle}>
            {children}
          </div>

          {footer && (
            <div className="border-t border-nord-16/50 bg-nord-0/60 px-5 py-3 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
