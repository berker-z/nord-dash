import { useCallback, useEffect, useState } from "react";
import { CalendarAccount } from "../types";
import {
  getConnectedAccounts,
  connectCalendarAccount,
  refreshAccountTokenIfNeeded,
  toggleCalendarVisibility,
  removeCalendarAccount,
} from "../services/authService";

interface Result {
  accounts: CalendarAccount[];
  loading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  connectAccount: () => Promise<void>;
  toggleCalendar: (accountEmail: string, calendarId: string) => Promise<void>;
  removeAccount: (accountEmail: string) => Promise<void>;
}

export const useCalendarAccounts = (userEmail: string | null): Result => {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    if (!userEmail) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    try {
      const accs = await getConnectedAccounts(userEmail);
      setAccounts(accs);
      setError(null);
    } catch (e) {
      console.error("Failed to load calendar accounts", e);
      setError("ACCOUNT_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Token auto-refresh (5 min before expiry)
  useEffect(() => {
    if (!userEmail || accounts.length === 0) return;
    const interval = setInterval(() => {
      accounts.forEach((account) => {
        refreshAccountTokenIfNeeded(account, userEmail)
          .then((newToken) => {
            if (newToken && newToken !== account.accessToken) {
              setAccounts((prev) =>
                prev.map((a) =>
                  a.email === account.email ? { ...a, accessToken: newToken } : a
                )
              );
            }
          })
          .catch((e) =>
            console.error("Failed to refresh token for", account.email, e)
          );
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userEmail, accounts]);

  const connectAccount = useCallback(async () => {
    if (!userEmail) return;
    await connectCalendarAccount(userEmail);
    await refreshAccounts();
  }, [userEmail, refreshAccounts]);

  const toggleCalendar = useCallback(
    async (accountEmail: string, calendarId: string) => {
      if (!userEmail) return;
      await toggleCalendarVisibility(userEmail, accountEmail, calendarId);
      await refreshAccounts();
    },
    [userEmail, refreshAccounts]
  );

  const removeAccount = useCallback(
    async (accountEmail: string) => {
      if (!userEmail) return;
      await removeCalendarAccount(userEmail, accountEmail);
      await refreshAccounts();
    },
    [userEmail, refreshAccounts]
  );

  return {
    accounts,
    loading,
    error,
    refreshAccounts,
    connectAccount,
    toggleCalendar,
    removeAccount,
  };
};
