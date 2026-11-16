import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Group, GroupExpense } from "../../types/finance";
import {
  Users,
  Plus,
  Receipt,
  CheckCircle2,
  Calendar,
  X,
  UserPlus,
  ArrowRight,
  HandCoins,
} from "lucide-react";

export const GroupsView: React.FC = () => {
  const { groups, addGroup, addGroupExpense, recordGroupSettlement, formatCurrency, userProfile } = useFinance();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || "");
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New Group state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newMembersText, setNewMembersText] = useState("");

  // New Group Expense state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidById, setPaidById] = useState("mem_me");

  // Settlement form state
  const [settleFromId, setSettleFromId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const memberList = newMembersText
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    await addGroup(newGroupName.trim(), newGroupDesc.trim(), memberList);
    setIsAddGroupOpen(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewMembersText("");
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;
    const numAmount = parseFloat(expenseAmount);
    if (!numAmount || numAmount <= 0) return;

    // Equal split calculation
    const count = Math.max(1, currentGroup.members.length);
    const splitAmount = Math.round((numAmount / count) * 100) / 100;
    const splits = currentGroup.members.map((m) => ({
      memberId: m.id,
      amount: splitAmount,
    }));

    await addGroupExpense(currentGroup.id, {
      groupId: currentGroup.id,
      title: expenseTitle.trim() || "Shared bill",
      amount: numAmount,
      paidById,
      splitType: "equal",
      splits,
      date: new Date().toISOString().split("T")[0],
    });

    setIsAddExpenseOpen(false);
    setExpenseTitle("");
    setExpenseAmount("");
  };

  // Settlement Matrix calculation for current group
  const memberBalances = React.useMemo(() => {
    if (!currentGroup) return [];
    const balances: Record<string, number> = {};
    currentGroup.members.forEach((m) => {
      balances[m.id] = 0;
    });

    currentGroup.expenses.forEach((exp) => {
      // Payer gets credited full amount
      balances[exp.paidById] = (balances[exp.paidById] || 0) + exp.amount;
      // Each participant owes their share
      exp.splits.forEach((s) => {
        balances[s.memberId] = (balances[s.memberId] || 0) - s.amount;
      });
    });

    // Apply settlements
    currentGroup.settlements.forEach((s) => {
      balances[s.fromMemberId] = (balances[s.fromMemberId] || 0) + s.amount;
      balances[s.toMemberId] = (balances[s.toMemberId] || 0) - s.amount;
    });

    return currentGroup.members.map((m) => ({
      member: m,
      balance: Math.round(balances[m.id] || 0),
    }));
  }, [currentGroup]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Friends & Shared Group Expenses
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Split hostel bills, trips, groceries, and see exactly who owes whom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Group</span>
          </button>

          {currentGroup && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Shared Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Selector Pill bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap border ${
              currentGroup?.id === g.id
                ? "bg-[#D6B77A] text-[#101827] border-[#D6B77A] shadow-xs"
                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {currentGroup ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Group Ledger & Expenses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Banner */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {currentGroup.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {currentGroup.description} · {currentGroup.members.length} members
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {currentGroup.members.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] font-medium"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[10px] text-[var(--text-secondary)]">Total Group Spends</div>
                <div className="text-xl font-black text-[var(--text-primary)] tabular-nums mt-0.5">
                  {formatCurrency(
                    currentGroup.expenses.reduce((sum, e) => sum + e.amount, 0)
                  )}
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Group Shared Bills ({currentGroup.expenses.length})
              </h4>

              <div className="divide-y divide-[var(--border-color)]">
                {currentGroup.expenses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    No group expenses added yet. Click "Add Shared Bill" to split a meal or bill.
                  </div>
                ) : (
                  currentGroup.expenses.map((exp) => {
                    const payer = currentGroup.members.find((m) => m.id === exp.paidById);
                    return (
                      <div
                        key={exp.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)]/40 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)]">
                              {exp.title}
                            </div>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              Paid by {payer?.name || "Member"} · {exp.date} · Split equally ({exp.splits.length} people)
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                            {formatCurrency(exp.amount)}
                          </div>
                          <div className="text-[10px] text-[var(--accent-gold)]">
                            {formatCurrency(exp.splits[0]?.amount || 0)}/each
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Who Owes Whom Matrix */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-[var(--accent-gold)]" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Net Balance Matrix
                </h4>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Positive balance means others owe them; negative balance means they owe the group.
              </p>

              <div className="space-y-2.5">
                {memberBalances.map(({ member, balance }) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {balance > 0
                          ? "Gets back from group"
                          : balance < 0
                          ? "Owes to group"
                          : "Fully settled"}
                      </div>
                    </div>

                    <div
                      className={`text-sm font-extrabold tabular-nums ${
                        balance > 0
                          ? "text-emerald-400"
                          : balance < 0
                          ? "text-rose-400"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {balance > 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Settle Action */}
              {currentGroup.members.length > 1 && (
                <div className="pt-2 space-y-2 border-t border-[var(--border-color)]">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={settleFromId || currentGroup.members[1]?.id || ""}
                      onChange={(e) => setSettleFromId(e.target.value)}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
                    >
                      {currentGroup.members
                        .filter((m) => m.id !== "mem_me")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            From {m.name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      placeholder="Amount"
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const amt = parseFloat(settleAmount);
                      const fromId = settleFromId || currentGroup.members.find((m) => m.id !== "mem_me")?.id;
                      if (!fromId || !amt || amt <= 0) return;
                      await recordGroupSettlement(currentGroup.id, {
                        groupId: currentGroup.id,
                        fromMemberId: fromId,
                        toMemberId: "mem_me",
                        amount: amt,
                        date: new Date().toISOString().split("T")[0],
                        status: "settled",
                      });
                      setSettleAmount("");
                    }}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Record Friend Settlement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
          No groups created yet. Click "Create Group" above.
        </div>
      )}

      {/* Add Shared Bill Modal */}
      {isAddExpenseOpen && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add Expense to {currentGroup.name}
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi Router or Grocery Run"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Total Bill Amount
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-base font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Paid By
                </label>
                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  {currentGroup.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Split Equally
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Create New Split Group
              </h3>
              <button
                onClick={() => setIsAddGroupOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Vacation or Apartment 402"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Travel tickets, Airbnb, food splits"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Members (Comma separated names)
                </label>
                <input
                  type="text"
                  required
                  value={newMembersText}
                  onChange={(e) => setNewMembersText(e.target.value)}
                  placeholder="Comma-separated friend names"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
