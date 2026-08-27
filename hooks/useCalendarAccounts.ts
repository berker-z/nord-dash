import { useCallback, useEffect, useState } from "react";
import { CalendarAccount } from "../types";
import {
  getConnectedAccounts,
  connectCalendarAccount,
  refreshAccountTokenIfNeeded,
  removeCalendarAccount,
  syncAccountCalendars,
  updateAccountCalendars,
  getCalendarAuthErrorMessage,
} from "../services/authService";

interface Result {
  accounts: CalendarAccount[];
  loading: boolean;
  error: string | null;
  failedAccounts: string[];
  /** email -> the actual reason Google refused, for display + debugging */
  accountErrors: Record<string, string>;
  refreshAccounts: () => Promise<void>;
  connectAccount: () => Promise<void>;
  reauthAccount: (accountEmail: string) => Promise<void>;
  removeAccount: (accountEmail: string) => Promise<void>;
  setCalendarVisibility: (
    accountEmail: string,
    calendarId: string,
    isVisible: boolean,
  ) => Promise<void>;
}

export const useCalendarAccounts = (userEmail: string | null): Result => {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAccounts, setFailedAccounts] = useState<string[]>([]);
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>(
    {},
  );

  const refreshAccounts = useCallback(async () => {
    if (!userEmail) {
      setAccounts([]);
      setError(null);
      return;
    }
    setLoading(true);
    let hadRefreshFailure = false;
    const failedEmails: string[] = [];
    const failureReasons: Record<string, string> = {};
    try {
      const accs = await getConnectedAccounts(userEmail);
      const refreshedAccounts = await Promise.all(
        accs.map(async (account) => {
          let updatedAccount = account;
          try {
            const { accessToken, expiresAt } =
              await refreshAccountTokenIfNeeded(account, userEmail);
            updatedAccount = { ...account, accessToken, expiresAt };
          } catch (err) {
            console.error("Failed to refresh token for", account.email, err);
            hadRefreshFailure = true;
            failedEmails.push(account.email);
            failureReasons[account.email] = getCalendarAuthErrorMessage(err);
            return account;
          }

          try {
            const calendars = await syncAccountCalendars(
              updatedAccount,
              userEmail,
            );
            return { ...updatedAccount, calendars };
          } catch (err) {
            // A failed calendar-list sync shouldn't nuke the account or its
            // stored calendars — keep what we have. Only an auth error means
            // the account genuinely needs re-auth.
            console.error(
              "Failed to sync calendars for",
              account.email,
              err,
            );
            if (err instanceof Error && err.message === "UNAUTHORIZED") {
              hadRefreshFailure = true;
              failedEmails.push(account.email);
              failureReasons[account.email] = getCalendarAuthErrorMessage(err);
            }
            return updatedAccount;
          }
        }),
      );
      setAccounts(refreshedAccounts);
      setFailedAccounts(failedEmails);
      setAccountErrors(failureReasons);
      setError(
        hadRefreshFailure
          ? // Show the real cause, not just which accounts failed — a bare
            // "ACCOUNT_REFRESH_FAILED" makes this impossible to diagnose.
            failureReasons[failedEmails[0]] ||
              `ACCOUNT_REFRESH_FAILED: ${failedEmails.join(", ")}`
          : null,
      );
    } catch (e) {
      console.error("Failed to load calendar accounts", e);
      setError(`ACCOUNT_LOAD_FAILED: ${getCalendarAuthErrorMessage(e)}`);
      setFailedAccounts([]);
      setAccountErrors({});
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
    const interval = setInterval(
      () => {
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
                      : a,
                  ),
                );
              }
            })
            .catch((e) => {
              console.error("Failed to refresh token for", account.email, e);
              const reason = getCalendarAuthErrorMessage(e);
              setAccountErrors((prev) => ({ ...prev, [account.email]: reason }));
              setFailedAccounts((prev) =>
                prev.includes(account.email) ? prev : [...prev, account.email],
              );
              setError(reason);
            });
        });
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [userEmail, accounts]);

  const connectAccount = useCallback(async () => {
    if (!userEmail) return;
    setError(null);
    try {
      await connectCalendarAccount(userEmail);
      await refreshAccounts();
    } catch (error) {
      const message = getCalendarAuthErrorMessage(error);
      setError(message);
      throw error;
    }
  }, [userEmail, refreshAccounts]);

  const reauthAccount = useCallback(
    async (accountEmail: string) => {
      if (!userEmail) return;
      setError(null);
      try {
        await connectCalendarAccount(userEmail, accountEmail);
        await refreshAccounts();
      } catch (error) {
        setError(getCalendarAuthErrorMessage(error));
        throw error;
      }
    },
    [userEmail, refreshAccounts],
  );

  const removeAccount = useCallback(
    async (accountEmail: string) => {
      if (!userEmail) return;
      await removeCalendarAccount(userEmail, accountEmail);
      await refreshAccounts();
    },
    [userEmail, refreshAccounts],
  );

  const setCalendarVisibility = useCallback(
    async (accountEmail: string, calendarId: string, isVisible: boolean) => {
      if (!userEmail) return;

      const nextAccounts = accounts.map((account) =>
        account.email !== accountEmail
          ? account
          : {
              ...account,
              calendars: (account.calendars || []).map((calendar) =>
                calendar.id === calendarId
                  ? { ...calendar, isVisible }
                  : calendar,
              ),
            },
      );

      setAccounts(nextAccounts);

      const targetAccount = nextAccounts.find(
        (account) => account.email === accountEmail,
      );
      if (!targetAccount) return;

      try {
        await updateAccountCalendars(
          userEmail,
          accountEmail,
          targetAccount.calendars || [],
        );
      } catch (error) {
        console.error("Failed to update calendar visibility", error);
        await refreshAccounts();
        throw error;
      }
    },
    [accounts, userEmail, refreshAccounts],
  );

  return {
    accounts,
    loading,
    error,
    failedAccounts,
    accountErrors,
    refreshAccounts,
    connectAccount,
    reauthAccount,
    removeAccount,
    setCalendarVisibility,
  };
};
