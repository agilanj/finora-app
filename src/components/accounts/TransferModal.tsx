import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { ArrowRightLeft, X, AlertCircle } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceAccountId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  initialSourceAccountId,
}) => {
  const { accounts, transferBetweenAccounts, formatCurrency, userProfile, isMutating } = useFinance();

  const [fromId, setFromId] = useState(initialSourceAccountId || accounts[0]?.id || "");
  const [toId, setToId] = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaultFrom =
      initialSourceAccountId ||
      accounts.find((a) => a.isDefault)?.id ||
      accounts[0]?.id ||
      "";
    const defaultTo = accounts.find((a) => a.id !== defaultFrom)?.id || "";
    setFromId(defaultFrom);
    setToId(defaultTo);
    setAmount("");
    setNote("");
    setError("");
    setSubmitting(false);
  }, [isOpen, initialSourceAccountId, accounts]);

  useEffect(() => {
    if (fromId === toId) {
      const alt = accounts.find((a) => a.id !== fromId);
      setToId(alt?.id || "");
    }
  }, [fromId, toId, accounts]);

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === fromId);
  const destAccount = accounts.find((a) => a.id === toId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isMutating) return;
    setError("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await transferBetweenAccounts(fromId, toId, numericAmount, note);
      if (!res.success) {
        setError(res.error || "Transfer failed");
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Internal Account Transfer
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Move money between your tracked accounts seamlessly
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

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Transfer Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-secondary)]">
                {userProfile.currencySymbol || "₹"}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] tabular-nums"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mb-1">
                <span>From Account</span>
                {sourceAccount && (
                  <span className="text-[11px] text-[var(--accent-gold)] font-mono">
                    Avail: {formatCurrency(sourceAccount.balance)}
                  </span>
                )}
              </div>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mb-1">
                <span>To Account</span>
                {destAccount && (
                  <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                    Balance: {formatCurrency(destAccount.balance)}
                  </span>
                )}
              </div>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
              >
                {accounts
                  .filter((a) => a.id !== fromId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional transfer note"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isMutating || accounts.length < 2}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-md cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
