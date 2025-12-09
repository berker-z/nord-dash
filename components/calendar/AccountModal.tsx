import React, { useState } from "react";
import { CalendarAccount } from "../../types";
import { Plus, LogOut, X } from "lucide-react";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 border-2 border-nord-8 w-full max-w-md p-6 rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-nord-1 pb-2">
          <h2 className="text-lg font-medium text-nord-6 uppercase">
            Connected Accounts
          </h2>
          <button
            onClick={onClose}
            className="text-nord-3 hover:text-nord-11"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 mb-6">
          {accounts.map((acc) => (
            <div key={acc.email} className="bg-nord-1 p-3 rounded border border-nord-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={acc.picture}
                    alt={acc.name}
                    fallback={acc.name?.[0] || acc.email[0].toUpperCase()}
                  />
                  <div>
                    <div className="text-base font-medium text-nord-5">
                      {acc.name || acc.email}
                    </div>
                    <div className="text-xs text-nord-3">{acc.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-nord-13 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-nord-14 animate-pulse"></div>{" "}
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
                  <label
                    key={cal.id}
                    className="flex items-center gap-3 text-sm text-nord-4 cursor-pointer hover:text-nord-6 select-none transition-opacity"
                  >
                    <input
                      type="checkbox"
                      checked={cal.isVisible !== false}
                      onChange={() => onToggleCalendar(acc.email, cal.id)}
                      className="rounded border-nord-3 bg-nord-0 text-nord-9 focus:ring-nord-9 w-4 h-4"
                    />
                    <span className={cal.isVisible === false ? "opacity-40" : ""}>
                      {cal.summary}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            onConnect();
            onClose();
          }}
          className="w-full py-3 bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-6 font-bold rounded transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> CONNECT ANOTHER ACCOUNT
        </button>
      </div>
    </div>
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
