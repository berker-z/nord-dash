import React from "react";
import { ChevronDown } from "lucide-react";

interface WidgetFrameProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

const baseContainer =
  "flex flex-col bg-nord-0/90 border-2 border-nord-16 rounded-frame transition-all duration-200 overflow-hidden hover:border-nord-8/70 backdrop-blur-md";

export const WidgetFrame: React.FC<WidgetFrameProps> = ({
  title,
  subtitle,
  meta,
  icon,
  badge,
  controls,
  children,
  collapsed = false,
  onToggleCollapse,
  className,
  bodyClassName,
  bodyStyle,
  style,
}) => {
  const containerClasses = className
    ? `${baseContainer} ${className}`
    : baseContainer;
  const contentClasses = bodyClassName
    ? `flex-1 overflow-auto p-5 text-nord-4 ${bodyClassName}`
    : "flex-1 overflow-auto p-5 text-nord-4";

  return (
    <div className={containerClasses} style={style}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-nord-16 bg-nord-16">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="p-2 text-nord-3">{icon}</div>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-nord-4 font-normal text-sm md:text-base truncate tracking-[0.16em]">
                {title}
              </span>
              {badge}
            </div>
            {(subtitle || meta) && (
              <div className="flex items-center gap-3 text-muted-sm">
                {subtitle && <span className="truncate">{subtitle}</span>}
                {subtitle && meta && <span className="text-nord-3/60">•</span>}
                {meta && <span className="truncate">{meta}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-nord-3">
          {controls}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-nord-2 rounded-lg hover:text-nord-13 transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <ChevronDown
                size={18}
                className={collapsed ? "rotate-180 transition-transform" : ""}
              />
            </button>
          )}
        </div>
      </div>

      <div className={`${collapsed ? "hidden" : "flex"} flex-1 flex-col`}>
        <div className={contentClasses} style={bodyStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};
