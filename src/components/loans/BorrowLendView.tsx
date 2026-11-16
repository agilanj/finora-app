import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { LoanRecord, LoanType, Repayment } from "../../types/finance";
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Calendar,
  User,
  Trash2,
  X,
  History,
} from "lucide-react";

export const BorrowLendView: React.FC = () => {
  const { loans, totalToReceive, totalToPay, addLoan, recordRepayment, deleteLoan, formatCurrency } = useFinance();

  const [activeTab, setActiveTab] = useState<"all" | "lend" | "borrow">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<LoanRecord | null>(null);

  // New Loan Form state
  const [loanType, setLoanType] = useState<LoanType>("lend");
  const [personName, setPersonName] = useState("");
  const [personContact, setPersonContact] = useState("");
  const [amount, setAmount] = useState("");
  const defaultDueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [description, setDescription] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Repayment form state
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("UPI");
  const [repayNote, setRepayNote] = useState("");

  const filteredLoans = loans.filter((l) => {
    if (activeTab === "all") return true;
    return l.type === activeTab;
  });

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    await addLoan({
      type: loanType,
      personName: personName.trim(),
      personContact: personContact.trim(),
      originalAmount: numAmount,
      startDate: new Date().toISOString().split("T")[0],
      dueDate,
      description: description.trim() || `${loanType === "lend" ? "Lent to" : "Borrowed from"} ${personName}`,
    });

    setIsAddOpen(false);
    setPersonName("");
    setAmount("");
    setDescription("");
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;
    const numRepay = parseFloat(repayAmount);
    if (!numRepay || numRepay <= 0) return;

    await recordRepayment(repayLoan.id, {
      amount: numRepay,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: repayMethod,
      note: repayNote.trim(),
    });

    setRepayLoan(null);
    setRepayAmount("");
    setRepayNote("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Borrowing & Lending
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Track receivables and personal liabilities with partial/full settlements.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Loan / Borrow</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* To Receive (Lent) */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Total Amount to Receive (Lent)
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(totalToReceive)}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              Assets & receivables from friends
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* To Pay (Borrowed) */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Total Amount to Pay (Borrowed)
            </span>
            <div className="text-2xl font-extrabold text-rose-400 tabular-nums mt-0.5">
              {formatCurrency(totalToPay)}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              Liabilities & upcoming repayments
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Segmented Tab Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#D6B77A] text-[#101827] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Dues ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab("lend")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "lend"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Money Lent (Receivables)
          </button>
          <button
            onClick={() => setActiveTab("borrow")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "borrow"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Money Borrowed (Liabilities)
          </button>
        </div>
      </div>

      {/* Loans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--text-secondary)]">
            No borrow or lend records found.
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const isSettled = loan.status === "settled" || loan.outstandingAmount === 0;
            const repaidSoFar = loan.originalAmount - loan.outstandingAmount;
            const progress = Math.min(100, Math.round((repaidSoFar / loan.originalAmount) * 100));

            return (
              <div
                key={loan.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {loan.personName}
                        </span>
                        {isSettled ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                            SETTLED
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              loan.type === "lend"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {loan.type === "lend" ? "LENT" : "BORROWED"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {loan.description}
                      </div>
                    </div>

                    {confirmDeleteId === loan.id ? (
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteLoan(loan.id);
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
                        onClick={() => setConfirmDeleteId(loan.id)}
                        className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {loan.type === "lend" ? "Remaining to Collect" : "Remaining to Repay"}
                      </div>
                      <div
                        className={`text-xl font-extrabold tabular-nums ${
                          isSettled
                            ? "text-[var(--text-secondary)] line-through"
                            : loan.type === "lend"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(loan.outstandingAmount)}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-[var(--text-secondary)]">
                      <div>Original: {formatCurrency(loan.originalAmount)}</div>
                      <div className="text-[10px] flex items-center gap-1 mt-0.5 justify-end">
                        <Calendar className="w-3 h-3" />
                        <span>Due {loan.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Repayment Progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          loan.type === "lend" ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] mt-1">
                      <span>{formatCurrency(repaidSoFar)} settled</span>
                      <span>{progress}% paid</span>
                    </div>
                  </div>
                </div>

                {/* Repayments History & Action Button */}
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>{loan.repayments.length} repayments</span>
                  </div>

                  {!isSettled && (
                    <button
                      onClick={() => {
                        setRepayLoan(loan);
                        setRepayAmount(loan.outstandingAmount.toString());
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                    >
                      Record Repayment
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Repayment Modal */}
      {repayLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Record Repayment
              </h3>
              <button
                onClick={() => setRepayLoan(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordRepayment} className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {repayLoan.type === "lend" ? "Collecting from" : "Repaying to"}
                </span>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {repayLoan.personName}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Current Due: {formatCurrency(repayLoan.outstandingAmount)}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Repayment Amount
                </label>
                <input
                  type="number"
                  step="any"
                  max={repayLoan.outstandingAmount}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-base focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Payment Method
                </label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="e.g. Cleared full balance"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRepayLoan(null)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Save Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Record Borrowing or Lending
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="mt-4 space-y-3 text-xs">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setLoanType("lend")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    loanType === "lend"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  I Lent Money (Receivable)
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType("borrow")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    loanType === "borrow"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  I Borrowed Money (Liability)
                </button>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Person Name
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Person or friend name"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner bill split, textbook emergency"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-md"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
