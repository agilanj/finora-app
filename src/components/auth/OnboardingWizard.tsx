import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { BRAND, CURRENCIES, POPULAR_BANKS } from "../../config/brand";
import { OccupationType } from "../../types/finance";
import {
  Sparkles,
  ArrowRight,
  Check,
  Building,
  GraduationCap,
  Briefcase,
  Laptop,
  Landmark,
  Wallet,
  ShieldCheck,
} from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { userProfile, updateUserProfile, addAccount, setTheme, theme } = useFinance();

  const [step, setStep] = useState(1);

  // Step 1: Personal
  const [name, setName] = useState(userProfile.name || "");
  const [currencyCode, setCurrencyCode] = useState(userProfile.currency || "INR");

  // Step 2: Occupation
  const [occupation, setOccupation] = useState<OccupationType>(userProfile.occupation || "college_student");
  const [isHostelResident, setIsHostelResident] = useState(userProfile.isHostelResident);

  // Step 3: Financial Profile
  const [monthlyIncome, setMonthlyIncome] = useState(
    userProfile.monthlyIncomeOrAllowance > 0 ? userProfile.monthlyIncomeOrAllowance.toString() : ""
  );
  const [allowanceSource, setAllowanceSource] = useState(userProfile.allowanceSource || "");
  const [primaryGoal, setPrimaryGoal] = useState(userProfile.primaryGoal || "");

  // Step 4: First Bank Account
  const [bankId, setBankId] = useState("sbi");
  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  // Step 5: Dashboard Theme
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light">(theme);

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Save all and complete
      const curr = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
      const bank = POPULAR_BANKS.find((b) => b.id === bankId) || POPULAR_BANKS[0];

      await updateUserProfile({
        name: name.trim(),
        occupation,
        isHostelResident,
        currency: curr.code,
        currencySymbol: curr.symbol,
        monthlyIncomeOrAllowance: parseFloat(monthlyIncome) || 0,
        allowanceSource: allowanceSource.trim(),
        primaryGoal: primaryGoal.trim(),
        isOnboarded: true,
      });

      if (accountName.trim()) {
        await addAccount({
          name: accountName.trim(),
          bankName: bank.name,
          bankCode: bank.code,
          accountType: "savings",
          balance: Math.max(0, parseFloat(openingBalance) || 0),
          currency: curr.code,
          maskedNumber: "•••• 0000",
          colorGradient: bank.color,
          isDefault: true,
          isArchived: false,
        });
      }

      setTheme(selectedTheme);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 sm:p-8 text-left">
        {/* Progress Bar & Steps Counter */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#B99758] to-[#F3E2B8] text-[#101827] font-black text-xs flex items-center justify-center">
              F
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Welcome to {BRAND.name}
              </span>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Step {step} of 5 · Personalized Setup
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Skip to Dashboard
          </button>
        </div>

        {/* Step Indicator dots */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-[#D6B77A]" : "bg-[var(--bg-elevated)]"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                What should we call you?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Set up your profile name and standard currency format.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Preferred Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) – {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Occupation */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Select your occupation
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                FINORA tailors recommendations, expense buckets, and dashboards based on your lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "college_student", label: "College Student", icon: GraduationCap },
                { id: "working_professional", label: "Working Professional", icon: Briefcase },
                { id: "freelancer", label: "Freelancer / Creator", icon: Laptop },
                { id: "business_owner", label: "Business Owner", icon: Landmark },
              ].map((occ) => {
                const Icon = occ.icon;
                const isSelected = occupation === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccupation(occ.id as OccupationType)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? "border-[var(--accent-gold)] bg-[#D6B77A]/15 text-[var(--accent-gold)] font-bold shadow-xs"
                        : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{occ.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Occupation specific question: hostel resident */}
            {occupation === "college_student" && (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Are you a hostel resident?
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Enables mess fees, room utilities, and laundry tracking
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isHostelResident}
                  onChange={(e) => setIsHostelResident(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D6B77A] focus:ring-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Financial Profile */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Your Monthly Inflow & Goals
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Set baseline expectations to calibrate your budget utilization.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Expected Monthly Pocket Money or Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Allowance / Income Source
                </label>
                <input
                  type="text"
                  value={allowanceSource}
                  onChange={(e) => setAllowanceSource(e.target.value)}
                  placeholder="Parents, Stipend, Part-time salary"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Primary Savings Target
                </label>
                <input
                  type="text"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder="e.g. Laptop Fund or Emergency Reserve"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: First Bank Account */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Connect your primary account
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Every account appears as an individual card in your Debit-Card Carousel.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Bank / Wallet
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_BANKS.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBankId(b.id);
                        setAccountName(`${b.code} Savings`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        bankId === b.id
                          ? "border-[var(--accent-gold)] bg-[#D6B77A]/15 text-[var(--accent-gold)] font-bold"
                          : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="text-[10px] opacity-75">{b.code}</div>
                      <div className="truncate">{b.name.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Current Opening Balance
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3.5 py-2 font-bold text-sm rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Dashboard Personalization */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Choose your visual theme
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                FINORA features dual-tone glassmorphism in both dark and light modes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "dark", label: "Dark Theme", desc: "Matte black & charcoal" },
                { id: "light", label: "Light Theme", desc: "Minimal premium ivory" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTheme(t.id as "dark" | "light")}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTheme === t.id
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] shadow-xs"
                      : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="text-xs font-bold text-[var(--text-primary)]">{t.label}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>All ready! Your multi-account dashboard and debit carousel are configured.</span>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="pt-6 flex items-center justify-between border-t border-[var(--border-color)] mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-md cursor-pointer"
          >
            <span>{step === 5 ? "Launch FINORA" : "Continue"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
