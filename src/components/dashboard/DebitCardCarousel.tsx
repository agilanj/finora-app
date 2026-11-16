import React, { useMemo, useState, useRef } from "react";
import { useFinance } from "../../context/FinanceContext";
import { Account, VirtualCard } from "../../types/finance";
import { TransitCardDetailModal } from "../cards/TransitCardDetailModal";
import { AddTransactionModal } from "../transactions/AddTransactionModal";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  ArrowRightLeft,
  Train,
  CreditCard,
  Wallet,
  Wifi,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Star,
} from "lucide-react";

interface DebitCardCarouselProps {
  onAddAccount: () => void;
  onOpenTransfer: (sourceAccountId?: string) => void;
  onEditAccount: (account: Account) => void;
}

type WalletDeckItem =
  | { kind: "account"; id: string; account: Account; dialCategory: "cash" | "bank" }
  | { kind: "transit"; id: string; card: VirtualCard; dialCategory: "transit" };

export const DebitCardCarousel: React.FC<DebitCardCarouselProps> = ({
  onAddAccount,
  onOpenTransfer,
}) => {
  const {
    accounts,
    cards,
    userProfile,
    formatCurrency,
    toggleHideAccountBalance,
    editAccount,
    setActiveTab,
  } = useFinance();

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);
  const transitCards = useMemo(() => cards.filter((c) => c.cardType === "transit"), [cards]);

  // Unified Wallet Deck: Bank Accounts + Transit Card(s) + Cash Wallet
  const deckItems: WalletDeckItem[] = useMemo(() => {
    const bankItems: WalletDeckItem[] = activeAccounts
      .filter((a) => a.accountType !== "cash" && !a.name.toLowerCase().includes("cash"))
      .map((a) => ({ kind: "account", id: a.id, account: a, dialCategory: "bank" }));

    const cashItems: WalletDeckItem[] = activeAccounts
      .filter((a) => a.accountType === "cash" || a.name.toLowerCase().includes("cash"))
      .map((a) => ({ kind: "account", id: a.id, account: a, dialCategory: "cash" }));

    const transitItems: WalletDeckItem[] = transitCards.map((c) => ({
      kind: "transit",
      id: c.id,
      card: c,
      dialCategory: "transit",
    }));

    return [...bankItems, ...transitItems, ...cashItems];
  }, [activeAccounts, transitCards]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const safeIndex = deckItems.length > 0 ? Math.min(activeIndex, deckItems.length - 1) : 0;
  const activeItem = deckItems[safeIndex];

  // Modals for Transit Card interactivity
  const [selectedTransitCard, setSelectedTransitCard] = useState<VirtualCard | null>(null);
  const [transitTxModal, setTransitTxModal] = useState<{
    open: boolean;
    mode: "transit_recharge" | "transit_ride";
    cardId: string;
  }>({ open: false, mode: "transit_ride", cardId: "" });

  // Touch swipe tracking for mobile ergonomics
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || deckItems.length === 0) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 36) {
      if (diff > 0) {
        setActiveIndex((prev) => (prev + 1) % deckItems.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + deckItems.length) % deckItems.length);
      }
    }
    touchStartX.current = null;
  };

  const jumpToDialCategory = (category: "transit" | "bank" | "cash") => {
    const foundIdx = deckItems.findIndex((item) => item.dialCategory === category);
    if (foundIdx !== -1) {
      setActiveIndex(foundIdx);
    } else if (category === "transit") {
      onAddAccount();
    }
  };

  const getDeckCardStyle = (item: WalletDeckItem, index: number) => {
    if (item.kind === "transit") {
      return {
        gradient: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 52%, #1e1b4b 100%)",
        badge: "TRANSIT NFC",
        brand: "NCMC",
      };
    }

    const acc = item.account;
    const code = (acc.bankCode || "").toUpperCase();
    const name = (acc.bankName || acc.name || "").toLowerCase();

    if (acc.accountType === "cash" || name.includes("cash")) {
      return {
        gradient: "linear-gradient(135deg, #10b981 0%, #047857 55%, #022c22 100%)",
        badge: "CASH",
        brand: "WALLET",
      };
    }
    if (code.includes("SBI") || name.includes("state bank")) {
      return {
        gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #1e1b4b 100%)",
        badge: "VISA",
        brand: "SBI",
      };
    }
    if (code.includes("HDFC") || name.includes("hdfc")) {
      return {
        gradient: "linear-gradient(135deg, #6d28d9 0%, #4338ca 55%, #1e1b4b 100%)",
        badge: "VISA",
        brand: "HDFC",
      };
    }
    if (code.includes("ICICI") || name.includes("icici")) {
      return {
        gradient: "linear-gradient(135deg, #ec4899 0%, #7c3aed 55%, #3b0764 100%)",
        badge: "MASTERCARD",
        brand: "ICICI",
      };
    }
    if (code.includes("AXIS") || name.includes("axis")) {
      return {
        gradient: "linear-gradient(135deg, #9d174d 0%, #581c87 60%, #1e1b4b 100%)",
        badge: "RUPAY",
        brand: "AXIS",
      };
    }
    const fallbackGradients = [
      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #1e1b4b 100%)",
      "linear-gradient(135deg, #1e293b 0%, #312e81 55%, #090d16 100%)",
    ];
    return {
      gradient: fallbackGradients[index % fallbackGradients.length],
      badge: "DEBIT",
      brand: acc.bankCode || "FINORA",
    };
  };

  // Dial knob angle according to current active category
  const currentDialCategory = activeItem?.dialCategory || "bank";
  const dialKnobAngle =
    currentDialCategory === "transit" ? -52 : currentDialCategory === "bank" ? 0 : 52;

  return (
    <div className="w-full space-y-5 select-none">
      {/* Top Wallet Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
            Wallet & Accounts
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Swipe or spin the dial to switch banks, cash & transit pass
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              deckItems.length > 0 &&
              setActiveIndex((prev) => (prev - 1 + deckItems.length) % deckItems.length)
            }
            className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              deckItems.length > 0 && setActiveIndex((prev) => (prev + 1) % deckItems.length)
            }
            className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAddAccount}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {deckItems.length === 0 ? (
        <div className="w-full p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center flex flex-col items-center justify-center">
          <Wallet className="w-8 h-8 text-indigo-400 mb-2 opacity-80" />
          <h4 className="text-xs font-bold text-[var(--text-primary)]">No accounts or transit cards</h4>
          <button
            onClick={onAddAccount}
            className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white cursor-pointer"
          >
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* LEFT / TOP: FANNED ARC CARD CAROUSEL (Matches Image 8 Fanned Deck!) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-[210px] sm:h-[240px] md:h-[255px] flex items-center justify-center overflow-hidden pt-4"
            >
              {/* Soft royal glow behind active fanned card */}
              <div className="absolute inset-x-12 top-6 bottom-6 rounded-full bg-gradient-to-r from-indigo-600/20 via-violet-500/25 to-blue-500/20 blur-3xl pointer-events-none" />

              {deckItems.map((item, idx) => {
                // Shortest circular distance for wrap-around fanning
                let offset = idx - safeIndex;
                const half = Math.floor(deckItems.length / 2);
                if (offset > half) offset -= deckItems.length;
                if (offset < -half) offset += deckItems.length;

                const absOffset = Math.abs(offset);
                const isActive = offset === 0;
                const isVisible = absOffset <= 2;

                if (!isVisible) return null;

                const styleInfo = getDeckCardStyle(item, idx);
                const rotateDeg = offset * 10;
                const translateX = offset * 56; // Compact smooth fan spread across viewports
                const translateY = isActive ? -10 : absOffset * 14;
                const scale = isActive ? 1.05 : Math.max(0.84, 1 - absOffset * 0.08);
                const zIndex = 30 - absOffset * 10;

                const title =
                  item.kind === "transit"
                    ? item.card.nickname
                    : item.account.bankName || item.account.name;
                const subtitle =
                  item.kind === "transit"
                    ? item.card.holderName || userProfile.name
                    : userProfile.name;
                const balanceVal =
                  item.kind === "transit"
                    ? item.card.transitBalance ?? 0
                    : item.account.balance;
                const isHidden = item.kind === "account" && item.account.isHidden;
                const validText =
                  item.kind === "transit"
                    ? item.card.validTill || "Active"
                    : `•••• ${item.account.maskedNumber.slice(-4)}`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isActive && item.kind === "transit") {
                        setSelectedTransitCard(item.card);
                      } else {
                        setActiveIndex(idx);
                      }
                    }}
                    style={{
                      background: styleInfo.gradient,
                      transform: `translateX(${translateX}%) translateY(${translateY}px) rotate(${rotateDeg}deg) scale(${scale})`,
                      zIndex,
                    }}
                    className={`absolute w-[142px] sm:w-[168px] md:w-[182px] h-[175px] sm:h-[205px] md:h-[218px] rounded-2xl p-3.5 sm:p-4 text-left text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between overflow-hidden cursor-pointer border ${
                      isActive
                        ? "border-white/40 shadow-[0_22px_50px_-10px_rgba(79,70,229,0.65)] ring-1 ring-white/25"
                        : "border-white/15 shadow-xl opacity-85 hover:opacity-100"
                    }`}
                  >
                    {/* Silk aurora wave reflection overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-45"
                      style={{
                        background:
                          "radial-gradient(circle at 80% 15%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.02) 48%, transparent 72%)",
                      }}
                    />

                    {/* Card Top: Network / Badge + NFC Icon */}
                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-white/95 truncate">
                        {styleInfo.brand}
                      </span>
                      {item.kind === "transit" ? (
                        <Train className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                      ) : (
                        <Wifi className="w-3.5 h-3.5 text-white/70 rotate-90 shrink-0" />
                      )}
                    </div>

                    {/* Middle: Cardholder & Bank Name */}
                    <div className="relative z-10 my-auto space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-white/90 truncate">
                        {subtitle}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-white/70 truncate">
                        {title}
                      </div>
                    </div>

                    {/* Bottom: Balance & Masked/Valid Footer */}
                    <div className="relative z-10 pt-2 border-t border-white/15">
                      <div className="text-sm sm:text-base font-extrabold tracking-tight tabular-nums text-white leading-tight">
                        {isHidden ? "••••••" : formatCurrency(balanceVal)}
                      </div>
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-white/70 mt-1 font-medium">
                        <span>{validText}</span>
                        <span className="uppercase tracking-wider">{styleInfo.badge}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Card Pagination Dots */}
            <div className="flex items-center gap-1.5 mt-1">
              {deckItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === safeIndex
                      ? "w-6 bg-indigo-500"
                      : "w-1.5 bg-[var(--text-secondary)]/30 hover:bg-indigo-400/60"
                  }`}
                  aria-label={`Select card ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT / BOTTOM: FUTURISTIC ROTARY DIAL + ACTIVE CARD CONTROLS */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            {/* Circular Futuristic Dial (Inspired by Image 8) */}
            <div className="relative w-[220px] h-[220px] sm:w-[244px] sm:h-[244px] rounded-full p-3 flex items-center justify-center bg-gradient-to-b from-[#0f1326] to-[#060812] border border-indigo-400/25 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.12)]">
              {/* Rotating Orbital Ring with Glowing Knob at Top */}
              <div
                className="absolute inset-1.5 rounded-full border border-indigo-400/20 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
                style={{ transform: `rotate(${dialKnobAngle}deg)` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-2 border-white/80 shadow-[0_0_14px_rgba(129,140,248,0.95)]" />
              </div>

              {/* Inner Dial Selector Menu */}
              <div className="relative z-10 w-[164px] sm:w-[180px] rounded-2xl bg-[#0B0E1D]/90 border border-white/10 p-2 space-y-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => jumpToDialCategory("transit")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentDialCategory === "transit"
                      ? "bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-white border border-cyan-400/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Train className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Transit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToDialCategory("bank")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentDialCategory === "bank"
                      ? "bg-gradient-to-r from-indigo-500/30 to-violet-500/30 text-white border border-indigo-400/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Bank & Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToDialCategory("cash")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentDialCategory === "cash"
                      ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-white border border-emerald-400/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Cash Wallet</span>
                </button>
              </div>
            </div>

            {/* Active Item Action Bar */}
            {activeItem && activeItem.kind === "transit" ? (
              <div className="w-full p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {activeItem.card.nickname}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                      {activeItem.card.provider} · Balance:{" "}
                      <span className="font-bold text-cyan-400 tabular-nums">
                        {formatCurrency(activeItem.card.transitBalance ?? 0)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTransitCard(activeItem.card)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/25 transition-colors cursor-pointer shrink-0"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTransitTxModal({
                        open: true,
                        mode: "transit_ride",
                        cardId: activeItem.card.id,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Tap Ride</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTransitTxModal({
                        open: true,
                        mode: "transit_recharge",
                        cardId: activeItem.card.id,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Recharge</span>
                  </button>
                </div>
              </div>
            ) : (
              activeItem &&
              activeItem.kind === "account" && (
                <div className="w-full p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate flex items-center gap-1.5">
                        <span>{activeItem.account.name}</span>
                        {activeItem.account.isDefault && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {activeItem.account.bankName} · {activeItem.account.maskedNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleHideAccountBalance(activeItem.account.id)}
                      className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      title={activeItem.account.isHidden ? "Show balance" : "Hide balance"}
                    >
                      {activeItem.account.isHidden ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => onOpenTransfer(activeItem.account.id)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editAccount(activeItem.account.id, { isDefault: true })}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-400/40 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Primary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("accounts")}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-400/40 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Touchable Transit Card Detail & Trip Ledger Modal */}
      <TransitCardDetailModal
        card={selectedTransitCard}
        isOpen={!!selectedTransitCard}
        onClose={() => setSelectedTransitCard(null)}
        onOpenRechargeModal={(cardId) =>
          setTransitTxModal({ open: true, mode: "transit_recharge", cardId })
        }
        onOpenRideModal={(cardId) =>
          setTransitTxModal({ open: true, mode: "transit_ride", cardId })
        }
      />

      {/* Quick Add Transit Ride or Recharge Modal */}
      {transitTxModal.open && (
        <AddTransactionModal
          isOpen={transitTxModal.open}
          onClose={() => setTransitTxModal((prev) => ({ ...prev, open: false }))}
          initialMode={transitTxModal.mode}
          initialTransitCardId={transitTxModal.cardId}
        />
      )}
    </div>
  );
};
