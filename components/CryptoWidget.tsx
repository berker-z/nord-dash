import React, { useState, useEffect } from 'react';
import { CryptoData } from '../types';

const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'];

export const CryptoWidget: React.FC = () => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = COINS.map(async (coin) => {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin}USDT`);
        const json = await res.json();
        return {
          symbol: coin,
          price: parseFloat(json.lastPrice).toFixed(2),
          percentChange: parseFloat(json.priceChangePercent).toFixed(2)
        };
      });
      const results = await Promise.all(promises);
      setData(results);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Binance API Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col font-mono text-lg">
      <div className="flex justify-between items-end mb-6 text-sm text-nord-3 border-b-2 border-nord-1 pb-2">
        <span>LAST_SYNC: {lastUpdated.toLocaleTimeString()}</span>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-1 hover:text-nord-8 transition-colors disabled:opacity-50 uppercase font-medium"
        >
          [{loading ? "SYNCING..." : "REFRESH"}]
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-2">
        {data.map((coin) => {
          const isPositive = parseFloat(coin.percentChange) >= 0;
          return (
            <div key={coin.symbol} className="flex items-center justify-between border-b border-nord-1 pb-2 mb-2 hover:bg-nord-1/50 px-2 transition-colors">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium text-xl leading-none text-nord-4 tracking-wider">{coin.symbol}</div>
                  <div className="text-xs text-nord-3 mt-1 font-medium">/USDT</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-xl text-nord-6">${coin.price}</div>
                <div className={`text-base font-medium flex items-center justify-end gap-2 ${isPositive ? 'text-nord-14' : 'text-nord-11'}`}>
                  <span>{isPositive ? '+' : ''}{coin.percentChange}%</span>
                  <span>{isPositive ? '[^]' : '[v]'}</span>
                </div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && !loading && (
            <div className="text-nord-11 text-lg text-center mt-10 font-medium">! CONNECTION_ERROR !</div>
        )}
      </div>
    </div>
  );
};