import React, { useState, useEffect, useCallback } from "react";
import { CryptoData } from "../types";

const BINANCE_COINS = ["BTC", "ETH", "SOL"];
// Using process.env to match the original setup that worked for you.
// @ts-ignore
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// Helper to format large numbers
const formatNumber = (num: number, currency: string = "") => {
  let value = "";
  if (num >= 1e12) value = (num / 1e12).toFixed(2) + "T";
  else if (num >= 1e9) value = (num / 1e9).toFixed(2) + "B";
  else if (num >= 1e6) value = (num / 1e6).toFixed(2) + "M";
  else if (num >= 1e3) value = (num / 1e3).toFixed(2) + "K";
  else value = num.toFixed(2);

  return `${value} ${currency}`.trim();
};

export const CryptoWidget: React.FC = () => {
  const [binanceData, setBinanceData] = useState<CryptoData[]>([]);
  const [cgData, setCgData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchBinanceData = useCallback(async () => {
    try {
      const promises = BINANCE_COINS.map(async (coin) => {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${coin}USDT`
        );
        const json = await res.json();
        return {
          symbol: coin,
          price: parseFloat(json.lastPrice).toFixed(2),
          percentChange: parseFloat(json.priceChangePercent).toFixed(2),
        };
      });
      const results = await Promise.all(promises);
      setBinanceData(results);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Binance API Error", error);
    }
  }, []);

  const fetchCoinGeckoData = useCallback(async () => {
    if (!COINGECKO_API_KEY) return;

    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY,
      },
    };

    try {
      // 1. Fetch Coins (Market Dominance & Milady Cult Coin)
      // We use the 'ids' parameter to fetch specific coins
      const coinsRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=market-dominance,milady-cult-coin",
        options
      );
      const coinsJson = await coinsRes.json();

      const coinItems = Array.isArray(coinsJson)
        ? coinsJson.map((coin: any) => ({
            symbol: coin.symbol.toUpperCase(), // Extract ticker as requested (e.g. DOM, CULT)
            price: formatNumber(coin.market_cap, "USD"),
            percentChange: coin.price_change_percentage_24h.toFixed(2),
          }))
        : [];

      // 2. Milady Maker NFT
      const nftRes = await fetch(
        "https://api.coingecko.com/api/v3/nfts/milady-maker",
        options
      );
      const nftJson = await nftRes.json();
      const nftData = nftJson.floor_price
        ? {
            symbol: "MILADY NFT",
            price: `${nftJson.floor_price.native_currency} ETH`,
            percentChange:
              nftJson.floor_price_24h_percentage_change.native_currency.toFixed(
                2
              ),
          }
        : null;

      const newCgData = [...coinItems, nftData].filter(Boolean) as CryptoData[];
      setCgData(newCgData);
    } catch (error) {
      console.error("CoinGecko API Error", error);
    }
  }, []);

  const handleManualRefresh = () => {
    setLoading(true);
    Promise.all([fetchBinanceData(), fetchCoinGeckoData()]).finally(() =>
      setLoading(false)
    );
  };

  useEffect(() => {
    handleManualRefresh();

    const binanceInterval = setInterval(fetchBinanceData, 15000); // 15s
    const cgInterval = setInterval(fetchCoinGeckoData, 600000); // 10m

    return () => {
      clearInterval(binanceInterval);
      clearInterval(cgInterval);
    };
  }, [fetchBinanceData, fetchCoinGeckoData]);

  const allData = [...binanceData, ...cgData];

  return (
    <div className="flex flex-col font-mono">
      <div className="flex justify-between items-end mb-6 text-sm text-nord-3 border-b-2 border-nord-1 pb-2">
        <span className="text-muted-sm">LAST_SYNC: {lastUpdated.toLocaleTimeString()}</span>
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="flex items-center gap-1 hover:text-nord-8 transition-colors disabled:opacity-50 uppercase text-muted"
        >
          [{loading ? "SYNCING..." : "REFRESH"}]
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-2">
        {allData.map((item, idx) => {
          const isPositive = parseFloat(item.percentChange) >= 0;
          return (
            <div
              key={`${item.symbol}-${idx}`}
              className="flex items-center justify-between border-b border-nord-1 pb-2 mb-2 hover:bg-nord-1/50 px-2 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="leading-none text-card-title tracking-wider">
                    {item.symbol}
                  </div>
                  {/* Show /USDT only for Binance coins for consistency, or just hide it for others */}
                  {BINANCE_COINS.includes(item.symbol) && (
                    <div className="text-muted-sm mt-1">
                      /USDT
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-card-title text-nord-6">
                  {BINANCE_COINS.includes(item.symbol)
                    ? `$${item.price}`
                    : item.price}
                </div>
                <div
                  className={`flex items-center justify-end gap-2 ${
                    isPositive ? "text-nord-14" : "text-nord-11"
                  }`}
                >
                  <span>
                    {isPositive ? "+" : ""}
                    {item.percentChange}%
                  </span>
                  <span>{isPositive ? "[^]" : "[v]"}</span>
                </div>
              </div>
            </div>
          );
        })}
        {allData.length === 0 && !loading && (
          <div className="text-nord-11 text-lg text-center mt-10">
            ! CONNECTION_ERROR !
          </div>
        )}
      </div>
    </div>
  );
};
