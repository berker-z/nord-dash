import React, { useState, useEffect } from 'react';
import { LayoutItem, WidgetType, WeatherData } from './types';
import { WidgetContainer } from './components/WidgetContainer';
import { CalendarWidget } from './components/CalendarWidget';
import { TodoWidget } from './components/TodoWidget';
import { CryptoWidget } from './components/CryptoWidget';
import { BibleWidget } from './components/BibleWidget';
import { fetchWeather } from './services/weatherService';
import { GOOGLE_CLIENT_ID, ALLOWED_EMAILS } from './config';
import { Terminal, Cloud, CloudRain, Sun, Lock, ShieldAlert, User, Copy } from 'lucide-react';

// Declare Google Global for TS
declare global {
  interface Window {
    google: any;
  }
}

// JWT Decoder Helper
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
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
    { id: 'w1', type: WidgetType.CALENDAR, title: '/calendar', heightLevel: 2 },
    { id: 'w2', type: WidgetType.AGENDA, title: '/daily_agenda', heightLevel: 2 },
  ],
  1: [
    { id: 'w3', type: WidgetType.TODO, title: '/system_tasks', heightLevel: 3 },
  ],
  2: [
    { id: 'w4', type: WidgetType.CRYPTO, title: '/markets', heightLevel: 1 },
    { id: 'w5', type: WidgetType.BIBLE, title: '/bible_qotd', heightLevel: 1 },
  ]
};

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [layout, setLayout] = useState(initialLayout);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [originUrl, setOriginUrl] = useState('');
  
  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ col: number, idx: number } | null>(null);

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

  // Google Auth Initialization
  useEffect(() => {
    if (isGoogleLoaded && !user) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            const payload = parseJwt(response.credential);
            if (payload) {
              console.log("Auth Attempt:", payload.email);
              
              if (ALLOWED_EMAILS.includes(payload.email)) {
                setUser({
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture
                });
                setAuthError(null);
              } else {
                setAuthError(`UNAUTHORIZED_USER: ${payload.email}`);
              }
            }
          }
        });

        const btnContainer = document.getElementById("googleBtn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: "filled_black", size: "large", shape: "rectangular", width: "240" }
          );
        }
      } catch (e) {
        console.error("Google Auth Init Failed", e);
      }
    }
  }, [isGoogleLoaded, user, authError]);

  const handleLogout = () => {
    setUser(null);
    setAuthError(null);
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
      // Re-render button after logout
      setTimeout(() => {
         const btnContainer = document.getElementById("googleBtn");
         if (btnContainer) {
           window.google.accounts.id.renderButton(
             btnContainer,
             { theme: "filled_black", size: "large", shape: "rectangular", width: "240" }
           );
         }
      }, 100);
    }
  };

  // Layout Management Functions
  const resizeWidget = (colIndex: number, itemIndex: number, change: number) => {
    const newLayout = { ...layout };
    const item = newLayout[colIndex][itemIndex];
    const newHeight = item.heightLevel + change;
    if (newHeight >= 1 && newHeight <= 3) {
      item.heightLevel = newHeight;
      setLayout(newLayout);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, colIndex: number, itemIndex: number) => {
    setDraggedItem({ col: colIndex, idx: itemIndex });
    e.dataTransfer.effectAllowed = 'move'; 
  };

  const handleDrop = (e: React.DragEvent, targetColIndex: number, targetItemIndex?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { col: sourceColIndex, idx: sourceItemIndex } = draggedItem;

    if (sourceColIndex === targetColIndex && sourceItemIndex === targetItemIndex) {
      setDraggedItem(null);
      return;
    }

    const newLayout = { ...layout };
    const [movedItem] = newLayout[sourceColIndex].splice(sourceItemIndex, 1);

    if (targetItemIndex !== undefined) {
      newLayout[targetColIndex].splice(targetItemIndex, 0, movedItem);
    } else {
      newLayout[targetColIndex].push(movedItem);
    }

    setLayout(newLayout);
    setDraggedItem(null);
  };

  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case WidgetType.CALENDAR: return <CalendarWidget mode="MONTH" />;
      case WidgetType.AGENDA: return <CalendarWidget mode="AGENDA" />;
      case WidgetType.TODO: return <TodoWidget />;
      case WidgetType.CRYPTO: return <CryptoWidget />;
      case WidgetType.BIBLE: return <BibleWidget />;
      default: return null;
    }
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="text-nord-13" size={20} />;
    if (code <= 48) return <Cloud className="text-nord-9" size={20} />;
    return <CloudRain className="text-nord-10" size={20} />;
  };

  const Separator = () => <span className="hidden md:inline text-nord-3 font-normal mx-2">::</span>;

  return (
    <div className="min-h-screen bg-nord-0 text-nord-4 font-mono selection:bg-nord-9 selection:text-nord-0 flex flex-col">
      
      {/* TOP BAR */}
      <header className="h-16 border-b-2 border-nord-3 bg-nord-1 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm overflow-hidden">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-nord-8 font-medium tracking-tighter text-xl">
            <Terminal size={24} />
            <span>SYS.DASH.v1</span>
          </div>
        </div>

        {/* Mobile: Just Weather + Login. Desktop: All info */}
        <div className="flex items-center text-lg w-full md:w-auto justify-between md:justify-end">
          
          {/* Desktop Info Group */}
          <div className="hidden md:flex items-center">
             <div className="text-nord-4 font-normal">
               {currentTime.toLocaleTimeString('en-US', { hour12: false })}
             </div>

             <Separator />

             <div className="text-nord-4 font-normal">
               {currentTime.toLocaleDateString()}
             </div>

             <Separator />

             <div className="text-nord-4 font-normal uppercase">
               ISTANBUL
             </div>

             <Separator />
          </div>

          {/* Weather (Always Visible) */}
          <div className="flex items-center gap-2">
             {weather ? (
               <div className="flex items-center gap-2 font-medium text-nord-6">
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
            onClick={user ? handleLogout : undefined}
            disabled={!user}
            className={`
              flex items-center gap-2 px-3 py-1 rounded border transition-all ml-2
              ${user
                ? 'border-nord-14 text-nord-14 bg-nord-14/10 hover:bg-nord-14/20 cursor-pointer' 
                : 'border-nord-11 text-nord-11 bg-nord-11/10 cursor-not-allowed'}
            `}
          >
             {user ? (
               <>
                 <img src={user.picture} alt="User" className="w-5 h-5 rounded-full grayscale" />
                 <span className="uppercase font-medium text-sm hidden md:inline">{user.name}</span>
                 <span className="uppercase font-medium text-sm md:hidden">LOGOUT</span>
               </>
             ) : (
               <span className="uppercase font-medium text-sm flex items-center gap-2">
                 <Lock size={14} /> LOCKED
               </span>
             )}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 relative">
        
        {/* ACCESS DENIED OVERLAY */}
        {!user && (
          <div className="fixed inset-0 z-50 bg-nord-0 flex flex-col items-center justify-center p-4 overflow-y-auto">
             <div className="w-full max-w-md border-2 border-nord-11 bg-nord-1 p-1 shadow-[8px_8px_0px_0px_rgba(191,97,106,0.3)] relative">
                
                <div className="bg-nord-11 text-nord-1 p-2 font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2 mb-6">
                  <ShieldAlert size={24} />
                  Security Breach
                </div>

                <div className="px-6 pb-4 text-center">
                  <div className="text-nord-4 text-6xl mb-4 flex justify-center opacity-20">
                    <Lock size={80} />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-nord-6 mb-2 font-mono">AUTHENTICATION REQUIRED</h2>
                  <p className="text-nord-3 mb-8 font-mono text-sm">
                    Identify yourself to access the mainframe. <br/>
                    Unauthorized access attempts will be logged.
                  </p>

                  {authError && (
                    <div className="mb-6 p-3 border border-nord-11 bg-nord-0 text-nord-11 text-sm font-bold uppercase font-mono">
                      ! {authError} !
                    </div>
                  )}

                  {/* Google Button Container */}
                  <div className="flex justify-center w-full min-h-[50px]">
                    {(GOOGLE_CLIENT_ID as string) === "YOUR_GOOGLE_CLIENT_ID_HERE" ? (
                      <div className="text-nord-13 text-xs p-2 border border-nord-13 bg-nord-13/10 rounded font-mono">
                         WARNING: GOOGLE_CLIENT_ID not configured in config.ts
                      </div>
                    ) : (
                      <>
                         <div id="googleBtn" className="flex justify-center"></div>
                         {/* Loading State if Script hasn't loaded yet */}
                         {!isGoogleLoaded && (
                           <div className="text-nord-3 text-sm animate-pulse">INITIALIZING SECURITY PROTOCOLS...</div>
                         )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-nord-11/30 p-2 bg-nord-0/50 flex justify-between text-[10px] text-nord-3 uppercase font-mono">
                  <span>Sys.Dash.v1</span>
                  <span>Status: Locked</span>
                </div>
             </div>

             {/* Developer Helper: Origin Display */}
             <div className="mt-8 w-full max-w-md border border-nord-3 bg-nord-0 p-4 rounded font-mono text-xs">
                <div className="text-nord-8 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} /> Dev_Mode: OAuth Config
                </div>
                <p className="text-nord-4 mb-2">
                  Add this URL to "Authorized JavaScript origins" in Google Cloud Console:
                </p>
                <div className="bg-nord-1 p-2 border border-nord-2 rounded flex items-center justify-between gap-2">
                  <code className="text-nord-13 truncate">{originUrl}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(originUrl)}
                    className="text-nord-4 hover:text-nord-8 p-1"
                    title="Copy to Clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-nord-3 mt-2 italic">
                  * If this URL changes (common in sandboxes), you must update the console.
                </p>
             </div>
          </div>
        )}

        {/* WIDGET GRID - Only visible/interactable if user is logged in (conceptually, though overlay covers it) */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto transition-opacity duration-500 ${!user ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {[0, 1, 2].map((colIndex) => (
            <div 
              key={colIndex} 
              className={`flex flex-col gap-0 min-h-[200px] rounded transition-colors ${draggedItem ? 'bg-nord-1/20 border-2 border-dashed border-nord-2' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, colIndex)}
            >
              {layout[colIndex].map((item, index) => (
                <div
                  key={item.id}
                  onDrop={(e) => {
                     e.stopPropagation(); 
                     handleDrop(e, colIndex, index);
                  }}
                >
                  <WidgetContainer 
                    item={item} 
                    onResize={(change) => resizeWidget(colIndex, index, change)}
                    onDragStart={(e) => handleDragStart(e, colIndex, index)}
                    onDrop={(e) => handleDrop(e, colIndex, index)}
                    isDragging={draggedItem?.col === colIndex && draggedItem?.idx === index}
                  >
                    {renderWidgetContent(item.type)}
                  </WidgetContainer>
                </div>
              ))}
              {layout[colIndex].length === 0 && (
                <div className="h-32 border-2 border-dashed border-nord-3 rounded flex items-center justify-center text-nord-3 text-sm uppercase select-none font-medium">
                  [ DROP WIDGET HERE ]
                </div>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default App;