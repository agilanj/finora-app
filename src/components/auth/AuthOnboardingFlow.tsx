import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { useFinance } from "../../context/FinanceContext";
import { BRAND, CURRENCIES } from "../../config/brand";
import { OccupationType } from "../../types/finance";
import {
  GraduationCap,
  Briefcase,
  Laptop,
  Building2,
  User,
  ArrowRight,
  Check,
  Lock,
  Mail,
  Camera,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  CheckCircle2,
} from "lucide-react";

interface AuthOnboardingFlowProps {
  onComplete: () => void;
}

const mapAuthError = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Switch to Sign In.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before finishing.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment before trying again.";
    default:
      return err instanceof Error ? err.message : "Authentication failed. Please try again.";
  }
};

const compressAvatarImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 200;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof ev.target?.result === "string" ? ev.target.result : "");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => reject(new Error("Could not process image"));
      img.src = typeof ev.target?.result === "string" ? ev.target.result : "";
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const AuthOnboardingFlow: React.FC<AuthOnboardingFlowProps> = ({ onComplete }) => {
  const { authUser, userProfile, setupUserWorkspace, refreshAuthUser, logoutUser } = useFinance();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile fields (Step 2)
  const [occupation, setOccupation] = useState<OccupationType>("college_student");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [isHostelResident, setIsHostelResident] = useState(true);
  const [cashInHandInput, setCashInHandInput] = useState("0");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (authUser) {
      setName((prev) => prev || authUser.displayName || "");
      setEmail((prev) => prev || authUser.email || "");
      setAvatarUrl((prev) => prev || authUser.photoURL || "");
    }
  }, [authUser]);

  // Determine exact visual stage
  const currentStage: "auth" | "verify" | "profile" = !authUser
    ? "auth"
    : !authUser.emailVerified
    ? "verify"
    : "profile";

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Please select an image under 4MB.");
      return;
    }
    try {
      const compressed = await compressAvatarImage(file);
      setAvatarUrl(compressed);
    } catch {
      setError("Unable to load selected photo.");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === "signup") {
        const cleanName = name.trim() || cleanEmail.split("@")[0] || "User";
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: cleanName });
        await sendEmailVerification(cred.user);
        setNotice(`Verification link sent to ${cleanEmail}. Check your inbox or spam folder.`);
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email address above first to receive a password reset link.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`Password reset link sent to ${email.trim()}.`);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerified = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const verified = await refreshAuthUser();
      if (!verified) {
        setError("Email is not verified yet. Please click the verification link in your inbox.");
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setNotice("");
    if (!auth.currentUser) return;
    setSubmitting(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setNotice(`Verification email re-sent to ${auth.currentUser.email}.`);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const curr = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
      const parsedCash = parseFloat(cashInHandInput);

      await setupUserWorkspace({
        name: name.trim() || authUser?.displayName || authUser?.email?.split("@")[0] || "User",
        email: authUser?.email || email.trim(),
        cashInHand: isNaN(parsedCash) || parsedCash < 0 ? 0 : parsedCash,
        currency: curr.code,
        currencySymbol: curr.symbol,
        occupation,
        isHostelResident: occupation === "college_student" ? isHostelResident : false,
        avatarUrl: avatarUrl || authUser?.photoURL || undefined,
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not initialize workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  const profiles = [
    {
      id: "college_student",
      label: "Student",
      subtitle: "College, School & Hostel Living",
      icon: GraduationCap,
    },
    {
      id: "working_professional",
      label: "Worker / Professional",
      subtitle: "Corporate, Salary & Monthly Commitments",
      icon: Briefcase,
    },
    {
      id: "freelancer",
      label: "Freelancer / Creator",
      subtitle: "Gig Income, Variable Retainers & Projects",
      icon: Laptop,
    },
    {
      id: "business_owner",
      label: "Business Owner",
      subtitle: "Trade, Retail, Startups & Invoicing",
      icon: Building2,
    },
    {
      id: "other",
      label: "Individual / Other",
      subtitle: "Personal Household & Daily Tracking",
      icon: User,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#05060E]/92 backdrop-blur-2xl overflow-y-auto">
      {/* Mixed Royal Ambient Orbs behind Sign-Up */}
      <div className="fixed -top-28 -left-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-28 -right-24 w-96 h-96 rounded-full bg-violet-600/20 blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl glass-panel border border-indigo-400/25 shadow-2xl p-6 sm:p-8 text-left animate-fade-up my-auto">
        {/* Brand Banner: Exclusive Luxury Stylish Wordmark + Contrasting Tagline */}
        <div className="text-center mb-6">
          <img
            src={BRAND.logoUrl}
            alt={BRAND.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-white p-1.5 mx-auto shadow-2xl mb-3"
          />
          <h1 className="font-finora text-2xl sm:text-3xl font-black tracking-[0.18em] bg-gradient-to-r from-indigo-300 via-violet-200 to-amber-300 bg-clip-text text-transparent">
            {BRAND.name}
          </h1>
          {/* Tagline placed exclusively in Sign Up with contrasting font & vibrant emerald/cyan contrast color */}
          <p className="text-xs sm:text-sm font-medium tracking-wide text-emerald-400 mt-1.5 font-sans italic">
            {BRAND.tagline}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* STAGE 1: AUTHENTICATION (SIGN UP / SIGN IN) */}
        {currentStage === "auth" && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                  setNotice("");
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "signup"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                  setNotice("");
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === "signin"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-400/50 text-[var(--text-primary)] font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
              <div className="h-px flex-1 bg-[var(--border-color)]" />
              <span>or use email</span>
              <div className="h-px flex-1 bg-[var(--border-color)]" />
            </div>

            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === "signup" && (
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400 font-medium transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400 font-medium transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[var(--text-secondary)]">
                    Password
                  </label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[11px] font-semibold text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400 font-medium transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{authMode === "signup" ? "Creating account..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === "signup" ? "Create Account & Continue" : "Sign In to FINORA"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[var(--text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Firebase Authentication & Cloud Firestore</span>
              </div>
            </form>
          </div>
        )}

        {/* STAGE 2: EMAIL VERIFICATION GATE */}
        {currentStage === "verify" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-indigo-400/25 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Verify your email address</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                We sent a verification link to{" "}
                <strong className="text-[var(--text-primary)]">{authUser?.email}</strong>. Click the
                link in your inbox to unlock your private FINORA cloud vault, then tap below.
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckVerified}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>I&apos;ve Verified — Continue</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={handleResendVerification}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-400/50 font-semibold cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Resend Email</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={logoutUser}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-400 font-semibold cursor-pointer disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: PROFILE SETUP (Student, Worker, Freelancer, Business, etc.) */}
        {currentStage === "profile" && !userProfile.isOnboarded && (
          <form onSubmit={handleProfileComplete} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-indigo-400 mb-0.5">
                  Step 2 of 2
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Set up your FINORA profile
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Tailors your cashflow categories, allowances, and quick actions.
                </p>
              </div>
              <button
                type="button"
                onClick={logoutUser}
                className="text-[11px] font-semibold text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer shrink-0"
              >
                Sign Out
              </button>
            </div>

            {/* Display Name (editable in case signed in via Google or skipped) */}
            <div className="text-xs">
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Profile Avatar Upload (Optional) */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="relative w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  Profile Photo (Optional)
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] truncate">
                  {avatarUrl ? "Photo ready" : "Upload your picture from device storage"}
                </div>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-indigo-400 text-[11px] font-semibold cursor-pointer transition-colors shrink-0">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>{avatarUrl ? "Change" : "Upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Selection Cards */}
            <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
              {profiles.map((p) => {
                const Icon = p.icon;
                const isSelected = occupation === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOccupation(p.id as OccupationType)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/15 shadow-sm"
                        : "border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-indigo-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {p.subtitle}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-500 text-white"
                          : "border-[var(--border-color)]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Currency & Cash In Hand */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-400"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Opening Cash in Hand
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={cashInHandInput}
                  onChange={(e) => setCashInHandInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-400 tabular-nums"
                />
              </div>
            </div>

            {/* If student, prompt hostel option */}
            {occupation === "college_student" && (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Hostel Resident Mode
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Mess advance, room utility splits & laundry tracker
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isHostelResident}
                  onChange={(e) => setIsHostelResident(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-0 cursor-pointer"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting up your workspace...</span>
                </>
              ) : (
                <>
                  <span>Enter FINORA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
