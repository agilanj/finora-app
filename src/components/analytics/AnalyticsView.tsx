import React, { useMemo, useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const {
    transactions,
    accounts,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    yearlyIncome,
    yearlyExpenses,
    yearlySavings,
    totalTrackedBalance,
    formatCurrency,
  } = useFinance();

  const [timeframe, setTimeframe] = useState<"this_month" | "this_year" | "all_time">("this_month");

  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentYearPrefix = useMemo(() => new Date().toISOString().slice(0, 4), []);
  const currentMonthLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    []
  );

  // KPI metrics matching active timeframe
  const { displayIncome, displayExpenses, displaySavings } = useMemo(() => {
    if (timeframe === "this_month") {
      return {
        displayIncome: monthlyIncome,
        displayExpenses: monthlyExpenses,
        displaySavings: monthlySavings,
      };
    }
    if (timeframe === "this_year") {
      return {
        displayIncome: yearlyIncome,
        displayExpenses: yearlyExpenses,
        displaySavings: yearlySavings,
      };
    }
    let inc = 0;
    let exp = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return {
      displayIncome: inc,
      displayExpenses: exp,
      displaySavings: inc - exp,
    };
  }, [
    timeframe,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    yearlyIncome,
    yearlyExpenses,
    yearlySavings,
    transactions,
  ]);

  // Category-wise expense calculation
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;

    transactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      if (timeframe === "this_month" && !tx.date.startsWith(currentMonthPrefix)) return;
      if (timeframe === "this_year" && !tx.date.startsWith(currentYearPrefix)) return;

      map[tx.category] = (map[tx.category] || 0) + tx.amount;
      total += tx.amount;
    });

    const list = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));

    return list.sort((a, b) => b.amount - a.amount);
  }, [transactions, timeframe, currentMonthPrefix, currentYearPrefix]);

  // Account balance distribution
  const accountDistribution = useMemo(() => {
    const total = totalTrackedBalance > 0 ? totalTrackedBalance : 1;
    return accounts
      .filter((a) => !a.isArchived)
      .map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.balance,
        pct: totalTrackedBalance > 0 ? Math.max(0, Math.round((a.balance / total) * 100)) : 0,
      }));
  }, [accounts, totalTrackedBalance]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Financial Analytics & Insights
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Visualize income vs expense ratios, monthly & yearly summaries, and account distributions.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setTimeframe("this_month")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeframe === "this_month"
                ? "bg-[#D6B77A] text-[#101827] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {currentMonthLabel}
          </button>
          <button
            onClick={() => setTimeframe("this_year")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeframe === "this_year"
                ? "bg-[#D6B77A] text-[#101827] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {currentYearPrefix} Year
          </button>
          <button
            onClick={() => setTimeframe("all_time")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeframe === "all_time"
                ? "bg-[#D6B77A] text-[#101827] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Inflow / Income</span>
            <ArrowDownLeft className="w-4 h-4 text-[#4FC49A]" />
          </div>
          <div className="text-2xl font-black text-[#4FC49A] tabular-nums mt-1">
            {formatCurrency(displayIncome)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
            {timeframe === "this_month"
              ? `Year total: ${formatCurrency(yearlyIncome)}`
              : `This month: ${formatCurrency(monthlyIncome)}`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Outflow / Expenses</span>
            <ArrowUpRight className="w-4 h-4 text-[#EF7777]" />
          </div>
          <div className="text-2xl font-black text-[#EF7777] tabular-nums mt-1">
            {formatCurrency(displayExpenses)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
            {timeframe === "this_month"
              ? `Year total: ${formatCurrency(yearlyExpenses)}`
              : `This month: ${formatCurrency(monthlyExpenses)}`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Net Retained Savings</span>
            <TrendingUp className="w-4 h-4 text-[var(--accent-gold)]" />
          </div>
          <div className="text-2xl font-black text-[var(--accent-gold)] tabular-nums mt-1">
            {formatCurrency(displaySavings)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
            {displayIncome > 0
              ? `${Math.round((displaySavings / displayIncome) * 100)}% savings rate`
              : `Year net: ${formatCurrency(yearlySavings)}`}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Progress Grid */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Category Expense Breakdown
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">
              {categoryStats.length} active categories
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-secondary)]">
              No expense transactions recorded for this period yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryStats.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(cat.amount)}
                      </span>
                      <span className="text-[10px] text-[var(--accent-gold)] font-mono w-8 text-right">
                        {cat.pct}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B99758] to-[#D6B77A] rounded-full transition-all duration-300"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Balance Distribution */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Account Liquidity Distribution
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">
              Total {formatCurrency(totalTrackedBalance)}
            </span>
          </div>

          {accountDistribution.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-secondary)]">
              No accounts added yet. Add a bank or cash account to see liquidity breakdown.
            </div>
          ) : (
            <div className="space-y-3.5">
              {accountDistribution.map((acc) => (
                <div key={acc.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{acc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(acc.balance)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono w-8 text-right">
                        {acc.pct}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${acc.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
