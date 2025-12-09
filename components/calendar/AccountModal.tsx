import React, { useState } from "react";
import { CalendarAccount } from "../../types";
import { Plus, LogOut, Users, X } from "lucide-react";
import { ModalFrame } from "../ui/ModalFrame";

interface Props {
  accounts: CalendarAccount[];
  onClose: () => void;
  onConnect: () => void;
  onRemoveAccount: (accountEmail: string) => void;
}

export const AccountModal: React.FC<Props> = ({
  accounts,
  onClose,
  onConnect,
  onRemoveAccount,
}) => {
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
            return (
              <div key={acc.email} className="py-4 flex items-center justify-between gap-3">
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
                  </div>
                </div>
                <button
                  onClick={() => onRemoveAccount(acc.email)}
                  className="p-2 text-nord-6 hover:text-nord-11 transition-colors"
                  title="Disconnect account"
                >
                  <LogOut size={18} />
                </button>
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
