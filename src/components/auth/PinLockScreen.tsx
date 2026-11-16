import React, { useState } from "react";
import { BRAND } from "../../config/brand";
import { Lock, Delete, ShieldCheck, LogOut } from "lucide-react";

interface PinLockScreenProps {
  expectedPin: string;
  userName: string;
  onUnlock: () => void;
  onSignOut: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  expectedPin,
  userName,
  onUnlock,
  onSignOut,
}) => {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  const handleDigit = (digit: string) => {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    setError("");

    if (next.length === 4) {
      if (next === expectedPin) {
        onUnlock();
      } else {
        setError("Incorrect 4-digit PIN. Please try again.");
        setTimeout(() => setEntered(""), 300);
      }
    }
  };

  const handleBackspace = () => {
    setError("");
    setEntered((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xs rounded-3xl glass-panel border border-indigo-400/25 p-6 shadow-2xl text-center space-y-5 animate-fade-up">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <div className="font-finora text-lg font-black tracking-[0.18em] bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-500 dark:from-indigo-300 dark:via-violet-200 dark:to-amber-300 bg-clip-text text-transparent">
            {BRAND.name}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Locked for <span className="font-bold text-[var(--text-primary)]">{userName}</span>
          </p>
        </div>

        {/* 4-dot PIN indicator */}
        <div className="flex items-center justify-center gap-3.5 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                idx < entered.length
                  ? "bg-indigo-500 border-indigo-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.7)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border-color)]"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl py-1.5 px-3">
            {error}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-12 rounded-2xl bg-[var(--bg-elevated)] hover:bg-indigo-500/20 border border-[var(--border-color)] hover:border-indigo-400/40 text-base font-bold text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer tabular-nums"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={onSignOut}
            className="h-12 rounded-2xl bg-[var(--bg-elevated)] hover:bg-rose-500/15 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-12 rounded-2xl bg-[var(--bg-elevated)] hover:bg-indigo-500/20 border border-[var(--border-color)] hover:border-indigo-400/40 text-base font-bold text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer tabular-nums"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-[var(--bg-elevated)] hover:bg-indigo-500/20 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-secondary)] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Enter 4-digit security PIN to unlock</span>
        </div>
      </div>
    </div>
  );
};
