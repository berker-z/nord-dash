import React, { useState } from "react";
import { CalendarAccount } from "../../types";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  Users,
  X,
} from "lucide-react";
import { ModalFrame } from "../ui/ModalFrame";
import { Checkbox } from "../ui/Checkbox";

interface Props {
  accounts: CalendarAccount[];
  onClose: () => void;
  onConnect: () => void;
  onRemoveAccount: (accountEmail: string) => void;
  onToggleCalendarVisibility: (
    accountEmail: string,
    calendarId: string,
    isVisible: boolean,
  ) => void | Promise<void>;
  onReauthAccount?: (accountEmail: string) => void | Promise<void>;
  failedAccounts?: string[];
}

export const AccountModal: React.FC<Props> = ({
  accounts,
  onClose,
  onConnect,
  onRemoveAccount,
  onToggleCalendarVisibility,
  onReauthAccount,
  failedAccounts = [],
}) => {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>(() =>
    accounts.map((account) => account.email),
  );

  const toggleExpanded = (accountEmail: string) => {
    setExpandedAccounts((prev) =>
      prev.includes(accountEmail)
        ? prev.filter((email) => email !== accountEmail)
        : [...prev, accountEmail],
    );
  };

  return (
    <ModalFrame
      title="Connected Accounts"
      subtitle="Manage which calendars are connected"
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
          className="w-full sm:w-auto sm:min-w-[12rem] py-2.5 px-4 bg-nord-9 text-nord-0 rounded-lg transition-colors hover:bg-nord-8 flex items-center justify-center gap-2 tracking-tight"
        >
          <Plus size={18} /> Add account
        </button>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-nord-8">
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
        <div className="divide-y divide-nord-1/80">
          {accounts.map((acc) => {
            const isFailed = failedAccounts.includes(acc.email);
            const isExpanded = expandedAccounts.includes(acc.email);
            const visibleCalendars = (acc.calendars || []).filter(
              (calendar) => calendar.isVisible !== false,
            ).length;
            return (
              <div key={acc.email} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={acc.picture}
                      alt={acc.email}
                      fallback={acc.email[0].toUpperCase()}
                    />
                    <div className="min-w-0">
                      <div className="text-card-title truncate">
                        {acc.email}
                      </div>
                      <div className="text-[11px] text-nord-3">
                        {visibleCalendars} / {(acc.calendars || []).length}{" "}
                        calendars shown
                      </div>
                      {isFailed && (
                        <div className="text-[11px] text-nord-11/80">
                          Refresh failed - re-auth required
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(acc.email)}
                      className="px-2 py-2 text-[11px] border border-nord-3 text-nord-4 rounded hover:bg-nord-1 transition-colors flex items-center gap-1"
                      title="Show or hide calendars for this account"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      CALENDARS
                    </button>
                    {isFailed && onReauthAccount && (
                      <button
                        onClick={() => onReauthAccount(acc.email)}
                        className="px-3 py-2 text-[12px] border border-nord-9/60 text-nord-9 rounded hover:bg-nord-9/10 transition-colors"
                        title="Re-authenticate this account"
                      >
                        REAUTH
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveAccount(acc.email)}
                      className="p-2 text-nord-6 hover:text-nord-11 transition-colors"
                      title="Disconnect account"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-[52px] pl-0.5 space-y-2">
                    {(acc.calendars || []).map((calendar) => (
                      <div
                        key={`${acc.email}:${calendar.id}`}
                        className="flex items-center justify-between gap-3 text-sm text-nord-4"
                      >
                        <span className="min-w-0 flex items-center gap-2">
                          <Checkbox
                            checked={calendar.isVisible !== false}
                            onChange={(checked) =>
                              onToggleCalendarVisibility(
                                acc.email,
                                calendar.id,
                                checked,
                              )
                            }
                          />
                          <span className="truncate">
                            {calendar.summary}
                            {calendar.primary ? " (Primary)" : ""}
                          </span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-nord-3">
                          {calendar.accessRole || "reader"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
    <div className="w-10 h-10 rounded-full bg-nord-3 flex items-center justify-center text-nord-6 text-lg border border-nord-1">
      {fallback}
    </div>
  );
};
