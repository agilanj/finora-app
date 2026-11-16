import React, { useState, useRef, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { BRAND } from "../../config/brand";
import {
  Sun,
  Moon,
  Bell,
  Sparkles,
  Plus,
  ArrowRightLeft,
  Info,
  Lock,
} from "lucide-react";

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenSmartAI: () => void;
  onOpenTransfer: () => void;
  onLockApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAdd,
  onOpenSmartAI,
  onOpenTransfer,
  onLockApp,
}) => {
  const {
    userProfile,
    theme,
    toggleTheme,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    clearNotifications,
    setActiveTab,
    activeTab,
  } = useFinance();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 md:px-8 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/75 backdrop-blur-2xl transition-colors">
      {/* Brand Zone: Exclusive stylish FINORA wordmark ONLY (Tagline removed from Dashboard/Header) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <img
            src={BRAND.logoUrl}
            alt={BRAND.name}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl bg-white p-0.5 shadow-md transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-finora text-lg sm:text-xl font-black tracking-[0.16em] bg-gradient-to-r from-indigo-700 via-violet-600 to-amber-600 dark:from-indigo-300 dark:via-violet-200 dark:to-amber-300 bg-clip-text text-transparent leading-none">
            {BRAND.name}
          </span>
        </button>
      </div>

      {/* Center Clean Actions */}
      <div className="hidden md:flex items-center gap-1.5">
        <button
          onClick={onOpenSmartAI}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Smart AI</span>
        </button>

        <button
          onClick={onOpenTransfer}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
          <span>Transfer</span>
        </button>

        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "about"
              ? "bg-indigo-500/15 text-indigo-400 border-indigo-400/30"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-transparent hover:border-[var(--border-color)]"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>
      </div>

      {/* Right Controls: Quick Add, Instant Theme Toggle, Lock (if PIN), Notifications, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all whitespace-nowrap cursor-pointer shadow-md shadow-indigo-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Quick Entry</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Instant 1-Click Theme Flip */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Quick App Lock Button when PIN is active */}
        {userProfile.appPin && onLockApp && (
          <button
            onClick={onLockApp}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors cursor-pointer"
            title="Lock FINORA"
            aria-label="Lock app with PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifContainerRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors cursor-pointer relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-secondary)]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl glass-panel border border-[var(--border-color)] shadow-2xl p-3 z-50 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] mb-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Notifications ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                        n.read
                          ? "bg-transparent border-transparent opacity-60"
                          : "bg-[var(--bg-elevated)] border-[var(--border-color)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar -> Settings */}
        <button
          onClick={() => setActiveTab("settings")}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          title="Profile & Settings"
        >
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-xl object-cover border border-indigo-400/60 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-400">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
