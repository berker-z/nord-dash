import { useCallback, useEffect, useState } from "react";
import { CalendarAccount } from "../types";
import {
  getConnectedAccounts,
  connectCalendarAccount,
  refreshAccountTokenIfNeeded,
  removeCalendarAccount,
} from "../services/authService";

interface Result {
  accounts: CalendarAccount[];
  loading: boolean;
  error: string | null;
  failedAccounts: string[];
  refreshAccounts: () => Promise<void>;
  connectAccount: () => Promise<void>;
  reauthAccount: (accountEmail: string) => Promise<void>;
  removeAccount: (accountEmail: string) => Promise<void>;
}

export const useCalendarAccounts = (userEmail: string | null): Result => {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAccounts, setFailedAccounts] = useState<string[]>([]);

  const refreshAccounts = useCallback(async () => {
    if (!userEmail) {
      setAccounts([]);
      setError(null);
      return;
    }
    setLoading(true);
    let hadRefreshFailure = false;
    const failedEmails: string[] = [];
    try {
      const accs = await getConnectedAccounts(userEmail);
      const refreshedAccounts = await Promise.all(
        accs.map(async (account) => {
          try {
            const { accessToken, expiresAt } = await refreshAccountTokenIfNeeded(
              account,
              userEmail
            );
            return { ...account, accessToken, expiresAt };
          } catch (err) {
            console.error("Failed to refresh token for", account.email, err);
            hadRefreshFailure = true;
            failedEmails.push(account.email);
            return account;
          }
        })
      );
      setAccounts(refreshedAccounts);
      setFailedAccounts(failedEmails);
      setError(
        hadRefreshFailure
          ? `ACCOUNT_REFRESH_FAILED: ${failedEmails.join(", ")}`
          : null
      );
    } catch (e) {
      console.error("Failed to load calendar accounts", e);
      setError("ACCOUNT_LOAD_FAILED");
      setFailedAccounts([]);
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
          .then(({ accessToken, expiresAt, refreshed }) => {
            if (
              refreshed ||
              accessToken !== account.accessToken ||
              expiresAt !== account.expiresAt
            ) {
              setAccounts((prev) =>
                prev.map((a) =>
                  a.email === account.email
                    ? { ...a, accessToken, expiresAt }
                    : a
                )
              );
            }
          })
          .catch((e) => {
            console.error("Failed to refresh token for", account.email, e);
            setFailedAccounts((prev) => {
              const next = prev.includes(account.email)
                ? prev
                : [...prev, account.email];
              setError(`ACCOUNT_REFRESH_FAILED: ${next.join(", ")}`);
              return next;
            });
          });
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userEmail, accounts]);

  const connectAccount = useCallback(async () => {
    if (!userEmail) return;
    await connectCalendarAccount(userEmail);
    await refreshAccounts();
  }, [userEmail, refreshAccounts]);

  const reauthAccount = useCallback(
    async (accountEmail: string) => {
      if (!userEmail) return;
      await connectCalendarAccount(userEmail, accountEmail);
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
    failedAccounts,
    refreshAccounts,
    connectAccount,
    reauthAccount,
    removeAccount,
  };
};
