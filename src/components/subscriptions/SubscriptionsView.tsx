import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Subscription } from "../../types/finance";
import {
  Repeat,
  Plus,
  Calendar,
  Trash2,
  Pause,
  Play,
  X,
  CreditCard,
} from "lucide-react";

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    accounts,
    monthlySubscriptionTotal,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    formatCurrency,
  } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingFrequency, setBillingFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [category, setCategory] = useState("Entertainment & Subs");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    await addSubscription({
      name: name.trim(),
      amount: numAmount,
      billingFrequency,
      nextRenewalDate,
      accountId: accountId || accounts[0]?.id || "",
      category,
      status: "active",
    });

    setIsAddOpen(false);
    setName("");
    setAmount("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Subscription Tracker
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Monitor streaming, SaaS, student plans, and recurring renewals in one place.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Aggregate Cost Strip */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Effective Monthly Subscription Burn
          </span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums mt-0.5">
            {formatCurrency(monthlySubscriptionTotal)}
            <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">/ month</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] text-[var(--text-secondary)]">Active Plans</div>
            <div className="font-bold text-[var(--text-primary)]">
              {subscriptions.filter((s) => s.status === "active").length}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)]">Annual Cost Approx</div>
            <div className="font-bold text-[var(--accent-gold)]">
              {formatCurrency(monthlySubscriptionTotal * 12)}
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          No recurring subscriptions added yet. Click &quot;Add Subscription&quot; to track monthly or annual plans.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const isPaused = sub.status === "paused";

          return (
            <div
              key={sub.id}
              className={`p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isPaused ? "opacity-60" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {sub.name}
                    </span>
                    <div className="text-[10px] text-[var(--text-secondary)] capitalize mt-0.5">
                      {sub.billingFrequency} · {sub.category}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      sub.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Plan Fee</div>
                    <div className="text-xl font-black text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(sub.amount)}
                      <span className="text-xs font-normal text-[var(--text-secondary)]">
                        /{sub.billingFrequency.slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-secondary)]">Next Renewal</div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-[var(--accent-gold)]" />
                      <span>{sub.nextRenewalDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  <span>Paid via: {accountMap.get(sub.accountId) || "Default Account"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <button
                  onClick={() =>
                    updateSubscription(sub.id, {
                      status: isPaused ? "active" : "paused",
                    })
                  }
                  className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </button>

                {confirmDeleteId === sub.id ? (
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteSubscription(sub.id);
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
                    onClick={() => setConfirmDeleteId(sub.id)}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add Subscription Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add Recurring Subscription
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
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix, Spotify, iCloud, Gym"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Renewal Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="199"
                    className="w-full px-3 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value as "monthly" | "quarterly" | "yearly")}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    required
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Payment Account
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
