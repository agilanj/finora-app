import React, { useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  Building,
  Utensils,
  Shirt,
  Wifi,
  Coffee,
  Users,
  TrendingDown,
  Sparkles,
} from "lucide-react";

export const HostelModeView: React.FC = () => {
  const {
    transactions,
    userProfile,
    totalTrackedBalance,
    totalToReceive,
    formatCurrency,
    setActiveTab,
  } = useFinance();

  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filter hostel & student related expenses for current month
  const hostelBreakdown = useMemo(() => {
    let messFees = 0;
    let roomRent = 0;
    let laundry = 0;
    let canteenSnacks = 0;
    let wifiUtilities = 0;
    let transport = 0;

    transactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      if (!tx.date.startsWith(currentMonthPrefix)) return;
      const lowerDesc = tx.description.toLowerCase();
      const cat = tx.category.toLowerCase();

      if (lowerDesc.includes("mess") || (cat.includes("hostel") && lowerDesc.includes("food"))) {
        messFees += tx.amount;
      } else if (lowerDesc.includes("rent") || lowerDesc.includes("room")) {
        roomRent += tx.amount;
      } else if (lowerDesc.includes("laundry") || lowerDesc.includes("wash") || lowerDesc.includes("iron")) {
        laundry += tx.amount;
      } else if (
        cat.includes("food") ||
        lowerDesc.includes("chai") ||
        lowerDesc.includes("snack") ||
        lowerDesc.includes("canteen")
      ) {
        canteenSnacks += tx.amount;
      } else if (lowerDesc.includes("wifi") || lowerDesc.includes("router") || lowerDesc.includes("recharge")) {
        wifiUtilities += tx.amount;
      } else if (cat.includes("transport")) {
        transport += tx.amount;
      }
    });

    const totalHostel = messFees + roomRent + laundry + canteenSnacks + wifiUtilities + transport;
    return {
      messFees,
      roomRent,
      laundry,
      canteenSnacks,
      wifiUtilities,
      transport,
      totalHostel,
    };
  }, [transactions, currentMonthPrefix]);

  // Dynamic Daily Allowance Runway calculation based on salaryOrAllowanceDate
  const { daysUntilNextAllowance, nextAllowanceLabel } = useMemo(() => {
    const now = new Date();
    const targetDay = Math.min(28, Math.max(1, userProfile.salaryOrAllowanceDate || 1));
    let nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
    if (nextDate <= now) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
    }
    const diffMs = nextDate.getTime() - now.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const label = nextDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    return { daysUntilNextAllowance: days, nextAllowanceLabel: label };
  }, [userProfile.salaryOrAllowanceDate]);

  const safeDailyBudget = Math.round(
    Math.max(0, totalTrackedBalance) / Math.max(1, daysUntilNextAllowance)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Hostel & Campus Living Mode
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active Mode
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Tailored financial tracking for hostel residents, mess fees, room splits & daily pocket money runway.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("groups")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Users className="w-4 h-4" />
          <span>Roommate Expense Splits</span>
        </button>
      </div>

      {/* Pocket Money Runway & Daily Safe Spend Strip */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#172235] to-[#26364C] border border-[#D6B77A]/30 text-white shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-white/70 font-medium">Safe Daily Spend Ceiling</div>
          <div className="text-3xl font-black text-[var(--accent-gold)] tabular-nums mt-0.5">
            {formatCurrency(safeDailyBudget)}
            <span className="text-xs font-normal text-white/60 ml-1">/ day</span>
          </div>
          <div className="text-[11px] text-white/70 mt-1">
            To stay on track until {nextAllowanceLabel} credit
          </div>
        </div>

        <div>
          <div className="text-xs text-white/70 font-medium">Allowance Runway</div>
          <div className="text-2xl font-extrabold text-white tabular-nums mt-0.5">
            {daysUntilNextAllowance} Days Remaining
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            Next credit on {nextAllowanceLabel} ({formatCurrency(userProfile.monthlyIncomeOrAllowance)})
          </div>
        </div>

        <div>
          <div className="text-xs text-white/70 font-medium">Hostel Spends This Month</div>
          <div className="text-2xl font-extrabold text-white tabular-nums mt-0.5">
            {formatCurrency(hostelBreakdown.totalHostel)}
          </div>
          <div className="text-[11px] text-white/70 mt-1">
            Mess, laundry, canteen & room splits
          </div>
        </div>
      </div>

      {/* Hostel Specific Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Mess Advance & Fees",
            amount: hostelBreakdown.messFees,
            desc: "Monthly mandatory canteen mess dues",
            icon: Utensils,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            title: "Hostel Laundry & Iron",
            amount: hostelBreakdown.laundry,
            desc: "Weekly washing, pressing & dry clean",
            icon: Shirt,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            title: "Canteen Chai & Late Snacks",
            amount: hostelBreakdown.canteenSnacks,
            desc: "Evening tea, study snacks & cafe runs",
            icon: Coffee,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
          {
            title: "Room Wi-Fi & Electricity",
            amount: hostelBreakdown.wifiUtilities,
            desc: "High-speed router & utility splits",
            icon: Wifi,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
          },
          {
            title: "Metro & Campus Commute",
            amount: hostelBreakdown.transport,
            desc: "Smart card recharge & commute fares",
            icon: TrendingDown,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            title: "Room Rent / Maintenance",
            amount: hostelBreakdown.roomRent,
            desc: "Monthly hostel rent & maintenance",
            icon: Building,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-start gap-3.5"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  {item.title}
                </div>
                <div className="text-lg font-extrabold text-[var(--text-primary)] tabular-nums mt-0.5">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Hostel Guidance */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[var(--accent-gold)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)] font-semibold">
            Hostel Runway Insight:
          </strong>{" "}
          {hostelBreakdown.totalHostel === 0
            ? "Record your mess, canteen, laundry, or rent expenses this month to track real hostel spending categories automatically."
            : totalToReceive > 0
            ? `Your tracked hostel spending this month is ${formatCurrency(hostelBreakdown.totalHostel)}, and you have ${formatCurrency(totalToReceive)} pending to collect from friends.`
            : `Your tracked hostel spending this month is ${formatCurrency(hostelBreakdown.totalHostel)}. Keep daily spending within ${formatCurrency(safeDailyBudget)}/day until ${nextAllowanceLabel}.`}
        </div>
      </div>
    </div>
  );
};
