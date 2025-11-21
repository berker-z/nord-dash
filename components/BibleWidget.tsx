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
    <div className="h-full flex flex-col font-mono">
      {!quote ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 p-4">
          <div className="text-nord-3 text-6xl select-none">†</div>
          <p className="text-nord-4 text-lg font-normal">
            How are you feeling today?
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-fade-in overflow-y-auto">
          <div className="bg-nord-1 p-6 rounded-lg border-l-4 border-nord-13 mb-4 relative shadow-lg">
            <h3 className="text-nord-8 font-medium text-base mb-3 uppercase tracking-wider border-b border-nord-2 pb-1 inline-block">
              {quote.reference}
            </h3>
            <p className="text-nord-5 leading-relaxed italic">"{quote.text}"</p>
          </div>
          <button
            onClick={() => setQuote(null)}
            className="text-sm text-nord-3 hover:text-nord-8 self-center mt-2 uppercase tracking-widest border border-nord-3 px-2 py-1 hover:border-nord-8 transition-colors rounded"
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
          className="w-full bg-nord-1 border-2 border-nord-3 rounded-lg pl-4 pr-12 py-3 text-base focus:outline-none focus:border-nord-8 focus:bg-nord-2 placeholder-nord-3 min-h-[60px] max-h-[150px] resize-none text-nord-4 transition-colors overflow-hidden"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || !feeling}
          className="absolute right-3 bottom-3 text-nord-4 hover:text-nord-8 disabled:opacity-30 bg-nord-1 pl-2 pt-2 rounded-tl-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-nord-4 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
};
