import React, { useState } from "react";
import { CalendarAccount } from "../../types";
import { Plus, LogOut, Users, X } from "lucide-react";
import { ModalFrame } from "../ui/ModalFrame";
import { Checkbox } from "../ui/Checkbox";

interface Props {
  accounts: CalendarAccount[];
  onClose: () => void;
  onConnect: () => void;
  onToggleCalendar: (accountEmail: string, calendarId: string) => void;
  onRemoveAccount: (accountEmail: string) => void;
}

export const AccountModal: React.FC<Props> = ({
  accounts,
  onClose,
  onConnect,
  onToggleCalendar,
  onRemoveAccount,
}) => {
  return (
    <ModalFrame
      title="Connected Accounts"
      subtitle="Toggle calendars or disconnect access"
      icon={<Users size={18} />}
      tone="info"
      size="md"
      onClose={onClose}
      hideHeader
      bodyClassName="space-y-4"
      footer={
        <button
          onClick={() => {
            onConnect();
            onClose();
          }}
          className="w-full sm:w-auto sm:min-w-[14rem] py-3 px-4 bg-nord-9 text-nord-0 font-bold rounded-lg transition-colors hover:bg-nord-8 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> CONNECT ANOTHER ACCOUNT
        </button>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-nord-8 font-semibold">
          <Users size={18} /> Connected Accounts
        </div>
        <button
          onClick={onClose}
          className="p-2 text-nord-3 hover:text-nord-11 hover:bg-nord-1 rounded transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="h-px bg-nord-2" />
      {accounts.length === 0 ? (
        <div className="text-nord-3 text-sm">No accounts connected.</div>
      ) : (
        accounts.map((acc) => (
          <div
            key={acc.email}
            className="bg-nord-1/60 p-3 rounded-lg border border-nord-3/80"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={acc.picture}
                  alt={acc.name}
                  fallback={acc.name?.[0] || acc.email[0].toUpperCase()}
                />
                <div className="min-w-0">
                  <div className="text-base font-medium text-nord-5 truncate">
                    {acc.name || acc.email}
                  </div>
                  <div className="text-xs text-nord-3 truncate">
                    {acc.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-nord-13 flex items-center gap-1 px-2 py-1 rounded-full bg-nord-0/60 border border-nord-3">
                  <div className="w-2 h-2 rounded-full bg-nord-14 animate-pulse"></div>
                  Active
                </div>
                <button
                  onClick={() => onRemoveAccount(acc.email)}
                  className="p-1.5 text-nord-3 hover:text-nord-11 hover:bg-nord-0 rounded transition-colors"
                  title="Disconnect Account"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
            <div className="pl-12 space-y-2 border-t border-nord-2 pt-3 mt-2">
              {acc.calendars.map((cal) => (
                <div key={cal.id} className="flex items-center gap-3 text-sm text-nord-4">
                  <Checkbox
                    checked={cal.isVisible !== false}
                    onChange={() => onToggleCalendar(acc.email, cal.id)}
                    aria-label={`Toggle ${cal.summary}`}
                  />
                  <span className={cal.isVisible === false ? "opacity-40" : ""}>
                    {cal.summary}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </ModalFrame>
  );
};

const Avatar: React.FC<{ src?: string; alt?: string; fallback: string }> = ({
  src,
  alt,
  fallback,
}) => {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 rounded-full object-cover bg-nord-3"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-nord-3 flex items-center justify-center text-nord-6 font-bold text-lg border border-nord-1">
      {fallback}
    </div>
  );
};
