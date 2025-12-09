import React from "react";
import { CalendarEvent } from "../../types";

interface Props {
  evt: CalendarEvent;
  onClick: () => void;
}

export const EventItem: React.FC<Props> = ({ evt, onClick }) => {
  const colorMap: Record<string, { border: string; accent: string }> = {
    "2": { border: "border-nord-14", accent: "bg-nord-14" },
    "9": { border: "border-nord-9", accent: "bg-nord-9" },
    "11": { border: "border-nord-11", accent: "bg-nord-11" },
    "12": { border: "border-nord-12", accent: "bg-nord-12" },
    "13": { border: "border-nord-13", accent: "bg-nord-13" },
    "14": { border: "border-nord-14", accent: "bg-nord-14" },
    "15": { border: "border-nord-15", accent: "bg-nord-15" },
  };

  const { accent } = colorMap[evt.colorId || "9"] || colorMap["9"];

  return (
    <div
      onClick={onClick}
      className="bg-nord-1/90 p-4 rounded-lg border border-nord-2 cursor-pointer group shadow-none relative pl-4"
    >
      <div className={`absolute inset-y-3 left-2 w-1 rounded-full ${accent} opacity-80`} />
      <div className="flex justify-between items-center mb-1 pl-2">
        <span className="font-medium text-nord-5">{evt.title}</span>
        <span className="text-base font-mono text-nord-6">
          {evt.time}
        </span>
      </div>
      {evt.description && (
        <p className="text-sm text-nord-4 truncate opacity-70 pl-2">
          {evt.description}
        </p>
      )}
    </div>
  );
};
