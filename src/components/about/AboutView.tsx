import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { BRAND } from "../../config/brand";
import {
  ShieldCheck,
  Wallet,
  Train,
  Sparkles,
  FileText,
  Github,
  Linkedin,
  Mail,
  Star,
  Send,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  HeartHandshake,
} from "lucide-react";

export const AboutView: React.FC = () => {
  const { userProfile, feedbackList, submitFeedback } = useFinance();

  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<"ui" | "feature" | "bug" | "praise" | "other">("ui");
  const [comment, setComment] = useState("");
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const buildMailtoHref = (msg: string, cat: string, stars: number) => {
    const subject = encodeURIComponent(`[FINORA Feedback - ${cat.toUpperCase()} (${stars}/5)] from ${userProfile.name || "User"}`);
    const body = encodeURIComponent(
      `Rating: ${stars}/5 Stars\nCategory: ${cat}\nUser: ${userProfile.name} (${userProfile.email})\n\nFeedback Message:\n${msg}`
    );
    return `mailto:${BRAND.creator.email}?subject=${subject}&body=${body}`;
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const cleanComment = comment.trim();
    submitFeedback({
      category,
      rating,
      comment: cleanComment,
    });

    // Trigger direct mailto preparation to agilan4413@gmail.com
    const mailtoLink = buildMailtoHref(cleanComment, category, rating);
    const a = document.createElement("a");
    a.href = mailtoLink;
    a.click();

    setComment("");
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 5000);
  };

  const benefits = [
    {
      icon: Wallet,
      title: "Cash + Multi-Bank Clarity",
      description:
        "Track physical cash in hand alongside multiple savings, UPI, and salary accounts in one unified royal wallet carousel.",
      color: "text-emerald-400 bg-emerald-500/15",
    },
    {
      icon: Train,
      title: "Built-in Transit Smart Ledger",
      description:
        "Keep your Metro and Bus Smart Card directly in your account dial. Recharges deduct from your bank while travel fares deduct from the card itself.",
      color: "text-cyan-400 bg-cyan-500/15",
    },
    {
      icon: Smartphone,
      title: "Mobile-First UPI Ergonomics",
      description:
        "Crafted for rapid daily use on phones, tablets, and laptops with thumb-friendly actions, smooth animations, and green/red cashflow clarity.",
      color: "text-indigo-400 bg-indigo-500/15",
    },
    {
      icon: ShieldCheck,
      title: "Private & Portable Control",
      description:
        "Your personal financial records live securely on your device with instant monochrome PDF and Excel statement exports whenever needed.",
      color: "text-violet-400 bg-violet-500/15",
    },
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto animate-fade-up">
      {/* Hero About Banner */}
      <section className="p-6 sm:p-8 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={BRAND.logoUrl}
            alt={BRAND.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-white p-1.5 shadow-xl shrink-0"
          />
          <div className="space-y-2">
            <h1 className="font-finora text-2xl sm:text-3xl font-black tracking-[0.16em] bg-gradient-to-r from-indigo-400 via-violet-300 to-amber-300 bg-clip-text text-transparent">
              {BRAND.name}
            </h1>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              A futuristic personal finance ecosystem built for everyday clarity, discipline, and control.
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Designed thoughtfully for college students, hostel residents, commuters, freelancers, and working professionals, FINORA replaces scattered notes and cluttered spreadsheets with one calm, fast, and responsive financial companion.
            </p>
          </div>
        </div>
      </section>

      {/* Usage & Key Benefits */}
      <section className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight px-1">
          How FINORA Helps You Every Day
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="p-5 rounded-3xl glass-card space-y-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{b.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Creator & Credits Section */}
      <section className="p-6 rounded-3xl glass-card space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Creator & Project Credits
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Crafted with care by <span className="font-bold text-[var(--text-primary)]">{BRAND.creator.name}</span> · FINORA v{BRAND.version}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <a
            href={BRAND.creator.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-indigo-400/50 transition-all flex items-center justify-between gap-2 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Github className="w-5 h-5 text-[var(--text-primary)] shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-[var(--text-primary)]">GitHub</div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">github.com/agilanj</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-indigo-400 shrink-0" />
          </a>

          <a
            href={BRAND.creator.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-blue-400/50 transition-all flex items-center justify-between gap-2 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Linkedin className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-[var(--text-primary)]">LinkedIn</div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">linkedin.com/in/agilanj</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-blue-400 shrink-0" />
          </a>

          <a
            href={`mailto:${BRAND.creator.email}?subject=${encodeURIComponent("FINORA Inquiry")}`}
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-emerald-400/50 transition-all flex items-center justify-between gap-2 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-[var(--text-primary)]">Direct Email</div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">{BRAND.creator.email}</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-emerald-400 shrink-0" />
          </a>
        </div>
      </section>

      {/* Feedback Directly to agilan4413@gmail.com */}
      <section className="p-6 rounded-3xl glass-card space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
            Send Feedback to the Creator
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            All feedback is routed to <span className="font-semibold text-indigo-400">{BRAND.creator.email}</span> to help refine FINORA.
          </p>
        </div>

        {submittedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Feedback saved & routed to {BRAND.creator.email}.</span>
            </div>
            <a
              href={buildMailtoHref(feedbackList[0]?.comment || "App Feedback", feedbackList[0]?.category || category, feedbackList[0]?.rating || rating)}
              className="underline font-bold text-emerald-200"
            >
              Open Mail App
            </a>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Experience Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--text-secondary)]"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "ui", label: "UI & Design" },
              { id: "feature", label: "Feature Idea" },
              { id: "bug", label: "Bug Report" },
              { id: "praise", label: "Appreciation" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as typeof category)}
                className={`py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                  category === cat.id
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400"
                    : "bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea
            required
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience, feature requests, or suggestions..."
            className="w-full px-3.5 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--text-secondary)]">
              Recipient: {BRAND.creator.email}
            </span>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Feedback</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
