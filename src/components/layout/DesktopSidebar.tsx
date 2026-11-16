import React from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  LayoutDashboard,
  Landmark,
  ReceiptText,
  HandCoins,
  PiggyBank,
  Sparkles,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  Info,
} from "lucide-react";

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { activeTab, setActiveTab, userProfile, logoutUser } = useFinance();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "All Accounts", icon: Landmark },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "loans", label: "Borrow & Lend", icon: HandCoins },
    { id: "budgets", label: "Budgets & Goals", icon: PiggyBank },
    ...(userProfile.isHostelResident
      ? [{ id: "hostel", label: "Hostel Living", icon: Building }]
      : []),
    { id: "ai", label: "AI Assistant", icon: Sparkles, highlight: true },
    { id: "reports", label: "Export Reports", icon: FileSpreadsheet },
    { id: "about", label: "About & Credits", icon: Info },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]/75 backdrop-blur-2xl transition-all duration-300 relative select-none shrink-0 ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-5 z-20 w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-400/50 flex items-center justify-center shadow-md cursor-pointer transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/15 text-indigo-400 border border-indigo-400/35 shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-indigo-400"
                    : item.highlight
                    ? "text-violet-400"
                    : "text-[var(--text-secondary)]"
                }`}
              />

              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile Capsule & Logout */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2 min-w-0">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-400/40 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {userProfile.name}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] capitalize truncate">
                  {userProfile.occupation ? userProfile.occupation.replace("_", " ") : "User"}
                </div>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logoutUser}
            className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
