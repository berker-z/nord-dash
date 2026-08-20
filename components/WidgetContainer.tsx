import React from "react";
import { LayoutItem } from "../types";
import { Minus, Plus } from "lucide-react";
import { WidgetFrame } from "./ui/WidgetFrame";

interface WidgetContainerProps {
  item: LayoutItem;
  children: React.ReactNode;
  onResize: (change: number) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  item,
  children,
  onResize,
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  return (
    <WidgetFrame
      title={item.title}
      controls={
        !isMinimized && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onResize(-1)}
              className="p-1 hover:text-red disabled:opacity-30 transition-colors"
              disabled={item.heightLevel <= 0}
              title="Shrink"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => onResize(1)}
              className="p-1 hover:text-green transition-colors"
              title="Grow"
            >
              <Plus size={14} />
            </button>
          </div>
        )
      }
      collapsed={isMinimized}
      onToggleCollapse={() => setIsMinimized(!isMinimized)}
      bodyStyle={
        isMinimized
          ? undefined
          : item.heightLevel > 0
            ? { minHeight: `${item.heightLevel * 200}px` }
            : undefined
      }
    >
      <div className="flex-1">{children}</div>
    </WidgetFrame>
  );
};
