import React from "react";
import { CalendarEvent } from "../../types";
import { htmlToText } from "../../services/htmlText";

interface Props {
  evt: CalendarEvent;
  onClick: () => void;
}

// Flat agenda row: time · account-colored bar · title. No card chrome.
export const EventItem: React.FC<Props> = ({ evt, onClick }) => {
  const colorMap: Record<string, string> = {
    "2": "bg-green",
    "9": "bg-blue",
    "11": "bg-red",
    "12": "bg-orange",
    "13": "bg-yellow",
    "14": "bg-green",
    "15": "bg-magenta",
  };

  const accent = colorMap[evt.colorId || "9"] || colorMap["9"];

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-raised transition-colors border-b border-divider group"
    >
      <span className="text-muted text-xs flex-shrink-0 w-[5ch] tabular-nums">
        {evt.time}
      </span>
      <span className={`w-0.5 self-stretch flex-shrink-0 ${accent}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate">{evt.title}</span>
        {evt.description && (
          <span className="text-xs text-muted block truncate">
            {htmlToText(evt.description)}
          </span>
        )}
      </span>
    </div>
  );
};
