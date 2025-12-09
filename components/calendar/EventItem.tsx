import React from "react";
import { CalendarEvent } from "../../types";

interface Props {
  evt: CalendarEvent;
  onClick: () => void;
}

export const EventItem: React.FC<Props> = ({ evt, onClick }) => {
  const colorMap: Record<string, { border: string; hover: string }> = {
    "2": { border: "border-nord-14", hover: "hover:bg-nord-14/10" },
    "9": { border: "border-nord-9", hover: "hover:bg-nord-9/10" },
    "11": { border: "border-nord-11", hover: "hover:bg-nord-11/10" },
    "12": { border: "border-nord-12", hover: "hover:bg-nord-12/10" },
    "13": { border: "border-nord-13", hover: "hover:bg-nord-13/10" },
    "14": { border: "border-nord-14", hover: "hover:bg-nord-14/10" },
    "15": { border: "border-nord-15", hover: "hover:bg-nord-15/10" },
  };

  const { border, hover } =
    colorMap[evt.colorId || "9"] || colorMap["9"];

  return (
    <div
      onClick={onClick}
      className={`bg-nord-1 p-4 rounded-md border-l-4 ${border} ${hover} transition-colors cursor-pointer group`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-nord-5">{evt.title}</span>
        <span className="text-sm font-mono text-nord-3 group-hover:text-nord-6 font-medium">
          {evt.time}
        </span>
      </div>
      {evt.description && (
        <p className="text-sm text-nord-4 truncate opacity-70">
          {evt.description}
        </p>
      )}
    </div>
  );
};
