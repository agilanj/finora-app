import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { VirtualCard, CardType } from "../../types/finance";
import {
  Wallet,
  Plus,
  CreditCard,
  Wifi,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  X,
} from "lucide-react";

export const WalletView: React.FC = () => {
  const { cards, accounts, addVirtualCard, updateVirtualCard, deleteVirtualCard } = useFinance();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [nickname, setNickname] = useState("");
  const [provider, setProvider] = useState("RuPay");
  const [cardType, setCardType] = useState<CardType>("debit");
  const [lastFour, setLastFour] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("08");
  const [expiryYear, setExpiryYear] = useState("29");
  const [linkedAccountId, setLinkedAccountId] = useState(accounts[0]?.id || "");
  const [cardDesign, setCardDesign] = useState<VirtualCard["cardDesign"]>("platinum_gold");
  const [notes, setNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVirtualCard({
      nickname: nickname.trim() || "Virtual Card",
      provider,
      cardType,
      linkedAccountId,
      lastFour: lastFour.trim() || "0000",
      expiryMonth,
      expiryYear,
      cardDesign,
      status: "active",
      notes: notes.trim(),
    });
    setIsAddOpen(false);
    setNickname("");
    setLastFour("");
  };

  const getDesignClasses = (design: VirtualCard["cardDesign"]) => {
    switch (design) {
      case "platinum_gold":
        return "bg-gradient-to-br from-[#2c271b] via-[#433b28] to-[#1a1710] text-[#F3F0E8] border-amber-300/30";
      case "deep_navy":
        return "bg-gradient-to-br from-[#0c1a30] via-[#162a4d] to-[#081224] text-white border-blue-400/30";
      case "emerald_minimal":
        return "bg-gradient-to-br from-[#06241a] via-[#0b3c2b] to-[#041710] text-emerald-100 border-emerald-400/30";
      case "matte_black":
        return "bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] text-neutral-100 border-neutral-700";
      case "ruby_gradient":
        return "bg-gradient-to-br from-[#3b0d14] via-[#5c1320] to-[#24060b] text-rose-100 border-rose-400/30";
      default:
        return "bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-slate-100 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Virtual Wallet & Card Collection
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
              Visual Organizer
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Organize your physical cards, college transit passes, and payment instruments securely.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Card to Wallet</span>
        </button>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)] font-semibold">
            Privacy & Security Guarantee:
          </strong>{" "}
          FINORA Virtual Wallet is strictly a visual manager for your wallet collection. Never store sensitive card details like CVV, ATM PINs, UPI passwords or unmasked card numbers.
        </div>
      </div>

      {/* Cards Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isFrozen = card.status === "frozen";

          return (
            <div
              key={card.id}
              className={`relative h-52 rounded-2xl p-5 border shadow-xl flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1 ${getDesignClasses(
                card.cardDesign
              )} ${isFrozen ? "opacity-75 grayscale-25" : ""}`}
            >
              {/* Header: Provider & Type */}
              <div className="flex items-start justify-between z-10">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase">
                    {card.nickname}
                  </div>
                  <div className="text-[10px] opacity-70 capitalize mt-0.5">
                    {card.cardType.replace("_", " ")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold tracking-widest uppercase">
                    {card.provider}
                  </span>
                  <button
                    onClick={() =>
                      updateVirtualCard(card.id, {
                        status: isFrozen ? "active" : "frozen",
                      })
                    }
                    className="p-1 rounded text-white/60 hover:text-white"
                    title={isFrozen ? "Unfreeze card" : "Freeze card"}
                  >
                    {isFrozen ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Middle: EMV Chip & Waves */}
              <div className="flex items-center gap-3 z-10">
                <div className="w-9 h-6 rounded bg-gradient-to-tr from-amber-200 to-amber-400 border border-amber-500/40 shadow-xs flex items-center justify-center">
                  <div className="w-full h-px bg-amber-800/30" />
                </div>
                <Wifi className="w-4 h-4 opacity-50 rotate-90" />
              </div>

              {/* Bottom: Masked Number & Expiry */}
              <div className="z-10 flex items-end justify-between">
                <div>
                  <div className="text-sm font-mono tracking-widest">
                    •••• •••• •••• {card.lastFour}
                  </div>
                  <div className="text-[10px] opacity-60 mt-1 font-mono">
                    EXP: {card.expiryMonth}/{card.expiryYear}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {confirmDeleteId === card.id ? (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteVirtualCard(card.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded bg-black/40 text-white/80 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(card.id)}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-rose-500/30 text-white/70 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add Card to Virtual Wallet
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
                  Card Nickname
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. SBI Global Debit or Campus Pass"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Card Network / Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="RuPay">RuPay</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="SmartChip">SmartChip / NFC Pass</option>
                    <option value="Amex">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Card Type
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="debit">Debit Card</option>
                    <option value="credit">Credit Card</option>
                    <option value="prepaid">Prepaid Card</option>
                    <option value="transit">Transit / Metro Pass</option>
                    <option value="student_id">Student ID / Access Pass</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value)}
                    placeholder="4821"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Expiry MM
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="08"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Expiry YY
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="29"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Card Theme Style
                </label>
                <select
                  value={cardDesign}
                  onChange={(e) => setCardDesign(e.target.value as VirtualCard["cardDesign"])}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  <option value="platinum_gold">Champagne Platinum Gold</option>
                  <option value="deep_navy">Deep Navy Blue</option>
                  <option value="emerald_minimal">Emerald Velvet Green</option>
                  <option value="matte_black">Matte Stealth Black</option>
                  <option value="ruby_gradient">Ruby Gradient</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-md"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
