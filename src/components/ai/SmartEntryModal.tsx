import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Sparkles, X, Check, ArrowRight, CornerDownLeft, AlertCircle } from "lucide-react";

interface SmartEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManualModal: () => void;
}

interface ParsedDraft {
  type: "income" | "expense" | "transfer";
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  suggestedAccountId?: string;
}

export const SmartEntryModal: React.FC<SmartEntryModalProps> = ({
  isOpen,
  onClose,
  onOpenManualModal,
}) => {
  const { accounts, addTransaction, formatCurrency } = useFinance();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ""
  );

  useEffect(() => {
    if (isOpen) {
      setError("");
      setDraft(null);
      setPrompt("");
      setSelectedAccountId(
        accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ""
      );
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt.trim(),
          accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setDraft(json.data);
        if (json.data.suggestedAccountId) {
          setSelectedAccountId(json.data.suggestedAccountId);
        }
      } else {
        throw new Error(json.error || "Could not understand input");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse transaction text";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDraft = async () => {
    if (!draft) return;
    const targetAccId = selectedAccountId || accounts[0]?.id || "";
    if (!targetAccId) {
      setError("Please add an account first before saving this transaction.");
      return;
    }
    setLoading(true);
    try {
      const res = await addTransaction({
        type: draft.type,
        amount: draft.amount,
        category: draft.category,
        description: draft.description,
        accountId: targetAccId,
        paymentMethod: draft.paymentMethod || "UPI",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      if (!res.success) {
        setError(res.error || "Failed to save transaction");
        return;
      }
      setDraft(null);
      setPrompt("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "Lunch 120 UPI",
    "Received 5000 pocket money from father",
    "Metro smart card recharge 300 debit card",
    "Roommate wifi bill 300 cash",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#D6B77A]/20 flex items-center justify-center text-[var(--accent-gold)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Smart AI Transaction Entry
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Type naturally — FINORA extracts type, amount, category and payment mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        {!draft ? (
          <form onSubmit={handleParse} className="mt-4 space-y-4">
            <div>
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Lunch 120 UPI at college canteen or Received 5000 pocket money..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Try Examples
              </div>
              <div className="flex flex-wrap gap-1.5">
                {examplePrompts.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#D6B77A] transition-colors cursor-pointer"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManualModal();
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Switch to manual form
              </button>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {loading ? (
                  <span>Interpreting...</span>
                ) : (
                  <>
                    <span>Parse Draft</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Draft Confirmation Screen */
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Detected Draft
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    draft.type === "income"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {draft.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Amount</div>
                  <div className="text-xl font-black text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(draft.amount)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Category</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                    {draft.category}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Description</div>
                  <div className="text-xs text-[var(--text-primary)] font-medium mt-0.5">
                    {draft.description}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Payment Mode</div>
                  <div className="text-xs text-[var(--text-primary)] font-medium mt-0.5">
                    {draft.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Account Selection for Draft */}
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Target Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Re-enter prompt
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDraft}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
