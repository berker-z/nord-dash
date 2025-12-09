import React from "react";
import { CheckSquare, Square } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  size?: number;
  className?: string;
  "aria-label"?: string;
}

// Shared checkbox that matches the todo list aesthetic
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  size = 18,
  className = "",
  "aria-label": ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 text-nord-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-nord-9 rounded ${className}`}
      aria-label={ariaLabel}
    >
      {checked ? (
        <CheckSquare size={size} className="text-nord-14" />
      ) : (
        <Square size={size} className="text-nord-3" />
      )}
      {label && <span className="text-nord-4 text-sm">{label}</span>}
    </button>
  );
};
