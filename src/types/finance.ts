/**
 * FINORA Financial Ecosystem Data Models
 */

export type AccountType = "savings" | "current" | "salary" | "cash" | "upi" | "other";

export interface UserCategory {
  id: string;
  userId?: string;
  name: string;
  type: "expense" | "income";
  icon?: string;
  color?: string;
  createdAt?: string;
}

export interface Account {
  id: string;
  userId?: string;
  name: string;
  bankName: string;
  bankCode?: string;
  accountType: AccountType;
  balance: number;
  openingBalance?: number;
  currency: string;
  maskedNumber: string; // e.g. "•••• 4821"
  colorGradient: string; // Tailwind gradient or hex
  isDefault: boolean;
  isArchived: boolean;
  isHidden?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  accountId: string;
  destinationAccountId?: string; // used when type === "transfer"
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string;
  paymentMethod: string;
  notes?: string;
  receiptName?: string;
  createdAt: string;
}

export type CardType =
  | "debit"
  | "credit"
  | "prepaid"
  | "transit"
  | "driving_license"
  | "student_id"
  | "national_id"
  | "membership"
  | "other";

export interface VirtualCard {
  id: string;
  nickname: string;
  provider: string; // e.g. Visa, Mastercard, RuPay, DMRC, RTO Govt of India, Delhi University
  cardType: CardType;
  linkedAccountId?: string;
  lastFour: string;
  fullNumber?: string; // full number or license number
  holderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  validTill?: string; // for DL or Transit (e.g. "2038-06-18")
  cvv?: string;
  cardDesign:
    | "platinum_gold"
    | "deep_navy"
    | "emerald_minimal"
    | "matte_black"
    | "ruby_gradient"
    | "cyber_metal"
    | "govt_saffron"
    | "metro_cyan";
  status: "active" | "frozen" | "expired";
  notes?: string;
  isPinned?: boolean;
  // Specific fields for Driving License & IDs:
  licenseNumber?: string;
  vehicleClasses?: string; // e.g. "MCWG / LMV"
  bloodGroup?: string; // e.g. "O+", "B+", "AB+"
  dateOfBirth?: string;
  issuingAuthority?: string; // e.g. "RTO New Delhi", "Transport Dept", "Delhi University"
  transitBalance?: number; // e.g. 480 for Metro card
}

export type LoanType = "borrow" | "lend"; // borrow = liability, lend = receivable

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
}

export interface LoanRecord {
  id: string;
  type: LoanType;
  personName: string;
  personContact?: string;
  originalAmount: number;
  outstandingAmount: number;
  startDate: string;
  dueDate: string;
  description: string;
  status: "active" | "settled" | "overdue";
  repayments: Repayment[];
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  isCurrentUser?: boolean;
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidById: string;
  splitType: "equal" | "custom";
  splits: ExpenseSplit[];
  date: string;
  category?: string;
  createdAt: string;
}

export interface GroupSettlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  status: "settled" | "pending";
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: GroupSettlement[];
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  period: "monthly" | "weekly";
  monthYear: string; // e.g. "2026-10"
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  description?: string;
  contributions: GoalContribution[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingFrequency: "monthly" | "quarterly" | "yearly";
  nextRenewalDate: string;
  accountId: string;
  category: string;
  status: "active" | "paused" | "cancelled";
  iconName?: string;
}

export type ReminderType = "repayment" | "subscription" | "bill" | "salary" | "pocket_money" | "custom";

export interface FinancialReminder {
  id: string;
  title: string;
  date: string;
  amount?: number;
  type: ReminderType;
  isCompleted: boolean;
  recurrence?: "none" | "monthly" | "weekly";
}

export type OccupationType =
  | "college_student"
  | "school_student"
  | "hostel_student"
  | "working_professional"
  | "freelancer"
  | "business_owner"
  | "self_employed"
  | "other";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  occupation: OccupationType;
  country: string;
  preferredLanguage: string;
  currency: string; // e.g. "INR"
  currencySymbol: string; // e.g. "₹"
  themePreference: "dark" | "light" | "system";
  isGuest: boolean;
  isOnboarded: boolean;
  // Specific questions:
  isHostelResident: boolean;
  monthlyIncomeOrAllowance: number;
  incomeFrequency: "monthly" | "weekly" | "irregular";
  salaryOrAllowanceDate: number; // day of month 1-31
  allowanceSource?: string; // Parents, stipend, job
  primaryGoal?: string;
  // Money management app settings:
  defaultPaymentMethod?: string;
  dailySpendLimit?: number;
  lowBalanceThreshold?: number;
  enableBudgetAlerts?: boolean;
  enableBillReminders?: boolean;
  enableRoundUpSavings?: boolean;
  hideBalancesOnLaunch?: boolean;
  appPin?: string;
}

export interface ExportHistoryItem {
  id: string;
  title: string;
  generatedAt: string;
  format: "pdf" | "xlsx" | "csv";
  filterSummary: string;
  recordCount: number;
  fileSizeEstimate: string;
}

export type TransitMode = "metro" | "bus" | "train" | "tram" | "shuttle";

export interface TransitTripLog {
  id: string;
  cardId: string;
  type: "ride" | "recharge";
  mode: TransitMode;
  amount: number; // fare deducted or recharge added
  balanceAfter: number;
  fromStation?: string; // e.g. "Kashmere Gate Metro"
  toStation?: string; // e.g. "Hauz Khas"
  routeNumber?: string; // e.g. "Route 502" or "Yellow Line"
  sourceAccountId?: string; // used when type === "recharge"
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  notes?: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  category: "ui" | "feature" | "bug" | "praise" | "other";
  rating: number; // 1 to 5
  comment: string;
  submittedAt: string;
}
