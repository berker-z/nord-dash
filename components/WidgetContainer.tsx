import React from "react";
import { LayoutItem } from "../types";
import { Minus, Plus, GripVertical, ChevronDown } from "lucide-react";

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
    <div
      className={`
        flex flex-col
        bg-nord-0 border-2 border-nord-16 rounded-2xl
        transition-all duration-200
        h-auto
        mb-8
        overflow-hidden
        hover:border-nord-8 shadow-lg
      `}
      style={{
        paddingBottom: isMinimized ? "0px" : `${item.heightLevel * 200}px`,
      }}
    >
      {/* Header */}
      <div className="bg-nord-16 px-4 py-3 flex items-center justify-between border-b-2 border-nord-16 select-none">
        <div className="flex items-center gap-3 text-nord-4 font-medium text-lg tracking-widest font-mono">
          <GripVertical size={20} className="text-nord-3" />
          {item.title}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          {!isMinimized && (
            <>
              <button
                onClick={() => onResize(-1)}
                className="p-1 hover:bg-nord-2 rounded hover:text-nord-11 disabled:opacity-30"
                disabled={item.heightLevel <= 0}
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => onResize(1)}
                className="p-1 hover:bg-nord-2 rounded hover:text-nord-14 disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-nord-2 rounded hover:text-nord-13"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown size={18} className="rotate-180" />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 p-0 bg-nord-0 relative flex flex-col rounded-b-2xl overflow-hidden ${
          isMinimized ? "hidden" : "flex"
        }`}
      >
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
};
