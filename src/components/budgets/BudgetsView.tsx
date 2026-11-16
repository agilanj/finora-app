import React, { useState, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { EXPENSE_CATEGORIES } from "../../config/brand";
import { Budget } from "../../types/finance";
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  TrendingDown,
} from "lucide-react";

export const BudgetsView: React.FC = () => {
  const { budgets, transactions, addBudget, deleteBudget, formatCurrency } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState("Food & Dining");
  const [limitAmount, setLimitAmount] = useState("");
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentMonthLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    []
  );

  // Calculate actual spending per category for current month
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date.startsWith(currentMonthPrefix)) {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions, currentMonthPrefix]);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalBudgetSpent = budgets.reduce(
    (sum, b) => sum + (categorySpending[b.category] || 0),
    0
  );
  const overallUtilization = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limitAmount);
    if (!numLimit || numLimit <= 0) return;

    await addBudget({
      category,
      limitAmount: numLimit,
      period,
      monthYear: currentMonthPrefix,
    });

    setIsAddOpen(false);
    setLimitAmount("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Budget Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Set spending limits by category, avoid overspending, and track monthly pacing.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Aggregate Budget Utilization Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {currentMonthLabel} Budget Overview
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tabular-nums mt-0.5">
            {formatCurrency(totalBudgetSpent)}{" "}
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              of {formatCurrency(totalBudgetLimit)} planned
            </span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Remaining unspent budget:{" "}
            <strong className="text-emerald-400">
              {formatCurrency(Math.max(0, totalBudgetLimit - totalBudgetSpent))}
            </strong>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-secondary)]">Utilization</span>
            <span
              className={
                overallUtilization > 100
                  ? "text-rose-400"
                  : overallUtilization > 80
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            >
              {overallUtilization}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUtilization > 100
                  ? "bg-rose-500"
                  : overallUtilization > 80
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          No category budgets set yet. Click &quot;Set Category Budget&quot; to set your monthly spending targets.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const spent = categorySpending[b.category] || 0;
          const remaining = b.limitAmount - spent;
          const pct = Math.round((spent / b.limitAmount) * 100);
          const isOver = spent > b.limitAmount;
          const isWarning = pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {b.category}
                    </span>
                    <div className="text-[10px] text-[var(--text-secondary)] capitalize mt-0.5">
                      {b.period} Target
                    </div>
                  </div>

                  {confirmDeleteId === b.id ? (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteBudget(b.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(b.id)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Spent So Far</div>
                    <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(spent)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-secondary)]">Limit</div>
                    <div className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                      {formatCurrency(b.limitAmount)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {isOver ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} remaining`}
                    </span>
                    <span className="text-[var(--text-secondary)]">{pct}%</span>
                  </div>
                </div>
              </div>

              {isOver && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Category spending exceeded monthly ceiling!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Add Budget Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Set Category Budget
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBudget} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Spending Ceiling Amount
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full px-3 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Budget Frequency
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as "monthly" | "weekly")}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Set Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
