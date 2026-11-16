/**
 * FINORA Brand Configuration
 * Centralized global brand settings allowing easy white-labeling or rebranding
 */

export const BRAND = {
  name: "FINORA",
  tagline: "Your Money. Your Control.",
  category: "Personal Finance Management Ecosystem",
  version: "2.0.0",
  logoUrl: "/assets/aistudio/finora_logo_02e42f38.png",
  primaryColor: "#6366F1", // Mixed Royal Indigo
  creator: {
    name: "Agilan J",
    github: "https://github.com/agilanj",
    linkedin: "https://www.linkedin.com/in/agilanj",
    email: "agilan4413@gmail.com",
  },
  theme: {
    dark: {
      bgPrimary: "#06070F",
      bgSecondary: "#0B0E1D",
      cardBg: "#11162B",
      elevated: "#181E38",
      accent: "#7C3AED",
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
    },
    light: {
      bgPrimary: "#F4F6FC",
      bgSecondary: "#FFFFFF",
      cardBg: "#FFFFFF",
      elevated: "#ECEFF9",
      accent: "#4F46E5",
      textPrimary: "#0F132A",
      textSecondary: "#5A6582",
    },
  },
};

export const POPULAR_BANKS = [
  { id: "sbi", name: "State Bank of India (SBI)", code: "SBI", color: "from-[#1e3a8a] via-[#312e81] to-[#1e1b4b]", bgHex: "#1e3a8a" },
  { id: "hdfc", name: "HDFC Bank", code: "HDFC", color: "from-[#2563eb] via-[#4f46e5] to-[#312e81]", bgHex: "#2563eb" },
  { id: "icici", name: "ICICI Bank", code: "ICICI", color: "from-[#7c3aed] via-[#5b21b6] to-[#2e1065]", bgHex: "#7c3aed" },
  { id: "axis", name: "Axis Bank", code: "AXIS", color: "from-[#9d174d] via-[#701a75] to-[#3b0764]", bgHex: "#9d174d" },
  { id: "canara", name: "Canara Bank", code: "CANARA", color: "from-[#0284c7] via-[#1d4ed8] to-[#1e1b4b]", bgHex: "#0284c7" },
  { id: "kotak", name: "Kotak Mahindra Bank", code: "KOTAK", color: "from-[#be123c] via-[#881337] to-[#3b0764]", bgHex: "#be123c" },
  { id: "pnb", name: "Punjab National Bank", code: "PNB", color: "from-[#4338ca] via-[#6d28d9] to-[#1e1b4b]", bgHex: "#4338ca" },
  { id: "cash", name: "Cash Wallet", code: "CASH", color: "from-[#059669] via-[#047857] to-[#064e3b]", bgHex: "#059669" },
  { id: "upi", name: "UPI Linked Account", code: "UPI", color: "from-[#4f46e5] via-[#7c3aed] to-[#3730a3]", bgHex: "#4f46e5" },
  { id: "other", name: "Other Financial Account", code: "OTHER", color: "from-[#1e293b] via-[#312e81] to-[#0f172a]", bgHex: "#1e293b" },
];

export const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "Utensils", color: "#f97316" },
  { id: "transport", name: "Transportation", icon: "Car", color: "#3b82f6" },
  { id: "hostel", name: "Hostel & Rent", icon: "Home", color: "#8b5cf6" },
  { id: "shopping", name: "Shopping", icon: "ShoppingBag", color: "#ec4899" },
  { id: "education", name: "Education & Courses", icon: "GraduationCap", color: "#10b981" },
  { id: "groceries", name: "Groceries & Supplies", icon: "ShoppingCart", color: "#84cc16" },
  { id: "bills", name: "Bills & Recharge", icon: "Zap", color: "#eab308" },
  { id: "entertainment", name: "Entertainment & Subs", icon: "Film", color: "#06b6d4" },
  { id: "medical", name: "Medical & Health", icon: "HeartPulse", color: "#ef4444" },
  { id: "personal", name: "Personal Care", icon: "Sparkles", color: "#d946ef" },
  { id: "travel", name: "Travel & Trips", icon: "Plane", color: "#14b8a6" },
  { id: "other_expense", name: "Other Expenses", icon: "CircleEllipsis", color: "#64748b" },
];

export const INCOME_CATEGORIES = [
  { id: "pocket_money", name: "Pocket Money / Allowance", icon: "Gift", color: "#10b981" },
  { id: "salary", name: "Salary", icon: "Briefcase", color: "#3b82f6" },
  { id: "freelance", name: "Freelance Income", icon: "Laptop", color: "#8b5cf6" },
  { id: "scholarship", name: "Scholarship & Grants", icon: "Award", color: "#f59e0b" },
  { id: "business", name: "Business Revenue", icon: "TrendingUp", color: "#06b6d4" },
  { id: "investments", name: "Dividends & Interest", icon: "Percent", color: "#14b8a6" },
  { id: "other_income", name: "Other Income", icon: "PlusCircle", color: "#64748b" },
];

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar" },
  { code: "SGD", symbol: "SG$", name: "Singapore Dollar" },
];
