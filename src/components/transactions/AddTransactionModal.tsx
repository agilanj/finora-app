import React, { useState, useEffect, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../config/brand";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Sparkles,
  Train,
  Bus,
  CreditCard,
  Edit2,
  Loader2,
  Plus,
} from "lucide-react";
import { Transaction, TransitMode } from "../../types/finance";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSmartAI?: () => void;
  onOpenAddAccount?: () => void;
  initialType?: "expense" | "income" | "transfer";
  initialMode?: "standard" | "transit_recharge" | "transit_ride";
  initialTransitCardId?: string;
  editingTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onOpenSmartAI,
  onOpenAddAccount,
  initialType = "expense",
  initialMode = "standard",
  initialTransitCardId,
  editingTransaction = null,
}) => {
  const {
    accounts,
    cards,
    categories: userCategories,
    userProfile,
    addTransaction,
    editTransaction,
    transferBetweenAccounts,
    formatCurrency,
    rechargeTransitCard,
    recordTransitTrip,
    isMutating,
  } = useFinance();

  const isEditing = Boolean(editingTransaction);

  // Transit cards available in user's vault
  const transitCards = cards.filter((c) => c.cardType === "transit");
  const defaultTransitCardId =
    initialTransitCardId || transitCards[0]?.id || "";
  const primaryAccId =
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "";

  // Modes: "standard", "transit_recharge", "transit_ride"
  const [expenseSubtype, setExpenseSubtype] = useState<
    "standard" | "transit_recharge" | "transit_ride"
  >(initialMode);

  const [type, setType] = useState<"expense" | "income" | "transfer">(initialType);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>(
    initialType === "income" ? "Pocket Money / Allowance" : "Food & Dining"
  );
  const [accountId, setAccountId] = useState<string>(primaryAccId);
  const [destinationAccountId, setDestinationAccountId] = useState<string>(
    accounts.find((a) => a.id !== primaryAccId)?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    userProfile.defaultPaymentMethod || "UPI"
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Transit Specific Fields (clean empty defaults)
  const [selectedTransitCardId, setSelectedTransitCardId] = useState<string>(defaultTransitCardId);
  const [transitRideMode, setTransitRideMode] = useState<TransitMode>("metro");
  const [fromStation, setFromStation] = useState<string>("");
  const [toStation, setToStation] = useState<string>("");
  const [routeNumber, setRouteNumber] = useState<string>("");

  const expenseCategoryOptions = useMemo(() => {
    const custom = userCategories.filter((c) => c.type === "expense").map((c) => c.name);
    const defaults = EXPENSE_CATEGORIES.map((c) => c.name);
    return Array.from(new Set([...custom, ...defaults]));
  }, [userCategories]);

  const incomeCategoryOptions = useMemo(() => {
    const custom = userCategories.filter((c) => c.type === "income").map((c) => c.name);
    const defaults = INCOME_CATEGORIES.map((c) => c.name);
    return Array.from(new Set([...custom, ...defaults]));
  }, [userCategories]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setExpenseSubtype("standard");
      setAmount(editingTransaction.amount.toString());
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setDestinationAccountId(editingTransaction.destinationAccountId || "");
      setPaymentMethod(editingTransaction.paymentMethod || userProfile.defaultPaymentMethod || "UPI");
      setDate(editingTransaction.date || new Date().toISOString().split("T")[0]);
      setNotes(editingTransaction.notes || "");
      setError("");
      setSubmitting(false);
      return;
    }

    const defAcc = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "";
    const altAcc = accounts.find((a) => a.id !== defAcc)?.id || "";
    setType(initialType);
    setExpenseSubtype(initialMode);
    setAmount("");
    setDescription(
      initialMode === "transit_recharge"
        ? "Transit Card Recharge"
        : initialMode === "transit_ride"
        ? "Commute Fare (Card Tap)"
        : ""
    );
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setAccountId(defAcc);
    setDestinationAccountId(altAcc);
    setPaymentMethod(userProfile.defaultPaymentMethod || "UPI");
    setCategory(
      initialMode !== "standard"
        ? "Transportation"
        : initialType === "income"
        ? incomeCategoryOptions[0] || "Pocket Money / Allowance"
        : initialType === "transfer"
        ? "Internal Transfer"
        : expenseCategoryOptions[0] || "Food & Dining"
    );
    setSelectedTransitCardId(initialTransitCardId || transitCards[0]?.id || "");
    setFromStation("");
    setToStation("");
    setRouteNumber("");
    setError("");
    setSubmitting(false);
  }, [isOpen, editingTransaction, initialType, initialMode, initialTransitCardId]);

  if (!isOpen) return null;

  const currentTransitCard = transitCards.find((c) => c.id === selectedTransitCardId);
  const currencySymbol = userProfile.currencySymbol || "₹";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isMutating) return;
    setError("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    setSubmitting(true);
    try {
      // EDIT EXISTING TRANSACTION FLOW
      if (editingTransaction) {
        if (!description.trim()) {
          setError("Please enter a transaction description");
          return;
        }
        if (!accountId) {
          setError("Please select an account");
          return;
        }
        if (type === "transfer" && (!destinationAccountId || destinationAccountId === accountId)) {
          setError("Please select a valid destination account");
          return;
        }
        const res = await editTransaction(editingTransaction.id, {
          type,
          amount: numericAmount,
          category: type === "transfer" ? "Internal Transfer" : category,
          description: description.trim(),
          accountId,
          destinationAccountId: type === "transfer" ? destinationAccountId : undefined,
          paymentMethod,
          date,
          notes: notes.trim(),
        });
        if (!res.success) {
          setError(res.error || "Failed to update transaction");
          return;
        }
        onClose();
        return;
      }

      // 1. TRANSIT CARD RECHARGE FLOW
      if (type === "expense" && expenseSubtype === "transit_recharge") {
        if (!selectedTransitCardId) {
          setError("Please add or select a transit card to recharge");
          return;
        }
        if (!accountId) {
          setError("Please select the bank account to pay from");
          return;
        }

        const res = await rechargeTransitCard(
          selectedTransitCardId,
          numericAmount,
          accountId,
          notes || description || "Transit card top-up"
        );
        if (!res.success) {
          setError(res.error || "Recharge failed");
          return;
        }
        onClose();
        return;
      }

      // 2. COMMUTE RIDE (DEDUCT DIRECTLY FROM TRAVEL CARD) FLOW
      if (type === "expense" && expenseSubtype === "transit_ride") {
        if (!selectedTransitCardId) {
          setError("Please add or select a transit card to deduct fare from");
          return;
        }

        const res = await recordTransitTrip({
          cardId: selectedTransitCardId,
          type: "ride",
          mode: transitRideMode,
          amount: numericAmount,
          fromStation: fromStation.trim() || undefined,
          toStation: toStation.trim() || undefined,
          routeNumber: routeNumber.trim() || undefined,
          date,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          notes: notes.trim() || `Commute via ${transitRideMode.toUpperCase()}`,
        });

        if (!res.success) {
          setError(res.error || "Trip recording failed");
          return;
        }
        onClose();
        return;
      }

      // 3. TRANSFER FLOW
      if (type === "transfer") {
        if (!destinationAccountId) {
          setError("Please select destination account");
          return;
        }
        const res = await transferBetweenAccounts(
          accountId,
          destinationAccountId,
          numericAmount,
          notes || description
        );
        if (!res.success) {
          setError(res.error || "Transfer failed");
          return;
        }
        onClose();
        return;
      }

      // 4. STANDARD EXPENSE OR INCOME FLOW
      if (!description.trim()) {
        setError("Please enter a transaction description");
        return;
      }
      if (!accountId) {
        setError("Please add or select an account first");
        return;
      }

      const res = await addTransaction({
        type,
        amount: numericAmount,
        category,
        description: description.trim(),
        accountId,
        paymentMethod,
        date,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        notes: notes.trim(),
      });
      if (!res.success) {
        setError(res.error || "Failed to save transaction");
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategories = type === "income" ? incomeCategoryOptions : expenseCategoryOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-color)] shadow-2xl p-6 text-left max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
              {isEditing && <Edit2 className="w-4 h-4 text-indigo-400" />}
              <span>{isEditing ? "Edit Financial Entry" : "Record Financial Entry"}</span>
            </h3>
            {!isEditing && onOpenSmartAI && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSmartAI();
                }}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Smart AI</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {accounts.length === 0 && expenseSubtype !== "transit_ride" && (
          <div className="mt-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-xs flex items-center justify-between gap-3">
            <span className="text-[var(--text-primary)] font-medium">
              Add a bank or cash account first to record transactions against it.
            </span>
            {onOpenAddAccount && (
              <button
                type="button"
                onClick={onOpenAddAccount}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Account</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Main Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setExpenseSubtype("standard");
                if (!isEditing) setCategory(expenseCategoryOptions[0] || "Food & Dining");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("income");
                setExpenseSubtype("standard");
                if (!isEditing) setCategory(incomeCategoryOptions[0] || "Pocket Money / Allowance");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === "income"
                  ? "bg-emerald-500 text-neutral-950 shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("transfer");
                setExpenseSubtype("standard");
                setCategory("Internal Transfer");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === "transfer"
                  ? "bg-amber-500 text-neutral-950 shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>

          {/* TRANSIT SUB-OPTIONS (When creating a new Expense) */}
          {!isEditing && type === "expense" && (
            <div className="p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  setExpenseSubtype("standard");
                  setDescription("");
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate ${
                  expenseSubtype === "standard"
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-color)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Standard Expense
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseSubtype("transit_recharge");
                  setDescription("Transit Card Recharge");
                  setCategory("Transportation");
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  expenseSubtype === "transit_recharge"
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Card Recharge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseSubtype("transit_ride");
                  setDescription("Commute Fare (Card Tap)");
                  setCategory("Transportation");
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  expenseSubtype === "transit_ride"
                    ? "bg-cyan-500 text-neutral-950 font-bold shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Train className="w-3 h-3" />
                <span>Travel Ride</span>
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {expenseSubtype === "transit_recharge"
                ? "Recharge Amount (Added to card balance)"
                : expenseSubtype === "transit_ride"
                ? "Ride Fare (Deducted from card balance)"
                : "Amount"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] text-xl font-bold focus:outline-none focus:border-amber-500 tabular-nums"
              />
            </div>
          </div>

          {/* 1. TRANSIT RECHARGE SPECIFIC DETAILS */}
          {!isEditing && type === "expense" && expenseSubtype === "transit_recharge" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Transit Card Top-Up
                </span>
                <span className="text-[10px] font-medium opacity-80">
                  Deducts from bank, adds to card
                </span>
              </div>

              {transitCards.length === 0 ? (
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  No transit travel cards found. Add one via &quot;Add Account &rarr; Transit Travel Card&quot; first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Select Transit Card to Recharge
                    </label>
                    <select
                      value={selectedTransitCardId}
                      onChange={(e) => setSelectedTransitCardId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {transitCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nickname} (Bal: {formatCurrency(c.transitBalance || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Pay Using Bank Account
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatCurrency(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. COMMUTE RIDE SPECIFIC DETAILS */}
          {!isEditing && type === "expense" && expenseSubtype === "transit_ride" && (
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <Train className="w-4 h-4" /> Commute Ride (Card Balance Deduction)
                </span>
                {currentTransitCard && (
                  <span className="text-[11px] font-bold text-white bg-cyan-500/30 px-2 py-0.5 rounded-full">
                    Card Bal: {formatCurrency(currentTransitCard.transitBalance || 0)}
                  </span>
                )}
              </div>

              {transitCards.length === 0 ? (
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  No transit travel cards found. Add one via &quot;Add Account &rarr; Transit Travel Card&quot; first.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Transit Card Used
                    </label>
                    <select
                      value={selectedTransitCardId}
                      onChange={(e) => setSelectedTransitCardId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-cyan-500"
                    >
                      {transitCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nickname} — Balance: {formatCurrency(c.transitBalance || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "metro", label: "Metro Train", icon: Train },
                      { id: "bus", label: "City Bus", icon: Bus },
                      { id: "shuttle", label: "Campus Shuttle", icon: Train },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = transitRideMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setTransitRideMode(m.id as TransitMode)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSel
                              ? "bg-cyan-500 text-neutral-950 font-bold border-cyan-400 shadow-xs"
                              : "bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        From Station / Stop
                      </label>
                      <input
                        type="text"
                        value={fromStation}
                        onChange={(e) => setFromStation(e.target.value)}
                        placeholder="Origin station or stop"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        To Station / Stop
                      </label>
                      <input
                        type="text"
                        value={toStation}
                        onChange={(e) => setToStation(e.target.value)}
                        placeholder="Destination station or stop"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Line / Route Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={routeNumber}
                      onChange={(e) => setRouteNumber(e.target.value)}
                      placeholder="Line or bus route"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STANDARD DESCRIPTION */}
          {expenseSubtype !== "transit_ride" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  expenseSubtype === "transit_recharge"
                    ? "Transit card top-up"
                    : type === "expense"
                    ? "What did you spend on?"
                    : type === "income"
                    ? "Source of income"
                    : "Transfer between accounts"
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Category (if not transfer & not transit mode) */}
          {type !== "transfer" && expenseSubtype === "standard" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              >
                {currentCategories.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
                {!currentCategories.includes(category) && category && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>
          )}

          {/* Account Selection (Standard mode) */}
          {expenseSubtype === "standard" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {type === "transfer"
                    ? "From Account"
                    : type === "income"
                    ? "Deposit Into"
                    : "Paid From Account"}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                >
                  {accounts.length === 0 ? (
                    <option value="">No accounts yet</option>
                  ) : (
                    accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {type === "transfer" ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    To Account
                  </label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                  >
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatCurrency(a.balance)})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Payment Instrument
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note"
                className="w-full px-3.5 py-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isMutating}
              className={`flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-60 ${
                type === "income"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950"
                  : type === "transfer"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                  : expenseSubtype === "transit_ride"
                  ? "bg-cyan-500 hover:bg-cyan-400 text-neutral-950"
                  : "bg-rose-500 hover:bg-rose-400 text-white"
              }`}
            >
              {(submitting || isMutating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isEditing
                  ? "Save Changes"
                  : expenseSubtype === "transit_recharge"
                  ? "Recharge Card"
                  : expenseSubtype === "transit_ride"
                  ? "Record Commute Ride"
                  : type === "income"
                  ? "Add Income"
                  : type === "transfer"
                  ? "Complete Transfer"
                  : "Record Expense"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
