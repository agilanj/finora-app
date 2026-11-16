import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Account } from "../../types/finance";
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Star,
  Trash2,
  Edit2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

interface AccountsViewProps {
  onOpenAddAccount: () => void;
  onOpenTransfer: (sourceAccountId?: string) => void;
  onEditAccount: (account: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenAddAccount,
  onOpenTransfer,
  onEditAccount,
}) => {
  const {
    accounts,
    totalTrackedBalance,
    formatCurrency,
    toggleHideAccountBalance,
    deleteAccount,
    transactions,
  } = useFinance();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || "");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || activeAccounts[0];

  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccount?.id || t.destinationAccountId === selectedAccount?.id
  );

  const confirmAccount = confirmDeleteId
    ? activeAccounts.find((a) => a.id === confirmDeleteId)
    : null;
  const confirmLinkedCount = confirmAccount
    ? transactions.filter(
        (t) => t.accountId === confirmAccount.id || t.destinationAccountId === confirmAccount.id
      ).length
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            My Financial Accounts
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your multiple bank accounts, cash wallets, and UPI-linked balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTransfer()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <span>Internal Transfer</span>
          </button>

          <button
            onClick={onOpenAddAccount}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Inline Delete Account Confirmation Banner */}
      {confirmAccount && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-rose-300">
              Delete account &quot;{confirmAccount.name}&quot;?
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {confirmLinkedCount > 0
                ? `This will also remove ${confirmLinkedCount} linked transaction(s) and recurring entries for this account.`
                : "This permanently removes the account from your cloud ledger."}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteAccount(confirmAccount.id, true);
                setConfirmDeleteId(null);
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Aggregate Overview Strip */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            Consolidated Tracked Balance
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums mt-0.5">
            {formatCurrency(totalTrackedBalance)}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] text-[var(--text-secondary)]">Active Accounts</div>
            <div className="font-bold text-[var(--text-primary)]">{activeAccounts.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)]">Primary Bank</div>
            <div className="font-bold text-[var(--accent-gold)]">
              {accounts.find((a) => a.isDefault)?.name || activeAccounts[0]?.name || "None set"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)]">Cloud Sync</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Ledger</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State or Accounts Cards Grid */}
      {activeAccounts.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No accounts added yet</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Add your bank account, UPI wallet, or cash in hand to track live balances and transactions.
          </p>
          <button
            onClick={onOpenAddAccount}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {activeAccounts.map((account) => {
            const isSelected = selectedAccount?.id === account.id;

            return (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48 ${
                  isSelected
                    ? "border-[var(--accent-gold)] bg-[var(--bg-card)] shadow-md ring-1 ring-[#D6B77A]/40"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/50"
                }`}
              >
                {/* Top Accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${account.colorGradient}`}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {account.name}
                      </span>
                      {account.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] capitalize mt-0.5">
                      {account.bankName} · {account.accountType}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {account.maskedNumber}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Current Balance</div>
                  <div className="text-xl font-black text-[var(--text-primary)] tabular-nums mt-0.5">
                    {account.isHidden ? "••••••••" : formatCurrency(account.balance)}
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHideAccountBalance(account.id);
                    }}
                    className="hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
                    title={account.isHidden ? "Reveal balance" : "Hide balance"}
                  >
                    {account.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTransfer(account.id);
                    }}
                    className="hover:text-[var(--accent-gold)] p-1 rounded flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount(account);
                    }}
                    className="hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
                    title="Edit account"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(account.id);
                    }}
                    className="hover:text-rose-400 p-1 rounded cursor-pointer"
                    title="Delete account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Account Deep Dive: Transactions & Ledger */}
      {selectedAccount && (
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-color)] gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{selectedAccount.name} Transaction Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] font-mono text-[var(--accent-gold)]">
                  {selectedAccount.maskedNumber}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Showing all financial credits, debits, and transfers for this account
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[var(--text-secondary)] mr-2">Tracked Balance:</span>
              <span className="text-sm font-extrabold text-[var(--text-primary)] tabular-nums">
                {selectedAccount.isHidden ? "••••••••" : formatCurrency(selectedAccount.balance)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {accountTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                No transactions recorded for this account yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {accountTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                      <td className="py-2.5 font-mono text-[var(--text-secondary)]">{tx.date}</td>
                      <td className="py-2.5 font-medium text-[var(--text-primary)]">{tx.description}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{tx.category}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            tx.type === "income"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : tx.type === "transfer"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold tabular-nums">
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
