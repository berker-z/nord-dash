import React, { useState, useEffect, useRef } from "react";
import { LayoutItem, WidgetType, WeatherData, CalendarAccount } from "./types";
import { WidgetContainer } from "./components/WidgetContainer";
import { CalendarWidget } from "./components/CalendarWidget";
import { TodoWidget } from "./components/TodoWidget";
import { CryptoWidget } from "./components/CryptoWidget";
import { BibleWidget } from "./components/BibleWidget";
import { NotepadWidget } from "./components/NotepadWidget";
import { fetchWeather } from "./services/weatherService";
import {
  completeOAuthRedirect,
  handleIdentityLogin,
  getCalendarAuthErrorMessage,
  isGooglePopupOpenFailure,
  startIdentityRedirectLogin,
} from "./services/authService";
import { GOOGLE_CLIENT_ID, ALLOWED_EMAILS } from "./config";
import { Terminal, Lock, ShieldAlert, Copy } from "lucide-react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./services/firebase";
import { ConfirmModal } from "./components/ConfirmModal";
import { StatusLine } from "./components/ui/StatusLine";
import { useCalendarAccounts } from "./hooks/useCalendarAccounts";
import { useTheme } from "./hooks/useTheme";

// Declare Google Global for TS
declare global {
  interface Window {
    google: any;
  }
}

// JWT Decoder Helper
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

// Initial Layout Configuration
const initialLayout: Record<number, LayoutItem[]> = {
  0: [
    { id: "w1", type: WidgetType.CALENDAR, title: "/calendar", heightLevel: 0 },
    {
      id: "w2",
      type: WidgetType.AGENDA,
      title: "/daily_agenda",
      heightLevel: 0,
    },
    {
      id: "w6",
      type: WidgetType.NOTEPAD,
      title: "/notepad",
      heightLevel: 0,
    },
  ],
  1: [
    { id: "w3", type: WidgetType.TODO, title: "/tasks", heightLevel: 0 },
  ],
  2: [
    { id: "w4", type: WidgetType.CRYPTO, title: "/markets", heightLevel: 0 },
    { id: "w5", type: WidgetType.BIBLE, title: "/bible_qotd", heightLevel: 0 },
  ],
};

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem("nord_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("nord_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("nord_user");
    }
  }, [user]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [layout, setLayout] = useState(initialLayout);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [originUrl, setOriginUrl] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [firebaseAuthError, setFirebaseAuthError] = useState<string | null>(
    null,
  );
  const { theme, setTheme, themes } = useTheme();

  const {
    accounts: calendarAccounts,
    loading: loadingAccounts,
    error: calendarAccountError,
    failedAccounts: failedCalendarAccounts,
    accountErrors: calendarAccountErrors,
    refreshAccounts: refreshCalendarAccounts,
    connectAccount: connectCalendarAccount,
    reauthAccount: reauthCalendarAccount,
    removeAccount: removeCalendarAccount,
    setCalendarVisibility: setCalendarVisibility,
  } = useCalendarAccounts(user?.email || null);

  // Clock & Weather Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchWeather().then(setWeather);
    setOriginUrl(window.location.origin);
    return () => clearInterval(timer);
  }, []);

  // Check for Google Script Load
  useEffect(() => {
    const checkGoogle = () => {
      if (window.google && window.google.accounts) {
        setIsGoogleLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkGoogle()) {
      const interval = setInterval(() => {
        if (checkGoogle()) clearInterval(interval);
      }, 300);
      const timeout = setTimeout(() => {
        if (!window.google?.accounts) {
          setAuthError(
            "GOOGLE_IDENTITY_SCRIPT_UNAVAILABLE: Google sign-in did not load. Allow accounts.google.com scripts/content for this site and refresh.",
          );
        }
      }, 8000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const completeRedirectLogin = async () => {
      if (
        !window.location.search.includes("code=") &&
        !window.location.search.includes("error=")
      ) {
        return;
      }

      setIsLoginPending(true);
      setAuthError(null);
      try {
        const redirectPurpose = await completeOAuthRedirect();
        if (redirectPurpose === "calendar") {
          await refreshCalendarAccounts();
        }
      } catch (e) {
        console.error("Redirect Login Failed", e);
        if (isMounted) setAuthError(getCalendarAuthErrorMessage(e));
      } finally {
        if (isMounted) setIsLoginPending(false);
      }
    };

    void completeRedirectLogin();
    return () => {
      isMounted = false;
    };
  }, [refreshCalendarAccounts]);

  // Handle Identity Login
  const handleLogin = async () => {
    setAuthError(null);
    if (!isGoogleLoaded) {
      setAuthError(
        "GOOGLE_IDENTITY_SCRIPT_UNAVAILABLE: Google sign-in is still loading or blocked. Allow accounts.google.com scripts/content for this site and refresh.",
      );
      return;
    }

    setIsLoginPending(true);
    try {
      await handleIdentityLogin();
      // User state will be updated by onAuthStateChanged/localStorage logic if we wanted,
      // but for now we might need to manually set user if we aren't fully relying on onAuthStateChanged yet.
      // Actually, handleIdentityLogin signs into Firebase.
      // We should listen to onAuthStateChanged.
    } catch (e: any) {
      console.error("Login Failed", e);
      if (isGooglePopupOpenFailure(e)) {
        startIdentityRedirectLogin();
        return;
      }
      setAuthError(getCalendarAuthErrorMessage(e));
    } finally {
      setIsLoginPending(false);
    }
  };

  // Auth State Listener — Firebase is the source of truth.
  // The localStorage copy of the user is only an optimistic pre-paint hint;
  // if Firebase says the session is gone, every Firestore read would be
  // permission-denied anyway (empty calendar, "missing" todos), so force the
  // login screen instead of a silently broken dashboard.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        if (ALLOWED_EMAILS.includes(firebaseUser.email || "")) {
          setUser({
            email: firebaseUser.email!,
            name: firebaseUser.displayName || "User",
            picture: firebaseUser.photoURL || "",
          });
          setFirebaseAuthError(null);
        } else {
          setUser(null);
          setAuthError("UNAUTHORIZED_USER");
          auth.signOut();
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setAuthError(null);
    localStorage.removeItem("nord_user");
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const handleConnectCalendar = async () => {
    try {
      await connectCalendarAccount();
    } catch (e) {
      console.error("Failed to connect calendar", e);
      alert(getCalendarAuthErrorMessage(e));
    }
  };

  // Layout Management Functions
  const resizeWidget = (
    colIndex: number,
    itemIndex: number,
    change: number,
  ) => {
    setLayout((prev) => {
      const column = prev[colIndex];
      const item = column[itemIndex];
      const newHeight = item.heightLevel + change;
      if (newHeight < 0) return prev;

      const nextColumn = column.map((colItem, idx) =>
        idx === itemIndex ? { ...colItem, heightLevel: newHeight } : colItem,
      );

      return { ...prev, [colIndex]: nextColumn };
    });
  };

  const handleRefreshAccounts = async () => {
    try {
      await refreshCalendarAccounts();
    } catch (e) {
      console.error("Failed to refresh accounts", e);
    }
  };

  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case WidgetType.CALENDAR:
        return (
          <CalendarWidget
            mode="MONTH"
            accounts={calendarAccounts}
            onConnect={handleConnectCalendar}
            onRefresh={handleRefreshAccounts}
            onRemoveAccount={removeCalendarAccount}
            accountError={calendarAccountError}
            failedAccounts={failedCalendarAccounts}
            accountErrors={calendarAccountErrors}
            onReauthAccount={reauthCalendarAccount}
            onToggleCalendarVisibility={setCalendarVisibility}
          />
        );
      case WidgetType.AGENDA:
        return (
          <CalendarWidget
            mode="AGENDA"
            accounts={calendarAccounts}
            onConnect={handleConnectCalendar}
            onRefresh={handleRefreshAccounts}
            onRemoveAccount={removeCalendarAccount}
            accountError={calendarAccountError}
            failedAccounts={failedCalendarAccounts}
            accountErrors={calendarAccountErrors}
            onReauthAccount={reauthCalendarAccount}
            onToggleCalendarVisibility={setCalendarVisibility}
          />
        );

      case WidgetType.TODO:
        return <TodoWidget userEmail={user?.email || null} />;
      case WidgetType.CRYPTO:
        return <CryptoWidget />;
      case WidgetType.BIBLE:
        return <BibleWidget />;
      case WidgetType.NOTEPAD:
        return <NotepadWidget userEmail={user?.email || null} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-divider text-ink font-mono selection:bg-accent selection:text-surface flex flex-col">
      {/* FIREBASE AUTH ERROR BANNER */}
      {firebaseAuthError && (
        <div className="bg-red/10 border-b border-red/30 p-2 text-center text-red text-xs font-mono flex items-center justify-center gap-2">
          <ShieldAlert size={14} />
          <span>DATABASE CONNECTION FAILED: {firebaseAuthError}</span>
        </div>
      )}

      {/* MAIN CONTENT — one surface split into panes by 1px dividers */}
      <main className="flex-1 flex flex-col pt-11 relative">
        {/* LOGIN OVERLAY */}
        {!user && (
          <div className="fixed inset-0 z-50 bg-divider/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-faint">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-divider text-blue text-xs tracking-[0.16em] uppercase">
                <Lock size={13} />
                system_access
                <span className="flex-1 border-t border-faint/50" aria-hidden />
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col items-center text-center">
                <h2 className="text-section mb-2">Welcome Back</h2>
                <p className="text-ink mb-8 text-sm leading-relaxed opacity-80 max-w-xs">
                  Please sign in to access your personal dashboard and
                  synchronize your data.
                </p>

                {authError && (
                  <div className="mb-6 p-3 w-full border border-red/60 bg-red/10 text-red text-xs uppercase font-mono">
                    ! {authError} !
                  </div>
                )}

                {/* Custom Google Button */}
                <button
                  onClick={handleLogin}
                  disabled={!isGoogleLoaded || isLoginPending}
                  className="w-full py-3 px-4 bg-raised border border-faint hover:border-accent hover:text-accent text-ink transition-colors flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isGoogleLoaded ? (
                    <span className="animate-pulse">INITIALIZING...</span>
                  ) : isLoginPending ? (
                    <span className="animate-pulse">OPENING GOOGLE...</span>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                      </svg>
                      <span>SIGN IN WITH GOOGLE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Developer Helper: Origin Display */}
            <div className="mt-8 w-full max-w-md border border-faint bg-bar p-4 font-mono text-xs opacity-50 hover:opacity-100 transition-opacity">
              <div className="text-heading-quiet mb-2 uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} /> Dev_Mode: OAuth Config
              </div>
              <p className="text-ink mb-2">
                Add this URL to Google Cloud OAuth JavaScript origins and
                redirect URIs:
              </p>
              <div className="bg-surface p-2 border border-divider flex items-center justify-between gap-2">
                <code className="text-yellow truncate">{originUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(originUrl)}
                  className="text-ink hover:text-accent p-1"
                  title="Copy to Clipboard"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANE GRID — capped width, columns hug their content so the
            ground shows through instead of stretching panes to the fold */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 items-start gap-px w-full max-w-[1500px] mx-auto px-4 pt-4 pb-4 md:px-8 md:pt-6 md:pb-6 transition-opacity duration-500 ${
            !user ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {[0, 1, 2].map((colIndex) => (
            <div key={colIndex} className="flex flex-col gap-px">
              {layout[colIndex].map((item, index) => (
                <WidgetContainer
                  key={item.id}
                  item={item}
                  onResize={(change) => resizeWidget(colIndex, index, change)}
                >
                  {renderWidgetContent(item.type)}
                </WidgetContainer>
              ))}
            </div>
          ))}
        </div>
      </main>

      <StatusLine
        userName={user?.name || null}
        weather={weather}
        currentTime={currentTime}
        theme={theme}
        themes={themes}
        onSelectTheme={setTheme}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="System Logout"
        message="Are you sure you want to logout? You will need to re-authenticate to access your dashboard."
        onConfirm={() => {
          handleLogout();
          setIsLogoutModalOpen(false);
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
        confirmText="Logout"
        isDestructive={true}
      />
    </div>
  );
};

export default App;
