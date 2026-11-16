import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Account, AccountType } from "../../types/finance";
import { X, Landmark, Check } from "lucide-react";

interface EditAccountModalProps {
  account: Account | null;
  onClose: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  onClose,
}) => {
  const { editAccount, userProfile, isMutating } = useFinance();

  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("savings");
  const [balance, setBalance] = useState("0");
  const [maskedNumber, setMaskedNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBankName(account.bankName);
      setAccountType(account.accountType);
      setBalance(account.balance.toString());
      setMaskedNumber(account.maskedNumber);
      setIsDefault(account.isDefault);
      setSubmitting(false);
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isMutating) return;
    setSubmitting(true);
    try {
      const numericBalance = parseFloat(balance);

      await editAccount(account.id, {
        name: name.trim() || account.name,
        bankName: bankName.trim() || account.bankName,
        accountType,
        balance: isNaN(numericBalance) ? account.balance : numericBalance,
        maskedNumber: maskedNumber.trim() || account.maskedNumber,
        isDefault,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl glass-panel border border-indigo-400/25 shadow-2xl p-6 text-left animate-fade-up">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Edit Account Details
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Update nickname, balance, or primary default status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Account Nickname
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Bank / Provider
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="salary">Salary Account</option>
                <option value="cash">Cash Wallet</option>
                <option value="upi">UPI Tracked Account</option>
                <option value="other">Other Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Current Balance ({userProfile.currencySymbol || "₹"})
              </label>
              <input
                type="number"
                step="any"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold tabular-nums focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Masked Identifier
              </label>
              <input
                type="text"
                value={maskedNumber}
                onChange={(e) => setMaskedNumber(e.target.value)}
                placeholder="•••• 4821"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
            />
            <span className="font-semibold text-[var(--text-primary)]">
              Set as primary default payment account
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isMutating}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
