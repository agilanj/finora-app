import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { DebitCardCarousel } from "./DebitCardCarousel";
import { Account } from "../../types/finance";
import {
  Wallet,
  Landmark,
  ArrowRightLeft,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  HandCoins,
  PiggyBank,
  FileSpreadsheet,
  Info,
} from "lucide-react";

interface DashboardViewProps {
  onOpenQuickAdd: (initialType?: "expense" | "income" | "transfer") => void;
  onOpenSmartAI: () => void;
  onOpenTransfer: (sourceAccountId?: string) => void;
  onOpenAddAccount: () => void;
  onEditAccount: (account: Account) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickAdd,
  onOpenSmartAI,
  onOpenTransfer,
  onOpenAddAccount,
  onEditAccount,
}) => {
  const {
    userProfile,
    totalTrackedBalance,
    cashInHand,
    monthlyIncome,
    monthlyExpenses,
    accounts,
    transactions,
    formatCurrency,
    setActiveTab,
  } = useFinance();

  const [hideBalances, setHideBalances] = useState(() =>
    Boolean(userProfile.hideBalancesOnLaunch)
  );

  React.useEffect(() => {
    if (userProfile.hideBalancesOnLaunch !== undefined) {
      setHideBalances(Boolean(userProfile.hideBalancesOnLaunch));
    }
  }, [userProfile.hideBalancesOnLaunch]);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const recentTransactions = transactions.slice(0, 6);
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const firstName = userProfile.name ? userProfile.name.split(" ")[0] : "User";

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 md:pb-10 max-w-6xl mx-auto animate-fade-up">
      {/* 1. MOBILE-FIRST FUTURISTIC GREETING + ROYAL BALANCE HERO */}
      <section className="p-5 sm:p-7 rounded-3xl glass-card relative overflow-hidden">
        {/* Mixed Royal Gradient Mesh Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-violet-600/20 via-indigo-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-blue-600/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Greeting Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-[var(--text-secondary)] font-medium">
                Welcome back,
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight truncate">
                Hi, {firstName}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setHideBalances(!hideBalances)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
              aria-label={hideBalances ? "Show balances" : "Hide balances"}
            >
              {hideBalances ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Show</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Hide</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Liquidity Readout: Balance in Hand + Total Across All Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)]/80 border border-[var(--border-color)]">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Balance in Hand (Cash)</span>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">
                {hideBalances ? "••••••" : formatCurrency(cashInHand)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Physical liquid wallet cash
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-transparent border border-indigo-400/25">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium mb-1">
                <Landmark className="w-4 h-4 text-indigo-400" />
                <span>Total Across All Accounts</span>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">
                {hideBalances ? "••••••" : formatCurrency(totalTrackedBalance)}
              </div>
              <div className="flex items-center gap-3 text-[11px] mt-1 tabular-nums">
                <span className="text-emerald-400 font-semibold">
                  +{hideBalances ? "•••" : formatCurrency(monthlyIncome)} in
                </span>
                <span className="text-[var(--text-secondary)]">·</span>
                <span className="text-rose-400 font-semibold">
                  -{hideBalances ? "•••" : formatCurrency(monthlyExpenses)} out
                </span>
                <span className="text-[var(--text-secondary)] hidden sm:inline">
                  ({activeAccounts.length} accounts)
                </span>
              </div>
            </div>
          </div>

          {/* UPI-Style Ergonomic Quick Actions (Green = Income, Red = Expense, Royal = Transfer/AI) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenQuickAdd("income")}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
                Income
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickAdd("expense")}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-rose-500/12 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-rose-400">
                Expense
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTransfer()}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-indigo-500/12 hover:bg-indigo-500/20 border border-indigo-400/30 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-indigo-400">
                Transfer
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSmartAI}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-400/30 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-violet-400">
                Smart AI
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. FUTURISTIC WALLET CAROUSEL (FANNED ARC + CIRCULAR ROTARY DIAL + TRANSIT CARD) */}
      <section className="p-5 sm:p-6 md:p-7 rounded-3xl glass-card">
        <DebitCardCarousel
          onAddAccount={onOpenAddAccount}
          onOpenTransfer={onOpenTransfer}
          onEditAccount={onEditAccount}
        />
      </section>

      {/* 3. UPI-STYLE FEATURE SHORTCUTS (Mobile-friendly quick access to core tools) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("loans")}
          className="p-3.5 rounded-2xl glass-card text-left hover:border-indigo-400/40 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <HandCoins className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">Borrow & Lend</div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">Dues & Friends</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("budgets")}
          className="p-3.5 rounded-2xl glass-card text-left hover:border-indigo-400/40 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">Budgets & Goals</div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">Monthly Limits</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className="p-3.5 rounded-2xl glass-card text-left hover:border-indigo-400/40 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">Statements</div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">PDF & Excel</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className="p-3.5 rounded-2xl glass-card text-left hover:border-indigo-400/40 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">About & Credits</div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">Usage & Creator</div>
          </div>
        </button>
      </section>

      {/* 4. RECENT ACCOUNT ACTIVITY (Green Income / Red Expense) */}
      <section className="p-5 sm:p-6 rounded-3xl glass-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
              Recent Activity
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Latest entries across cash, bank & transit card
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>See all ({transactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[var(--border-color)]">
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              No transactions recorded yet. Tap Income or Expense above to get started.
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)]/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "income"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : tx.type === "transfer"
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === "transfer" ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                      {tx.description}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{accountMap.get(tx.accountId) || "Account"}</span>
                      <span>·</span>
                      <span>{tx.category}</span>
                      <span>·</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs sm:text-sm font-bold tabular-nums ${
                      tx.type === "income"
                        ? "text-emerald-400"
                        : tx.type === "transfer"
                        ? "text-indigo-400"
                        : "text-rose-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {hideBalances ? "••••" : formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] capitalize">
                    {tx.paymentMethod}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
