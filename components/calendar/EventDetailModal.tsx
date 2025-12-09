import React, { useEffect } from "react";
import { CalendarEvent } from "../../types";
import { Clock, Edit, Trash2, Users, Video, ExternalLink, X } from "lucide-react";

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const EventDetailModal: React.FC<Props> = ({
  event,
  onClose,
  onDelete,
  onEdit,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 border-2 border-nord-8 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-nord-3 hover:text-nord-8 hover:bg-nord-1 rounded transition-colors"
            title="Edit"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-nord-3 hover:text-nord-11 hover:bg-nord-1 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
          <div className="w-px h-6 bg-nord-3/30 mx-2"></div>
          <button
            onClick={onClose}
            className="p-1 text-nord-3 hover:text-nord-11 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="mb-8 border-b-2 border-nord-1 pb-4">
          <h2 className="text-xl font-medium text-nord-6 mb-2 uppercase">
            {event.title}
          </h2>
          <div className="flex items-center gap-3 text-nord-13 text-base font-mono font-medium">
            <Clock size={20} />
            <span>
              {event.date.toLocaleDateString()} :: {event.time}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {event.description && (
            <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-3 rounded-r-lg">
              {event.description}
            </div>
          )}

          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-nord-8 hover:text-nord-7 text-base transition-colors border-2 border-nord-3 p-3 hover:bg-nord-1 hover:border-nord-8 group rounded-lg"
            >
              <Video size={20} />
              <span className="truncate font-medium">{event.link}</span>
              <ExternalLink
                size={16}
                className="ml-auto opacity-50 group-hover:opacity-100"
              />
            </a>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                <Users size={14} /> Attendees
              </div>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((a, i) => (
                  <div
                    key={i}
                    className="bg-nord-1 border border-nord-3 rounded-full px-3 py-1 text-xs text-nord-4 flex items-center gap-2"
                  >
                    {a.email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
