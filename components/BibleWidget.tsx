import React, { useState } from "react";
import { BibleQuote } from "../types";
import { getBibleQuote } from "../services/openaiService";
import { Send } from "lucide-react";

export const BibleWidget: React.FC = () => {
  const [feeling, setFeeling] = useState("");
  const [quote, setQuote] = useState<BibleQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeling.trim()) return;

    setLoading(true);
    const result = await getBibleQuote(feeling);
    setQuote(result);
    setLoading(false);
    setFeeling("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeeling(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex flex-col font-mono">
      {!quote ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 p-4">
          <div className="text-muted text-5xl select-none">†</div>
          <p className="text-ink font-normal">
            How are you feeling today?
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-fade-in overflow-y-auto">
          <div className="pl-4 border-l-2 border-yellow mb-4 py-1">
            <h3 className="text-card-title text-yellow mb-2 uppercase tracking-wider">
              {quote.reference}
            </h3>
            <p className="text-ink leading-relaxed whitespace-pre-line">
              "{quote.text}"
            </p>
          </div>
          <button
            onClick={() => setQuote(null)}
            className="text-xs text-muted hover:text-accent self-center mt-2 uppercase tracking-widest transition-colors"
          >
            [ RESET_QUERY ]
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 relative group">
        <textarea
          value={feeling}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Query input..."
          className="w-full bg-raised border border-faint pl-3 pr-12 py-2.5 focus:outline-none focus:border-accent placeholder-muted min-h-[52px] max-h-[150px] resize-none text-ink transition-colors overflow-hidden"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || !feeling}
          className="absolute right-3 bottom-3 text-muted hover:text-accent disabled:opacity-30 bg-raised pl-2 pt-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={17} />
          )}
        </button>
      </form>
    </div>
  );
};
