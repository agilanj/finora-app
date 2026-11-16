import { UserProfile } from "../types/finance";

export const STORAGE_KEYS = {
  THEME: "finora_theme_preference",
};

// Clean zero-state user profile template (no demo/mock user data)
export const EMPTY_PROFILE: UserProfile = {
  id: "",
  name: "",
  email: "",
  avatarUrl: "",
  occupation: "college_student",
  country: "India",
  preferredLanguage: "English",
  currency: "INR",
  currencySymbol: "₹",
  themePreference: "dark",
  isGuest: false,
  isOnboarded: false,
  isHostelResident: false,
  monthlyIncomeOrAllowance: 0,
  incomeFrequency: "monthly",
  salaryOrAllowanceDate: 1,
  allowanceSource: "",
  primaryGoal: "",
  defaultPaymentMethod: "UPI",
  dailySpendLimit: 0,
  lowBalanceThreshold: 0,
  enableBudgetAlerts: true,
  enableBillReminders: true,
  enableRoundUpSavings: false,
  hideBalancesOnLaunch: false,
  appPin: "",
};

export function getSavedTheme(): "dark" | "light" {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveThemePreference(theme: "dark" | "light"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // Ignore storage write restriction
  }
}
