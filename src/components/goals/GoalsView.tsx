import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { SavingsGoal } from "../../types/finance";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Sparkles,
  X,
  History,
  TrendingUp,
} from "lucide-react";

export const GoalsView: React.FC = () => {
  const { goals, addGoal, contributeToGoal, deleteGoal, formatCurrency } = useFinance();

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  // New Goal form
  const defaultGoalDate = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState(defaultGoalDate);
  const [category, setCategory] = useState("Gadgets & Work");
  const [description, setDescription] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Contribute form
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!numTarget || numTarget <= 0) return;

    await addGoal({
      name: name.trim(),
      targetAmount: numTarget,
      targetDate,
      category,
      description: description.trim(),
    });

    setIsAddGoalOpen(false);
    setName("");
    setTargetAmount("");
    setDescription("");
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const numAmount = parseFloat(depositAmount);
    if (!numAmount || numAmount <= 0) return;

    await contributeToGoal(contributeGoal.id, numAmount, depositNote.trim());
    setContributeGoal(null);
    setDepositAmount("");
    setDepositNote("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Savings Goals
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Set milestone targets for devices, vacations, emergency funds, and future security.
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          No savings goals created yet. Click &quot;New Savings Goal&quot; to start building your target fund.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-base text-[var(--text-primary)]">
                      {goal.name}
                    </span>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      {goal.category} · Target {goal.targetDate}
                    </div>
                  </div>

                  {confirmDeleteId === goal.id ? (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteGoal(goal.id);
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
                      onClick={() => setConfirmDeleteId(goal.id)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {goal.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                    {goal.description}
                  </p>
                )}

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Saved So Far</div>
                    <div className="text-2xl font-black text-[var(--accent-gold)] tabular-nums">
                      {formatCurrency(goal.currentAmount)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-secondary)]">Target Goal</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-2.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B99758] to-[#D6B77A] rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span className="text-emerald-400 font-semibold">{progress}% completed</span>
                    <span>{formatCurrency(remaining)} to go</span>
                  </div>
                </div>
              </div>

              {/* Actions & Contribution History */}
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <History className="w-3 h-3" />
                  <span>{goal.contributions.length} deposits</span>
                </div>

                <button
                  onClick={() => setContributeGoal(goal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Deposit Contribution Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Deposit to {contributeGoal.name}
              </h3>
              <button
                onClick={() => setContributeGoal(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Note / Source
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="e.g. Saved from freelance milestone"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Add Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Create Savings Goal
              </h3>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund, Laptop, Travel"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  <option value="Gadgets & Work">Gadgets & Tech</option>
                  <option value="Travel">Travel & Vacation</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Education">Education & Courses</option>
                  <option value="Vehicle">Vehicle / Bike</option>
                  <option value="Other">Other Milestone</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Description / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Target savings for end-of-year semester graduation"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
