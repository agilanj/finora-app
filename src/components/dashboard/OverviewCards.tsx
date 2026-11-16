import React from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  HandCoins,
  Receipt,
  Percent,
} from "lucide-react";

export const OverviewCards: React.FC = () => {
  const {
    totalTrackedBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    totalToReceive,
    totalToPay,
    budgetUtilization,
    formatCurrency,
    setActiveTab,
  } = useFinance();

  const cards = [
    {
      id: "balance",
      label: "Total Tracked Balance",
      value: formatCurrency(totalTrackedBalance),
      subtext: "Across all active accounts",
      icon: Wallet,
      color: "text-[var(--accent-gold)]",
      bgColor: "bg-[#D6B77A]/10",
      action: () => setActiveTab("accounts"),
    },
    {
      id: "income",
      label: "Monthly Income",
      value: formatCurrency(monthlyIncome),
      subtext: "Pocket money & earnings",
      icon: ArrowDownLeft,
      color: "text-[#4FC49A]",
      bgColor: "bg-[#4FC49A]/10",
      action: () => setActiveTab("transactions"),
    },
    {
      id: "expenses",
      label: "Monthly Expenses",
      value: formatCurrency(monthlyExpenses),
      subtext: "Spends & hostel costs",
      icon: ArrowUpRight,
      color: "text-[#EF7777]",
      bgColor: "bg-[#EF7777]/10",
      action: () => setActiveTab("transactions"),
    },
    {
      id: "savings",
      label: "Monthly Net Savings",
      value: `${monthlySavings >= 0 ? "+" : ""}${formatCurrency(monthlySavings)}`,
      subtext: monthlyIncome > 0 ? `${Math.round((monthlySavings / monthlyIncome) * 100)}% savings rate` : "Tracked net",
      icon: PiggyBank,
      color: monthlySavings >= 0 ? "text-[#4FC49A]" : "text-[#EF7777]",
      bgColor: monthlySavings >= 0 ? "bg-[#4FC49A]/10" : "bg-[#EF7777]/10",
      action: () => setActiveTab("goals"),
    },
    {
      id: "to_receive",
      label: "Amount to Receive",
      value: formatCurrency(totalToReceive),
      subtext: "Lent to friends & roommates",
      icon: HandCoins,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      action: () => setActiveTab("loans"),
    },
    {
      id: "to_pay",
      label: "Amount to Pay",
      value: formatCurrency(totalToPay),
      subtext: "Borrowed liabilities & dues",
      icon: Receipt,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      action: () => setActiveTab("loans"),
    },
    {
      id: "budget_util",
      label: "Budget Utilization",
      value: `${budgetUtilization}%`,
      subtext: budgetUtilization > 85 ? "Approaching limit" : "Healthy pacing",
      icon: Percent,
      color: budgetUtilization > 100 ? "text-[#EF7777]" : budgetUtilization > 80 ? "text-[#E9B965]" : "text-[#4FC49A]",
      bgColor: budgetUtilization > 100 ? "bg-[#EF7777]/10" : "bg-[#4FC49A]/10",
      action: () => setActiveTab("budgets"),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={c.action}
            className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left hover:border-[var(--accent-gold)] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] line-clamp-1">
                {c.label}
              </span>
              <div className={`w-6 h-6 rounded-lg ${c.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>

            <div>
              <div className="text-base sm:text-lg font-bold text-[var(--text-primary)] tabular-nums tracking-tight">
                {c.value}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                {c.subtext}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
