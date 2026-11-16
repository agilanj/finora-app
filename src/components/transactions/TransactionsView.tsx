import React, { useState, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../config/brand";
import { Transaction } from "../../types/finance";
import {
  Search,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  Download,
  Check,
  X,
} from "lucide-react";

interface TransactionsViewProps {
  onOpenQuickAdd: () => void;
  onOpenSmartAI: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenQuickAdd,
  onOpenSmartAI,
  onEditTransaction,
}) => {
  const {
    transactions,
    accounts,
    categories: userCategories,
    deleteTransaction,
    formatCurrency,
    setActiveTab,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  // Combine categories for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    userCategories.forEach((c) => set.add(c.name));
    EXPENSE_CATEGORIES.forEach((c) => set.add(c.name));
    INCOME_CATEGORIES.forEach((c) => set.add(c.name));
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    set.add("Internal Transfer");
    return Array.from(set);
  }, [userCategories, transactions]);

  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentMonthLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    []
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (
        searchTerm.trim() &&
        !tx.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tx.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(tx.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Type
      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }

      // Category
      if (selectedCategory !== "all" && tx.category !== selectedCategory) {
        return false;
      }

      // Account
      if (
        selectedAccountId !== "all" &&
        tx.accountId !== selectedAccountId &&
        tx.destinationAccountId !== selectedAccountId
      ) {
        return false;
      }

      // Period
      if (selectedPeriod === "this_month" && !tx.date.startsWith(currentMonthPrefix)) {
        return false;
      }

      return true;
    });
  }, [
    transactions,
    searchTerm,
    selectedType,
    selectedCategory,
    selectedAccountId,
    selectedPeriod,
    currentMonthPrefix,
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Transaction Activity
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Full audit ledger of all tracked income, expenses, and internal transfers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSmartAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <span>Smart Entry</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description, category, or note..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] overflow-x-auto">
            {["all", "expense", "income", "transfer"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  selectedType === t
                    ? "bg-[#D6B77A] text-[#101827] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month ({currentMonthLabel})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Showing {filteredTransactions.length} of {transactions.length} records
          </span>
          {(searchTerm ||
            selectedType !== "all" ||
            selectedCategory !== "all" ||
            selectedAccountId !== "all" ||
            selectedPeriod !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedCategory("all");
                setSelectedAccountId("all");
                setSelectedPeriod("all");
              }}
              className="text-[11px] text-[var(--accent-gold)] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="text-xs text-[var(--text-secondary)]">
              No transactions recorded yet. Add your first income, expense, or transfer to begin tracking.
            </div>
            <button
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Transaction</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
            No transactions match your search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/50 text-[var(--text-secondary)] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                      {tx.date}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 italic">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                      {tx.category}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-primary)] font-medium whitespace-nowrap">
                      {accountMap.get(tx.accountId) || "Account"}
                      {tx.type === "transfer" && tx.destinationAccountId && (
                        <span className="text-[10px] text-[var(--text-secondary)] block">
                          → {accountMap.get(tx.destinationAccountId)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>

                    <td className="py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                      <span
                        className={
                          tx.type === "income"
                            ? "text-[#4FC49A]"
                            : tx.type === "transfer"
                            ? "text-blue-400"
                            : "text-[var(--text-primary)]"
                        }
                      >
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {confirmDeleteId === tx.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteTransaction(tx.id);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                            title="Confirm delete & restore balance"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded text-[var(--text-secondary)] hover:text-indigo-400 transition-colors cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
