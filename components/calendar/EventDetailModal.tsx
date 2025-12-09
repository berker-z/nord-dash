import React from "react";
import { CalendarEvent } from "../../types";
import {
  Clock,
  Edit,
  Trash2,
  Users,
  Video,
  ExternalLink,
  X,
} from "lucide-react";
import { ModalFrame } from "../ui/ModalFrame";

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
  return (
    <ModalFrame
      title={event.title}
      tone="info"
      size="lg"
      onClose={onClose}
      hideHeader
      bodyClassName="space-y-6"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="text-lg font-semibold text-nord-4 truncate">
            {event.title}
          </h2>
          <div className="flex items-center gap-3 text-nord-13 text-sm font-mono font-medium">
            <Clock size={16} />
            <span>
              {event.date.toLocaleDateString()} :: {event.time}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-nord-3">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-nord-2 hover:text-nord-8 transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-nord-2 hover:text-nord-11 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-nord-2 hover:text-nord-13 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="h-px bg-nord-2" />

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
    </ModalFrame>
  );
};
