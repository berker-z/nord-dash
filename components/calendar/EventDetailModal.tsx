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
import { htmlToText } from "../../services/htmlText";

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
          <h2 className="text-section truncate">
            {event.title}
          </h2>
          <div className="flex items-center gap-3 text-yellow text-sm font-mono">
            <Clock size={15} />
            <span>
              {event.date.toLocaleDateString()} :: {event.time}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-raised hover:text-accent transition-colors"
            title="Edit"
          >
            <Edit size={17} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-raised hover:text-red transition-colors"
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-raised hover:text-yellow transition-colors"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="h-px bg-divider" />

      {event.description && (
        <div className="pl-4 border-l-2 border-faint text-ink leading-relaxed font-mono whitespace-pre-line">
          {htmlToText(event.description)}
        </div>
      )}

      {event.link && (
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-accent hover:text-teal transition-colors border border-faint p-3 hover:bg-raised hover:border-accent group"
        >
          <Video size={18} />
          <span className="truncate">{event.link}</span>
          <ExternalLink
            size={15}
            className="ml-auto opacity-50 group-hover:opacity-100"
          />
        </a>
      )}

      {event.attendees && event.attendees.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider mb-2">
            <Users size={14} /> Attendees
          </div>
          <div className="flex flex-wrap gap-2">
            {event.attendees.map((a, i) => (
              <div
                key={i}
                className="bg-raised border border-faint px-2.5 py-1 text-xs text-ink flex items-center gap-2"
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
