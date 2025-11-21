import React from 'react';
import { LayoutItem } from '../types';
import { Minus, Plus, GripVertical } from 'lucide-react';

interface WidgetContainerProps {
  item: LayoutItem;
  children: React.ReactNode;
  onResize: (change: number) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  item, 
  children, 
  onResize, 
  onDragStart, 
  onDrop,
  isDragging
}) => {
  
  const getHeightClass = (level: number) => {
    switch (level) {
      case 1: return 'h-[300px]';
      case 2: return 'h-[500px]';
      case 3: return 'h-[700px]';
      default: return 'h-[500px]';
    }
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`
        flex flex-col
        bg-nord-0 border-2 border-nord-3 rounded-2xl
        transition-all duration-200
        ${getHeightClass(item.heightLevel)}
        mb-8
        overflow-hidden
        ${isDragging ? 'opacity-50 border-dashed border-nord-9' : 'hover:border-nord-8 shadow-lg'}
      `}
    >
      {/* Header - The entire header is the drag handle */}
      <div className="bg-nord-1 px-4 py-3 flex items-center justify-between border-b-2 border-nord-3 select-none cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-3 text-nord-4 font-medium text-lg tracking-widest font-mono">
          <GripVertical size={20} className="text-nord-3" />
          {item.title}
        </div>
        
        {/* Controls - Only Resize */}
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onResize(-1)} 
            className="p-1 hover:bg-nord-2 rounded hover:text-nord-11 disabled:opacity-30"
            disabled={item.heightLevel <= 1}
          >
            <Minus size={18} />
          </button>
          <button 
            onClick={() => onResize(1)} 
            className="p-1 hover:bg-nord-2 rounded hover:text-nord-14 disabled:opacity-30"
            disabled={item.heightLevel >= 3}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-0 overflow-hidden bg-nord-0 relative flex flex-col">
         <div className="flex-1 overflow-auto p-5">
            {children}
         </div>
      </div>
    </div>
  );
};