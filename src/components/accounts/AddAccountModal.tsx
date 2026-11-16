import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { POPULAR_BANKS } from "../../config/brand";
import { AccountType } from "../../types/finance";
import { X, Landmark, Train, Loader2 } from "lucide-react";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount, addVirtualCard, userProfile, isMutating } = useFinance();

  const [entryMode, setEntryMode] = useState<"account" | "transit">("account");
  const [submitting, setSubmitting] = useState(false);

  // Bank / Cash Account states (clean defaults)
  const [selectedBankId, setSelectedBankId] = useState<string>("sbi");
  const [accountName, setAccountName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("State Bank of India");
  const [accountType, setAccountType] = useState<AccountType>("savings");
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [maskedNumber, setMaskedNumber] = useState<string>("");
  const [colorGradient, setColorGradient] = useState<string>("from-[#1e3a8a] via-[#312e81] to-[#1e1b4b]");
  const [isDefault, setIsDefault] = useState<boolean>(false);

  // Transit Card states
  const [transitNickname, setTransitNickname] = useState<string>("");
  const [transitProvider, setTransitProvider] = useState<string>("");
  const [transitNumber, setTransitNumber] = useState<string>("");
  const [transitBalance, setTransitBalance] = useState<string>("0");

  if (!isOpen) return null;

  const handleBankSelect = (bankId: string) => {
    setSelectedBankId(bankId);
    const bank = POPULAR_BANKS.find((b) => b.id === bankId);
    if (bank) {
      setBankName(bank.name);
      if (!accountName.trim()) {
        setAccountName(`${bank.code} Account`);
      }
      setColorGradient(bank.color);
      if (bankId === "cash") setAccountType("cash");
      else if (bankId === "upi") setAccountType("upi");
      else setAccountType("savings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isMutating) return;
    setSubmitting(true);

    try {
      if (entryMode === "transit") {
        const bal = Math.max(0, parseFloat(transitBalance) || 0);
        const cleanedDigits = transitNumber.replace(/\D/g, "").slice(-4);
        const last4 = cleanedDigits || "0000";
        await addVirtualCard({
          nickname: transitNickname.trim() || "Smart Transit Pass",
          provider: transitProvider.trim() || "Metro Rail",
          cardType: "transit",
          lastFour: last4,
          fullNumber: cleanedDigits ? `NFC-${cleanedDigits}` : `NFC-PASS`,
          holderName: (userProfile.name || "FINORA USER").toUpperCase(),
          transitBalance: bal,
          validTill: "Active",
          issuingAuthority: transitProvider.trim() || "Transit Network",
          cardDesign: "metro_cyan",
          status: "active",
          isPinned: true,
          notes: "Added directly to Wallet Carousel",
        });
        onClose();
        return;
      }

      const balanceNum = parseFloat(openingBalance) || 0;
      const selectedBank = POPULAR_BANKS.find((b) => b.id === selectedBankId);

      await addAccount({
        name: accountName.trim() || `${selectedBank?.code || "Primary"} Account`,
        bankName: bankName.trim() || "Bank",
        bankCode: selectedBank?.code || "FINORA",
        accountType,
        balance: balanceNum,
        currency: userProfile.currency || "INR",
        maskedNumber: maskedNumber.trim() || "•••• 0000",
        colorGradient,
        isDefault,
        isArchived: false,
        isHidden: false,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-indigo-400/25 shadow-2xl p-6 text-left max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              {entryMode === "transit" ? <Train className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add to Wallet Carousel
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Add a Bank Account, Cash Wallet, or Transit Smart Card
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

        {/* Mode Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setEntryMode("account")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              entryMode === "account"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank / Cash Account</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("transit")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              entryMode === "transit"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Transit Travel Card</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {entryMode === "transit" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Transit Card Name
                  </label>
                  <input
                    type="text"
                    required
                    value={transitNickname}
                    onChange={(e) => setTransitNickname(e.target.value)}
                    placeholder="e.g. Metro Smart Card"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Transit Operator
                  </label>
                  <input
                    type="text"
                    required
                    value={transitProvider}
                    onChange={(e) => setTransitProvider(e.target.value)}
                    placeholder="e.g. Metro Rail / NCMC / City Bus"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={transitNumber}
                    onChange={(e) => setTransitNumber(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Initial Card Balance ({userProfile.currencySymbol || "₹"})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={transitBalance}
                    onChange={(e) => setTransitBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold tabular-nums focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Popular Bank Selector Chips */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Select Bank or Wallet Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBankSelect(b.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBankId === b.id
                          ? "border-indigo-400 bg-indigo-500/15 text-indigo-300 shadow-xs"
                          : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="text-[10px] opacity-75">{b.code}</div>
                      <div className="truncate font-bold">{b.name.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Nickname & Custom Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Account Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Primary Savings"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Bank / Provider Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Account Type & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                    <option value="salary">Salary Account</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="upi">UPI Tracked Account</option>
                    <option value="other">Other Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Opening Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">
                      {userProfile.currencySymbol || "₹"}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-400 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Masked Card Number & Default Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Masked Identifier
                  </label>
                  <input
                    type="text"
                    value={maskedNumber}
                    onChange={(e) => setMaskedNumber(e.target.value)}
                    placeholder="•••• 0000"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-[var(--border-color)] text-indigo-500 focus:ring-0"
                    />
                    <span>Set as primary default account</span>
                  </label>
                </div>
              </div>
            </>
          )}

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
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {(submitting || isMutating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Add to Carousel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
