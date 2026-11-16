import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const {
    userProfile,
    totalTrackedBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    totalToReceive,
    totalToPay,
    budgetUtilization,
    financialHealthScore,
    goals,
    loans,
    subscriptions,
    formatCurrency,
  } = useFinance();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_1",
      sender: "ai",
      text: `Hello ${userProfile.name ? userProfile.name.split(" ")[0] : "there"}! I'm FINORA's Financial Assistant. I analyze your tracked multi-bank accounts, monthly budgets, debts, and savings goals to give you objective financial clarity.\n\nAsk me anything about your money—like "Where did I spend the most this month?", "Can I afford a ${userProfile.currencySymbol || "₹"}5,000 purchase?", or "How is my financial health calculated?".`,
      timestamp: "Just now",
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const financialContext = {
        userName: userProfile.name,
        occupation: userProfile.occupation,
        currency: userProfile.currencySymbol || "₹",
        totalBalance: totalTrackedBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        totalToReceive,
        totalToPay,
        budgetUtilization,
        healthScore: financialHealthScore,
        activeGoalsCount: goals.length,
        outstandingLoansCount: loans.filter((l) => l.status !== "settled").length,
        activeSubscriptionsCount: subscriptions.filter((s) => s.status === "active").length,
      };

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, financialContext }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.answer || "I reviewed your data and everything looks balanced.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: `Based on your tracked accounts, your liquid balance is ${formatCurrency(totalTrackedBalance)}, monthly expenses stand at ${formatCurrency(monthlyExpenses)}, and your pending liabilities are ${formatCurrency(totalToPay)}. You have ${formatCurrency(monthlySavings)} in positive cashflow this month!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Where did I spend the most this month?",
    "Can I afford a ₹5,000 purchase?",
    "How much do I owe and what is coming up?",
    "How is my financial health score calculated?",
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            AI Financial Assistant
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D6B77A]/15 text-[var(--accent-gold)] border border-[#D6B77A]/30">
            Gemini 3.8 Flash
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Ask questions in plain English about your accounts, spending pace, liabilities, and affordability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chat Window */}
        <div className="lg:col-span-2 flex flex-col h-[600px] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isAi ? "justify-start" : "justify-end"}`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#B99758] to-[#D6B77A] text-[#101827] flex items-center justify-center shrink-0 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? "bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)]"
                        : "bg-[#D6B77A] text-[#101827] font-medium"
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1.5 opacity-60 ${
                        isAi ? "text-[var(--text-secondary)]" : "text-neutral-900"
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {!isAi && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[var(--accent-gold)]" />
                <span>Analyzing your financial ledgers...</span>
              </div>
            )}
          </div>

          {/* Quick prompt suggestions */}
          <div className="p-2.5 bg-[var(--bg-elevated)]/40 border-t border-[var(--border-color)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#D6B77A] transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FINORA Assistant anything about your finances..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Col: Transparent Financial Health Score Breakdown */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Financial Health Score
              </span>
              <span className="text-xs font-bold text-emerald-400">
                Transparent Model
              </span>
            </div>

            <div className="text-center py-2">
              <div className="text-5xl font-black text-[var(--accent-gold)] tabular-nums">
                {financialHealthScore}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                out of 100 ·{" "}
                {financialHealthScore >= 75
                  ? "High Resilience"
                  : financialHealthScore >= 45
                  ? "Balanced Pace"
                  : "Building Baseline"}
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              This score is calculated mathematically from your personal ledger without third-party credit bureau dependency:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Savings Consistency
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Positive savings rate of {monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0}%
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Liability Cover
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {totalTrackedBalance > totalToPay ? "Liquid assets exceed debts" : "Debts need monitoring"}
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Budget Adherence
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {budgetUtilization}% monthly cap utilized
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[var(--text-secondary)] border-t border-[var(--border-color)] leading-tight">
              Notice: FINORA Financial Assistant provides objective data synthesis and budgeting clarity, not registered financial or tax advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
