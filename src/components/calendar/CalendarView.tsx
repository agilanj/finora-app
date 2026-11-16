import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { FinancialReminder, ReminderType } from "../../types/finance";
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Repeat,
  AlertCircle,
  X,
} from "lucide-react";

export const CalendarView: React.FC = () => {
  const {
    reminders,
    loans,
    subscriptions,
    userProfile,
    addReminder,
    toggleReminder,
    deleteReminder,
    formatCurrency,
  } = useFinance();

  const todayStr = new Date().toISOString().split("T")[0];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ReminderType>("bill");
  const [recurrence, setRecurrence] = useState<"none" | "monthly" | "weekly">("monthly");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addReminder({
      title: title.trim(),
      date,
      amount: amount ? parseFloat(amount) : undefined,
      type,
      isCompleted: false,
      recurrence,
    });

    setIsAddOpen(false);
    setTitle("");
    setAmount("");
  };

  // Compile unified calendar events (loans due + subscriptions + reminders + pocket money)
  const unifiedEvents = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      amount?: number;
      type: string;
      isCompleted?: boolean;
      source: "reminder" | "loan" | "sub";
    }> = [];

    // Custom Reminders
    reminders.forEach((r) => {
      list.push({
        id: r.id,
        title: r.title,
        date: r.date,
        amount: r.amount,
        type: r.type,
        isCompleted: r.isCompleted,
        source: "reminder",
      });
    });

    // Loans Due
    loans
      .filter((l) => l.status !== "settled")
      .forEach((l) => {
        list.push({
          id: `loan_${l.id}`,
          title: `${l.type === "borrow" ? "Repay" : "Collect from"} ${l.personName}`,
          date: l.dueDate,
          amount: l.outstandingAmount,
          type: "repayment",
          isCompleted: false,
          source: "loan",
        });
      });

    // Subscriptions Due
    subscriptions
      .filter((s) => s.status === "active")
      .forEach((s) => {
        list.push({
          id: `sub_${s.id}`,
          title: `${s.name} renewal`,
          date: s.nextRenewalDate,
          amount: s.amount,
          type: "subscription",
          isCompleted: false,
          source: "sub",
        });
      });

    // Sort by date ascending
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [reminders, loans, subscriptions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Financial Calendar & Reminders
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Never miss upcoming loan repayments, bill dues, subscription renewals or salary dates.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Calendar Timeline List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upcoming Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Upcoming Schedule & Deadlines ({unifiedEvents.length})
            </h3>

            <div className="space-y-3">
              {unifiedEvents.map((evt) => {
                const isOverdue = evt.date < todayStr && !evt.isCompleted;

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      evt.isCompleted
                        ? "bg-[var(--bg-elevated)]/50 border-[var(--border-color)] opacity-60"
                        : isOverdue
                        ? "bg-rose-500/10 border-rose-500/30"
                        : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#D6B77A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {evt.source === "reminder" && (
                        <button
                          onClick={() => toggleReminder(evt.id)}
                          className="text-[var(--accent-gold)] hover:scale-110 transition-transform cursor-pointer"
                        >
                          {evt.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      )}

                      <div>
                        <div
                          className={`font-semibold text-xs sm:text-sm text-[var(--text-primary)] ${
                            evt.isCompleted ? "line-through" : ""
                          }`}
                        >
                          {evt.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{evt.date}</span>
                          <span>·</span>
                          <span className="capitalize">{evt.type.replace("_", " ")}</span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-400">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {evt.amount !== undefined && (
                        <div className="text-right">
                          <div className="font-bold text-sm text-[var(--text-primary)] tabular-nums">
                            {formatCurrency(evt.amount)}
                          </div>
                        </div>
                      )}

                      {evt.source === "reminder" && (
                        <button
                          onClick={() => deleteReminder(evt.id)}
                          className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info: Pocket Money & Salary cadence */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Cashflow Cadence
            </h4>
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-secondary)]">Allowance / Income Date</div>
              <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                Day {userProfile.salaryOrAllowanceDate} of every month
              </div>
              <div className="text-xs text-[var(--accent-gold)] mt-1 font-semibold">
                Expected: {formatCurrency(userProfile.monthlyIncomeOrAllowance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add Financial Reminder
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hostel electricity bill or exam fee"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Reminder Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ReminderType)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="bill">Utility / Bill</option>
                    <option value="repayment">Loan Repayment</option>
                    <option value="subscription">Subscription</option>
                    <option value="pocket_money">Pocket Money / Income</option>
                    <option value="custom">Other Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as "none" | "monthly" | "weekly")}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">One-time</option>
                  </select>
                </div>
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
