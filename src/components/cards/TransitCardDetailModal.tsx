import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { VirtualCard, TransitMode } from "../../types/finance";
import {
  Train,
  Bus,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wifi,
  X,
  Clock,
  MapPin,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface TransitCardDetailModalProps {
  card: VirtualCard | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRechargeModal: (cardId: string) => void;
  onOpenRideModal: (cardId: string) => void;
}

export const TransitCardDetailModal: React.FC<TransitCardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  onOpenRechargeModal,
  onOpenRideModal,
}) => {
  const { transitTrips, formatCurrency } = useFinance();
  const [filterMode, setFilterMode] = useState<"all" | "rides" | "recharges">("all");

  if (!isOpen || !card) return null;

  // Filter history for this specific card
  const cardTrips = transitTrips.filter((t) => t.cardId === card.id);

  const filteredTrips = cardTrips.filter((t) => {
    if (filterMode === "rides") return t.type === "ride";
    if (filterMode === "recharges") return t.type === "recharge";
    return true;
  });

  const totalSpentOnTransit = cardTrips
    .filter((t) => t.type === "ride")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRecharged = cardTrips
    .filter((t) => t.type === "recharge")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border-color)] shadow-2xl p-6 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs shrink-0">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  {card.nickname}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  NFC Enabled
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {card.provider} · Serial: {card.fullNumber || `•••• ${card.lastFour}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Stored Card Balance Banner */}
        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#0c1f24] via-[#10333d] to-[#071317] border border-cyan-400/30 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-200/80 font-semibold mb-1">
                <Wifi className="w-3.5 h-3.5 rotate-90" />
                <span>Current Travel Balance</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight tabular-nums">
                {formatCurrency(card.transitBalance ?? 0)}
              </div>
              <div className="text-[10px] text-cyan-300/70 mt-1">
                Auto-deducted on bus & metro gate tap-in/out
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => {
                  onClose();
                  onOpenRideModal(card.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-sm cursor-pointer"
              >
                <Train className="w-3.5 h-3.5" />
                <span>Record Ride</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenRechargeModal(card.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Recharge</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cyan-400/20 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-cyan-200/60 block">Total Rides Spent</span>
              <span className="font-bold text-white tabular-nums">
                {formatCurrency(totalSpentOnTransit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-cyan-200/60 block">Total Added</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {formatCurrency(totalRecharged)}
              </span>
            </div>
          </div>
        </div>

        {/* History Ledger Section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Travel & Money History ({cardTrips.length})
            </h4>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)]">
              {[
                { id: "all", label: "All" },
                { id: "rides", label: "Rides" },
                { id: "recharges", label: "Top-Ups" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterMode(pill.id as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    filterMode === pill.id
                      ? "bg-amber-500 text-neutral-950 shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Trips */}
          <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl bg-[var(--bg-elevated)]/40 overflow-hidden">
            {filteredTrips.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                No travel or recharge logs recorded for this card yet.
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const isRide = trip.type === "ride";

                return (
                  <div
                    key={trip.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isRide
                            ? trip.mode === "bus"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-cyan-500/15 text-cyan-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {isRide ? (
                          trip.mode === "bus" ? (
                            <Bus className="w-4 h-4" />
                          ) : (
                            <Train className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 truncate">
                          {isRide ? (
                            <span>
                              {trip.fromStation || "Origin"} → {trip.toStation || "Destination"}
                            </span>
                          ) : (
                            <span>Transit Card Recharge</span>
                          )}

                          {trip.routeNumber && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-[var(--text-secondary)] font-mono">
                              {trip.routeNumber}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                          <span>{trip.date}</span>
                          <span>·</span>
                          <span>{trip.time}</span>
                          {trip.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate">{trip.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold tabular-nums ${
                          isRide ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {isRide ? `-${formatCurrency(trip.amount)}` : `+${formatCurrency(trip.amount)}`}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono tabular-nums">
                        Bal: {formatCurrency(trip.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Close */}
        <div className="mt-5 pt-3 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
