import React from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  LayoutDashboard,
  Landmark,
  ReceiptText,
  Plus,
  Settings,
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAdd }) => {
  const { activeTab, setActiveTab } = useFinance();

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md rounded-3xl glass-panel border border-indigo-400/25 px-3 py-2 flex items-center justify-around shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === "accounts"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Landmark className="w-4 h-4 mb-0.5" />
          <span>Accounts</span>
        </button>

        {/* Center Prominent Royal Quick Add FAB */}
        <button
          onClick={onOpenQuickAdd}
          className="w-12 h-12 -my-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-90 transition-transform cursor-pointer border border-white/25"
          title="Quick Entry"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ReceiptText className="w-4 h-4 mb-0.5" />
          <span>Activity</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === "settings" || activeTab === "about"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
};
