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
  handleIdentityLogin,
} from "./services/authService";
import { GOOGLE_CLIENT_ID, ALLOWED_EMAILS } from "./config";
import {
  Terminal,
  Cloud,
  CloudRain,
  Sun,
  Lock,
  ShieldAlert,
  User,
  Copy,
} from "lucide-react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./services/firebase";
import { ConfirmModal } from "./components/ConfirmModal";
import { useCalendarAccounts } from "./hooks/useCalendarAccounts";

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
        .join("")
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
    { id: "w3", type: WidgetType.TODO, title: "/system_tasks", heightLevel: 0 },
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
  const [originUrl, setOriginUrl] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [firebaseAuthError, setFirebaseAuthError] = useState<string | null>(
    null
  );
  
  const {
    accounts: calendarAccounts,
    loading: loadingAccounts,
    error: calendarAccountError,
    refreshAccounts: refreshCalendarAccounts,
    connectAccount: connectCalendarAccount,
    removeAccount: removeCalendarAccount,
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
      return () => clearInterval(interval);
    }
  }, []);

    // Handle Identity Login
    const handleLogin = async () => {
        setAuthError(null);
        try {
            await handleIdentityLogin();
            // User state will be updated by onAuthStateChanged/localStorage logic if we wanted, 
            // but for now we might need to manually set user if we aren't fully relying on onAuthStateChanged yet.
            // Actually, handleIdentityLogin signs into Firebase.
            // We should listen to onAuthStateChanged.
        } catch (e: any) {
            console.error("Login Failed", e);
            setAuthError(e.message || "LOGIN_FAILED");
        }
    };
    
    // Auth State Listener
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
                // Keep local user if we want manual logout, or clear it.
                // For now, let's trust Firebase status.
                // setUser(null); 
                // Wait, existing logic uses localStorage for user. 
                // Let's stick to existing pattern for now but update it when firebase updates.
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
      alert("Failed to connect calendar");
    }
  };

  // Layout Management Functions
  const resizeWidget = (
    colIndex: number,
    itemIndex: number,
    change: number
  ) => {
    setLayout((prev) => {
      const column = prev[colIndex];
      const item = column[itemIndex];
      const newHeight = item.heightLevel + change;
      if (newHeight < 0) return prev;

      const nextColumn = column.map((colItem, idx) =>
        idx === itemIndex ? { ...colItem, heightLevel: newHeight } : colItem
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

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="text-nord-13" size={20} />;
    if (code <= 48) return <Cloud className="text-nord-9" size={20} />;
    return <CloudRain className="text-nord-10" size={20} />;
  };

  const Separator = () => (
    <span className="hidden md:inline text-nord-3/70 mx-1 select-none leading-none">
      ::
    </span>
  );

  return (
    <div className="min-h-screen bg-nord-0 text-nord-4 font-mono selection:bg-nord-9 selection:text-nord-0 flex flex-col">
      {/* TOP BAR */}
      <header className="p-4 border-b-2 border-nord-16 bg-nord-0/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-heading-quiet tracking-tighter text-lg">
              <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              <span>THE WIRED // v1</span>
            </div>
          </div>

          {/* Mobile: Just Weather + Login. Desktop: All info */}
          <div className="flex items-center text-lg w-full md:w-auto justify-between md:justify-end">
            {/* Desktop Info Group */}
            <div className="hidden md:flex items-center">
              <div className="text-nav">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </div>

              <Separator />

              <div className="text-nav">
                {currentTime.toLocaleDateString()}
              </div>

              <Separator />

              <div className="text-nav uppercase">ISTANBUL</div>

              <Separator />
            </div>

            {/* Weather (Always Visible) */}
            <div className="flex items-center gap-2">
              {weather ? (
                <div className="flex items-center gap-2 text-nord-6">
                  {getWeatherIcon(weather.weatherCode)}
                  <span>{weather.temperature}°C</span>
                </div>
              ) : (
                <span className="text-nord-3 animate-pulse">--.-°C</span>
              )}
            </div>

            {/* Separator only on desktop between weather and login */}
            <Separator />

            {/* Login Status (Always Visible) */}
            <button
              onClick={() => {
                if (user) {
                  setIsLogoutModalOpen(true);
                }
              }}
              disabled={!user}
              className={`
              flex items-center gap-2 px-3 py-1 rounded border transition-all ml-2
              ${
                user
                  ? "border-nord-14 text-nord-14 bg-nord-14/10 hover:bg-nord-14/20 cursor-pointer"
                  : "border-nord-11 text-nord-11 bg-nord-11/10 cursor-not-allowed"
              }
            `}
            >
              {user ? (
                <span className="uppercase text-sm">LOGOUT</span>
              ) : (
                <span className="uppercase text-sm flex items-center gap-2">
                  <Lock size={14} /> LOCKED
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* FIREBASE AUTH ERROR BANNER */}
      {firebaseAuthError && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-red-400 text-xs font-mono flex items-center justify-center gap-2">
          <ShieldAlert size={14} />
          <span>DATABASE CONNECTION FAILED: {firebaseAuthError}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 relative">
        {/* ACCESS DENIED OVERLAY */}
        {/* LOGIN OVERLAY */}
        {!user && (
          <div className="fixed inset-0 z-50 bg-nord-0/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-nord-0 border-2 border-nord-3 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-nord-1 px-6 py-4 border-b-2 border-nord-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-nav text-lg tracking-widest font-mono">
                <Lock size={20} className="text-nord-9" />
                SYSTEM ACCESS
              </div>
            </div>

              {/* Body */}
              <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-nord-1 rounded-full border-2 border-nord-3 text-nord-9">
                  <User size={48} />
                </div>

                <h2 className="text-section mb-2">
                  Welcome Back
                </h2>
                <p className="text-nord-4 mb-8 text-sm leading-relaxed opacity-80 max-w-xs">
                  Please sign in to access your personal dashboard and
                  synchronize your data.
                </p>

                {authError && (
                  <div className="mb-6 p-3 w-full border border-nord-11 bg-nord-11/10 text-nord-11 text-xs uppercase font-mono rounded">
                    ! {authError} !
                  </div>
                )}

                {/* Custom Google Button */}
                <button
                  onClick={handleLogin}
                  disabled={!isGoogleLoaded}
                  className="w-full py-3 px-4 bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-6 rounded-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isGoogleLoaded ? (
                    <span className="animate-pulse">INITIALIZING...</span>
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
            <div className="mt-8 w-full max-w-md border border-nord-3 bg-nord-1 p-4 rounded font-mono text-xs opacity-50 hover:opacity-100 transition-opacity">
              <div className="text-heading-quiet mb-2 uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} /> Dev_Mode: OAuth Config
              </div>
              <p className="text-nord-4 mb-2">
                Add this URL to "Authorized JavaScript origins" in Google Cloud:
              </p>
              <div className="bg-nord-0 p-2 border border-nord-2 rounded flex items-center justify-between gap-2">
                <code className="text-nord-13 truncate">{originUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(originUrl)}
                  className="text-nord-4 hover:text-nord-8 p-1"
                  title="Copy to Clipboard"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WIDGET GRID - Only visible/interactable if user is logged in (conceptually, though overlay covers it) */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto transition-opacity duration-500 ${
            !user ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {[0, 1, 2].map((colIndex) => (
            <div
              key={colIndex}
              className="flex flex-col gap-0 min-h-[200px] rounded transition-colors"
            >
              {layout[colIndex].map((item, index) => (
                <div key={item.id}>
                  <WidgetContainer
                    item={item}
                    onResize={(change) => resizeWidget(colIndex, index, change)}
                  >
                    {renderWidgetContent(item.type)}
                  </WidgetContainer>
                </div>
              ))}
              {layout[colIndex].length === 0 && (
                <div className="h-32 border-2 border-dashed border-nord-3 rounded flex items-center justify-center text-muted text-sm uppercase select-none">
                  [ EMPTY COLUMN ]
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

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
