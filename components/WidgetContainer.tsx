import React from "react";
import { LayoutItem } from "../types";
import { Minus, Plus, GripVertical } from "lucide-react";
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
      icon={<GripVertical size={20} className="text-nord-3" />}
      controls={
        !isMinimized && (
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={() => onResize(-1)}
              className="p-2 hover:bg-nord-2 rounded-lg hover:text-nord-11 disabled:opacity-30"
              disabled={item.heightLevel <= 0}
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => onResize(1)}
              className="p-2 hover:bg-nord-2 rounded-lg hover:text-nord-14 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
        )
      }
      collapsed={isMinimized}
      onToggleCollapse={() => setIsMinimized(!isMinimized)}
      className="mb-8"
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
