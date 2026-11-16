import React, { useState, useRef, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { CURRENCIES, BRAND } from "../../config/brand";
import { OccupationType } from "../../types/finance";
import {
  User,
  Coins,
  Shield,
  Trash2,
  Building,
  LogOut,
  Camera,
  Upload,
  MessageSquare,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Info,
  Sliders,
  BellRing,
  Lock,
  HandCoins,
  PiggyBank,
  FileSpreadsheet,
  Sparkles,
  Landmark,
  AlertCircle,
} from "lucide-react";

interface SettingsViewProps {
  onLockApp?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLockApp }) => {
  const {
    userProfile,
    accounts,
    editAccount,
    updateUserProfile,
    clearAllData,
    logoutUser,
    feedbackList,
    submitFeedback,
    setActiveTab,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
    guardrails: true,
    finance: false,
    privacy: false,
    feedback: false,
    credits: false,
    data: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Profile & Preferences Form States
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");
  const [avatarError, setAvatarError] = useState("");
  const [occupation, setOccupation] = useState<OccupationType>(userProfile.occupation);
  const [currencyCode, setCurrencyCode] = useState(userProfile.currency || "INR");
  const [isHostelResident, setIsHostelResident] = useState(userProfile.isHostelResident);
  const [monthlyIncome, setMonthlyIncome] = useState(
    userProfile.monthlyIncomeOrAllowance.toString()
  );
  const [salaryDate, setSalaryDate] = useState(userProfile.salaryOrAllowanceDate.toString());

  // Extra Money-Managing App Settings
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(
    userProfile.defaultPaymentMethod || "UPI"
  );
  const [dailySpendLimit, setDailySpendLimit] = useState(
    (userProfile.dailySpendLimit ?? 0).toString()
  );
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(
    (userProfile.lowBalanceThreshold ?? 0).toString()
  );
  const [enableBudgetAlerts, setEnableBudgetAlerts] = useState(
    userProfile.enableBudgetAlerts ?? true
  );
  const [enableBillReminders, setEnableBillReminders] = useState(
    userProfile.enableBillReminders ?? true
  );
  const [enableRoundUpSavings, setEnableRoundUpSavings] = useState(
    userProfile.enableRoundUpSavings ?? false
  );
  const [hideBalancesOnLaunch, setHideBalancesOnLaunch] = useState(
    userProfile.hideBalancesOnLaunch ?? false
  );
  const [pinDraft, setPinDraft] = useState(userProfile.appPin || "");
  const [pinError, setPinError] = useState("");
  const [savedNotice, setSavedNotice] = useState<string>("");
  const [confirmWipe, setConfirmWipe] = useState(false);

  // Sync if userProfile updates externally
  useEffect(() => {
    setName(userProfile.name);
    setEmail(userProfile.email);
    setAvatarUrl(userProfile.avatarUrl || "");
    setOccupation(userProfile.occupation);
    setCurrencyCode(userProfile.currency || "INR");
    setIsHostelResident(userProfile.isHostelResident);
    setMonthlyIncome(userProfile.monthlyIncomeOrAllowance.toString());
    setSalaryDate(userProfile.salaryOrAllowanceDate.toString());
    setDefaultPaymentMethod(userProfile.defaultPaymentMethod || "UPI");
    setDailySpendLimit((userProfile.dailySpendLimit ?? 0).toString());
    setLowBalanceThreshold((userProfile.lowBalanceThreshold ?? 0).toString());
    setEnableBudgetAlerts(userProfile.enableBudgetAlerts ?? true);
    setEnableBillReminders(userProfile.enableBillReminders ?? true);
    setEnableRoundUpSavings(userProfile.enableRoundUpSavings ?? false);
    setHideBalancesOnLaunch(userProfile.hideBalancesOnLaunch ?? false);
    setPinDraft(userProfile.appPin || "");
  }, [userProfile]);

  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<
    "ui" | "feature" | "bug" | "praise" | "other"
  >("ui");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const showSavedBanner = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(""), 2600);
  };

  const buildMailtoHref = (msg: string, cat: string, stars: number) => {
    const subject = encodeURIComponent(
      `[FINORA Feedback - ${cat.toUpperCase()} (${stars}/5)] from ${userProfile.name || "User"}`
    );
    const body = encodeURIComponent(
      `Rating: ${stars}/5 Stars\nCategory: ${cat}\nUser: ${userProfile.name} (${userProfile.email})\n\nFeedback:\n${msg}`
    );
    return `mailto:${BRAND.creator.email}?subject=${subject}&body=${body}`;
  };

  // Handle Image Upload from device storage with client-side canvas compression (< 60KB)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Please choose an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        try {
          const maxDim = 200;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let compressed = canvas.toDataURL("image/jpeg", 0.78);
            if (compressed.length > 140000) {
              compressed = canvas.toDataURL("image/jpeg", 0.55);
            }
            setAvatarUrl(compressed);
            await updateUserProfile({ avatarUrl: compressed });
            showSavedBanner("Profile photo updated.");
          }
        } catch {
          setAvatarError("Could not process image. Please try another JPG or PNG.");
        }
      };
      img.onerror = () => {
        setAvatarError("Unsupported image format. Please choose a valid JPG or PNG.");
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl("");
    await updateUserProfile({ avatarUrl: "" });
    showSavedBanner("Profile photo removed.");
  };

  // Save Profile, Guardrails, Alerts & Privacy Preferences
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    const cleanPin = pinDraft.trim();
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      setPinError("Security PIN must be exactly 4 numeric digits (or leave blank to disable).");
      setOpenSections((prev) => ({ ...prev, privacy: true }));
      return;
    }

    const curr = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

    await updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      avatarUrl,
      occupation,
      currency: curr.code,
      currencySymbol: curr.symbol,
      isHostelResident,
      monthlyIncomeOrAllowance: parseFloat(monthlyIncome) || 0,
      salaryOrAllowanceDate: Math.min(31, Math.max(1, parseInt(salaryDate) || 1)),
      defaultPaymentMethod,
      dailySpendLimit: Math.max(0, parseFloat(dailySpendLimit) || 0),
      lowBalanceThreshold: Math.max(0, parseFloat(lowBalanceThreshold) || 0),
      enableBudgetAlerts,
      enableBillReminders,
      enableRoundUpSavings,
      hideBalancesOnLaunch,
      appPin: cleanPin,
    });

    showSavedBanner("All preferences & money guardrails saved.");
  };

  // Submit Feedback to agilan4413@gmail.com
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    const cleanComment = feedbackComment.trim();
    await submitFeedback({
      category: feedbackCategory,
      rating: feedbackRating,
      comment: cleanComment,
    });

    const mailtoLink = buildMailtoHref(cleanComment, feedbackCategory, feedbackRating);
    const a = document.createElement("a");
    a.href = mailtoLink;
    a.click();

    setFeedbackComment("");
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 5000);
  };

  const primaryAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const currencySym =
    CURRENCIES.find((c) => c.code === currencyCode)?.symbol ||
    userProfile.currencySymbol ||
    "₹";

  return (
    <div className="space-y-6 pb-24 md:pb-16 max-w-4xl mx-auto animate-fade-up">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
            Menu & Settings
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            All finance tools, spending guardrails, security PIN, and preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 hover:bg-indigo-500/25 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>About FINORA</span>
        </button>
      </div>

      {/* Mobile-First Quick Navigation Hub to Every Section */}
      <section className="p-4 sm:p-5 rounded-3xl glass-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Finance Tools & Shortcuts
          </h2>
          <span className="text-[10px] text-indigo-400 font-semibold">1-Tap Access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("loans")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-indigo-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <HandCoins className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">Borrow & Lend</div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">Dues & Friends</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("budgets")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-emerald-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <PiggyBank className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">Budgets & Goals</div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">Caps & Savings</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-violet-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">Export Reports</div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">PDF / Excel / CSV</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-fuchsia-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">AI Assistant</div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">Financial Insights</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(isHostelResident ? "hostel" : "accounts")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-blue-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            {isHostelResident ? (
              <Building className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <Landmark className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                {isHostelResident ? "Hostel Living" : "All Accounts"}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">
                {isHostelResident ? "Mess & Room Split" : "Manage Balances"}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] hover:border-amber-400/40 border border-[var(--border-color)] text-left flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">About & Credits</div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">Usage & Creator</div>
            </div>
          </button>
        </div>
      </section>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* ================= SECTION 1: PROFILE & IDENTITY ================= */}
        <div className="rounded-3xl glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("profile")}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Profile & Currency
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Identity, role, primary currency & photo upload
                </p>
              </div>
            </div>
            {openSections.profile ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          {openSections.profile && (
            <div className="p-5 pt-0 space-y-5 border-t border-[var(--border-color)] mt-1">
              {/* Profile Image Upload Zone */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] mt-3">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 text-indigo-400 font-black text-xl flex items-center justify-center shadow-md">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-500 cursor-pointer"
                    title="Upload new image"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    Profile Photo
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Upload any JPG or PNG photo under 2MB from your device.
                  </div>
                  {avatarError && (
                    <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 justify-center sm:justify-start">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{avatarError}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1.5 text-[11px] font-medium rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Occupation / Role
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value as OccupationType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  >
                    <option value="college_student">College Student</option>
                    <option value="hostel_student">Hostel Resident Student</option>
                    <option value="school_student">School Student</option>
                    <option value="working_professional">Working Professional</option>
                    <option value="freelancer">Freelancer / Creator</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="other">Individual / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Primary Currency
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) – {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hostel Living Mode Toggle */}
              <label className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      Hostel & Room Living Features
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      Mess advance, room utility splits, and shared expenses
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isHostelResident}
                  onChange={(e) => setIsHostelResident(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* ================= SECTION 2: PAYMENT DEFAULTS & SPENDING GUARDRAILS ================= */}
        <div className="rounded-3xl glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("guardrails")}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Payment Defaults & Spending Guardrails
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Default payment mode, primary account, daily spend cap, low balance & round-ups
                </p>
              </div>
            </div>
            {openSections.guardrails ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          {openSections.guardrails && (
            <div className="p-5 pt-0 space-y-4 border-t border-[var(--border-color)] mt-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Default Payment Instrument
                  </label>
                  <select
                    value={defaultPaymentMethod}
                    onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Primary Default Account
                  </label>
                  <select
                    value={primaryAccount?.id || ""}
                    onChange={async (e) => {
                      if (e.target.value) {
                        await editAccount(e.target.value, { isDefault: true });
                        showSavedBanner("Primary default account updated.");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                  >
                    {accounts.length === 0 ? (
                      <option value="">No accounts created yet</option>
                    ) : (
                      accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bankName})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Daily Spend Limit Alert ({currencySym})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={dailySpendLimit}
                    onChange={(e) => setDailySpendLimit(e.target.value)}
                    placeholder="e.g. 1500 (0 to disable)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold tabular-nums focus:outline-none focus:border-indigo-400"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {["0", "500", "1500", "3000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDailySpendLimit(preset)}
                        className={`px-2 py-0.5 text-[10px] rounded-lg border cursor-pointer transition-colors ${
                          dailySpendLimit === preset
                            ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-300 font-bold"
                            : "bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {preset === "0" ? "Off" : `${currencySym}${preset}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Low Account Balance Warning ({currencySym})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    placeholder="e.g. 500 (0 to disable)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold tabular-nums focus:outline-none focus:border-indigo-400"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {["0", "250", "500", "1000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLowBalanceThreshold(preset)}
                        className={`px-2 py-0.5 text-[10px] rounded-lg border cursor-pointer transition-colors ${
                          lowBalanceThreshold === preset
                            ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-300 font-bold"
                            : "bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {preset === "0" ? "Off" : `${currencySym}${preset}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Auto Round-Up Micro-Savings
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Automatically logs spare change (nearest {currencySym}10) from expenses into your top Savings Goal
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRoundUpSavings}
                  onChange={(e) => setEnableRoundUpSavings(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 cursor-pointer shrink-0"
                />
              </label>
            </div>
          )}
        </div>

        {/* ================= SECTION 3: FINANCIAL CADENCE & SMART ALERTS ================= */}
        <div className="rounded-3xl glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("finance")}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Financial Cadence & Smart Alerts
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Monthly allowance, payday date, budget alerts & bill reminders
                </p>
              </div>
            </div>
            {openSections.finance ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          {openSections.finance && (
            <div className="p-5 pt-0 space-y-4 border-t border-[var(--border-color)] mt-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Monthly Allowance / Salary ({currencySym})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-400 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Credit Day of Month (1 - 31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">
                        Budget 80% Threshold Alerts
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Notify when category expenses cross 80% of monthly limit
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBudgetAlerts}
                    onChange={(e) => setEnableBudgetAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 cursor-pointer shrink-0"
                  />
                </label>

                <label className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <BellRing className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">
                        Bill, Subscription & Loan Reminders
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Highlight upcoming rent, renewals, and due dates in bell panel
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBillReminders}
                    onChange={(e) => setEnableBillReminders(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 4: SECURITY & PRIVACY LOCK ================= */}
        <div className="rounded-3xl glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("privacy")}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Security & Privacy Lock
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Auto-hide dashboard balances & 4-digit PIN app lock
                </p>
              </div>
            </div>
            {openSections.privacy ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          {openSections.privacy && (
            <div className="p-5 pt-0 space-y-3 border-t border-[var(--border-color)] mt-1 text-xs">
              <label className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between mt-3 cursor-pointer">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    Auto-Hide Balances on Launch
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Masks cash and total account amounts until you tap Show
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hideBalancesOnLaunch}
                  onChange={(e) => {
                    setHideBalancesOnLaunch(e.target.checked);
                    updateUserProfile({ hideBalancesOnLaunch: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>4-Digit App Passcode (PIN)</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {userProfile.appPin
                        ? "PIN lock is active. Protects FINORA on app open."
                        : "Leave blank to disable, or enter 4 digits to enable lock screen."}
                    </div>
                  </div>

                  {userProfile.appPin && onLockApp && (
                    <button
                      type="button"
                      onClick={onLockApp}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-bold text-[11px] hover:bg-indigo-500/30 transition-colors cursor-pointer shrink-0"
                    >
                      Lock Now
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinDraft}
                    onChange={(e) => {
                      setPinError("");
                      setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 4));
                    }}
                    placeholder="Enter 4 digits (e.g. 2580)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold tracking-[0.25em] tabular-nums focus:outline-none focus:border-indigo-400"
                  />
                  {pinDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setPinDraft("");
                        setPinError("");
                        updateUserProfile({ appPin: "" });
                        showSavedBanner("App PIN lock disabled.");
                      }}
                      className="px-3 py-2 rounded-xl text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 cursor-pointer"
                    >
                      Disable PIN
                    </button>
                  )}
                </div>

                {pinError && (
                  <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md cursor-pointer active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* ================= SECTION 5: FEEDBACK (ROUTED TO agilan4413@gmail.com) ================= */}
      <div className="rounded-3xl glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("feedback")}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Feedback & Suggestions
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Delivered directly to {BRAND.creator.email}
              </p>
            </div>
          </div>
          {openSections.feedback ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>

        {openSections.feedback && (
          <div className="p-5 pt-0 space-y-4 border-t border-[var(--border-color)] mt-1">
            {feedbackSubmitted && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Feedback recorded & prepared for {BRAND.creator.email}.</span>
                </div>
                <a
                  href={buildMailtoHref(
                    feedbackList[0]?.comment || "App Feedback",
                    feedbackList[0]?.category || feedbackCategory,
                    feedbackList[0]?.rating || feedbackRating
                  )}
                  className="underline font-bold"
                >
                  Send via Email App
                </a>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs mt-3">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Rate FINORA
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-[var(--text-secondary)]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "ui", label: "UI & Design" },
                  { id: "feature", label: "Feature Request" },
                  { id: "bug", label: "Bug Report" },
                  { id: "praise", label: "Appreciation" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id as typeof feedbackCategory)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      feedbackCategory === cat.id
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold border-indigo-400"
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
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={`Write your feedback to be sent to ${BRAND.creator.email}...`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Receiver: {BRAND.creator.email}
                </span>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-colors shadow-sm cursor-pointer"
                >
                  Send Feedback
                </button>
              </div>
            </form>

            {feedbackList.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                <div className="text-[11px] font-bold text-[var(--text-secondary)]">
                  Submitted History ({feedbackList.length})
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {feedbackList.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400 capitalize">
                          {fb.category} ({fb.rating}★)
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {fb.submittedAt}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-primary)]">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= SECTION 6: CREATOR CREDITS & ABOUT ================= */}
      <div className="rounded-3xl glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("credits")}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Credits & Creator
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Created by {BRAND.creator.name} · GitHub, LinkedIn & project purpose
              </p>
            </div>
          </div>
          {openSections.credits ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>

        {openSections.credits && (
          <div className="p-5 pt-0 space-y-4 border-t border-[var(--border-color)] mt-1 text-xs">
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] mt-3 space-y-2">
              <div className="font-bold text-[var(--text-primary)]">
                About FINORA & Benefits
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                FINORA is built to give students, hostelers, commuters, and young professionals a calm, portable, and powerful financial hub—unifying cash in hand, multiple bank accounts, transit smart cards, budgets, and bank-ready statements in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={BRAND.creator.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-indigo-400/50 flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Github className="w-4 h-4 shrink-0" />
                  <span className="font-bold truncate">github.com/agilanj</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              </a>

              <a
                href={BRAND.creator.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-blue-400/50 flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-bold truncate">linkedin.com/in/agilanj</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              </a>

              <a
                href={`mailto:${BRAND.creator.email}`}
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-emerald-400/50 flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold truncate">{BRAND.creator.email}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ================= SECTION 7: DATA MANAGEMENT & SESSION (NO DEMO RESET) ================= */}
      <div className="rounded-3xl glass-card border border-rose-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("data")}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-rose-400">
                Data & Session Controls
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Clear stored records or sign out
              </p>
            </div>
          </div>
          {openSections.data ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>

        {openSections.data && (
          <div className="p-5 pt-0 space-y-4 border-t border-[var(--border-color)] mt-1 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <div>
                <div className="font-semibold text-rose-400">
                  Clear All Stored Records
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Permanently wipes all cloud records from your FINORA account.
                </div>
              </div>

              {!confirmWipe ? (
                <button
                  type="button"
                  onClick={() => setConfirmWipe(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(false)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await clearAllData();
                      setConfirmWipe(false);
                      showSavedBanner("All cloud records cleared.");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-bold cursor-pointer hover:bg-rose-600"
                  >
                    Confirm Wipe
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  Account Sign Out
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Sign out to return to the Sign Up and profile setup screen.
                </div>
              </div>

              <button
                type="button"
                onClick={logoutUser}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-400 transition-colors cursor-pointer shrink-0 font-bold"
              >
                <LogOut className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
