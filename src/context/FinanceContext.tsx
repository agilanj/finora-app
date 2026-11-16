import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import {
  auth,
  db,
  OperationType,
  handleFirestoreError,
  normalizeTimestamp,
} from "../firebase";
import {
  Account,
  Transaction,
  UserCategory,
  VirtualCard,
  LoanRecord,
  Repayment,
  Group,
  GroupExpense,
  GroupSettlement,
  Budget,
  SavingsGoal,
  Subscription,
  FinancialReminder,
  UserProfile,
  ExportHistoryItem,
  TransitTripLog,
  FeedbackItem,
  OccupationType,
} from "../types/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../config/brand";
import { EMPTY_PROFILE, getSavedTheme, saveThemePreference } from "../utils/storage";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  time: string;
  read: boolean;
}

export interface AppToast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface FinanceContextType {
  authUser: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  isMutating: boolean;
  toast: AppToast | null;
  dismissToast: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;

  userProfile: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  categories: UserCategory[];
  cards: VirtualCard[];
  loans: LoanRecord[];
  groups: Group[];
  budgets: Budget[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  reminders: FinancialReminder[];
  exportHistory: ExportHistoryItem[];
  theme: "dark" | "light";
  activeTab: string;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  totalTrackedBalance: number;
  cashInHand: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  yearlyIncome: number;
  yearlyExpenses: number;
  yearlySavings: number;
  totalToReceive: number;
  totalToPay: number;
  budgetUtilization: number;
  monthlySubscriptionTotal: number;
  financialHealthScore: number;

  // Actions
  setActiveTab: (tab: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  refreshAuthUser: () => Promise<boolean>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  formatCurrency: (amount: number) => string;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Accounts
  addAccount: (account: Omit<Account, "id" | "createdAt">) => Promise<void>;
  editAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string, deleteLinkedTransactions?: boolean) => Promise<void>;
  toggleHideAccountBalance: (id: string) => Promise<void>;
  transferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Transactions
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<void>;

  // Categories
  addCategory: (cat: Omit<UserCategory, "id" | "createdAt">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Cards & Transit
  addVirtualCard: (card: Omit<VirtualCard, "id">) => Promise<void>;
  updateVirtualCard: (id: string, updates: Partial<VirtualCard>) => Promise<void>;
  deleteVirtualCard: (id: string) => Promise<void>;
  transitTrips: TransitTripLog[];
  recordTransitTrip: (
    trip: Omit<TransitTripLog, "id" | "createdAt" | "balanceAfter">
  ) => Promise<{ success: boolean; error?: string }>;
  rechargeTransitCard: (
    cardId: string,
    amount: number,
    sourceAccountId: string,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Feedback & Credits
  feedbackList: FeedbackItem[];
  submitFeedback: (feedback: Omit<FeedbackItem, "id" | "submittedAt">) => Promise<void>;

  // Loans
  addLoan: (
    loan: Omit<LoanRecord, "id" | "outstandingAmount" | "status" | "repayments" | "createdAt">
  ) => Promise<void>;
  recordRepayment: (loanId: string, repayment: Omit<Repayment, "id" | "loanId">) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;

  // Groups
  addGroup: (name: string, description: string, memberNames: string[]) => Promise<void>;
  addGroupExpense: (groupId: string, expense: Omit<GroupExpense, "id" | "createdAt">) => Promise<void>;
  recordGroupSettlement: (groupId: string, settlement: Omit<GroupSettlement, "id">) => Promise<void>;

  // Budgets
  addBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Goals
  addGoal: (
    goal: Omit<SavingsGoal, "id" | "currentAmount" | "contributions" | "createdAt">
  ) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, note?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Subscriptions (stored in recurring_transactions)
  addSubscription: (sub: Omit<Subscription, "id">) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  // Reminders
  addReminder: (rem: Omit<FinancialReminder, "id">) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Exports
  addExportHistory: (item: Omit<ExportHistoryItem, "id">) => Promise<void>;

  // Workspace Initialization & Clear
  setupUserWorkspace: (opts: {
    name: string;
    email: string;
    cashInHand: number;
    currency: string;
    currencySymbol: string;
    occupation: OccupationType;
    isHostelResident: boolean;
    avatarUrl?: string;
  }) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const clampStr = (val: string | undefined, max: number): string => {
  if (!val) return "";
  return val.trim().slice(0, max);
};

const makeId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authVerifiedTick, setAuthVerifiedTick] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const mutatingRef = useRef<boolean>(false);

  const [toast, setToast] = useState<AppToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reminders, setReminders] = useState<FinancialReminder[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [transitTrips, setTransitTrips] = useState<TransitTripLog[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  const [theme, setThemeState] = useState<"dark" | "light">(() => getSavedTheme());
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: makeId("toast"), message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const dismissToast = () => setToast(null);

  // Instant theme DOM application
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      setAuthLoading(false);

      if (!firebaseUser) {
        setUserProfile(EMPTY_PROFILE);
        setAccounts([]);
        setTransactions([]);
        setCategories([]);
        setCards([]);
        setLoans([]);
        setGroups([]);
        setBudgets([]);
        setGoals([]);
        setSubscriptions([]);
        setReminders([]);
        setExportHistory([]);
        setTransitTrips([]);
        setFeedbackList([]);
        setNotifications([]);
        setDataLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Attach real-time Firestore listeners ONLY when authenticated & email verified
  useEffect(() => {
    if (!authUser || !authUser.emailVerified) {
      setDataLoading(false);
      return;
    }

    const uid = authUser.uid;
    setDataLoading(true);
    const unsubscribers: Array<() => void> = [];

    // 1. User Profile document
    unsubscribers.push(
      onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            const loadedProfile: UserProfile = {
              ...EMPTY_PROFILE,
              id: snap.id,
              name: d.name || authUser.displayName || "",
              email: d.email || authUser.email || "",
              avatarUrl: d.avatarUrl || authUser.photoURL || "",
              occupation: d.occupation || "college_student",
              country: d.country || "India",
              preferredLanguage: d.preferredLanguage || "English",
              currency: d.currency || "INR",
              currencySymbol: d.currencySymbol || "₹",
              themePreference: d.themePreference || "dark",
              isGuest: false,
              isOnboarded: Boolean(d.isOnboarded),
              isHostelResident: Boolean(d.isHostelResident),
              monthlyIncomeOrAllowance: Number(d.monthlyIncomeOrAllowance ?? 0),
              incomeFrequency: d.incomeFrequency || "monthly",
              salaryOrAllowanceDate: Number(d.salaryOrAllowanceDate ?? 1),
              defaultPaymentMethod: d.defaultPaymentMethod || "UPI",
              dailySpendLimit: Number(d.dailySpendLimit ?? 0),
              lowBalanceThreshold: Number(d.lowBalanceThreshold ?? 0),
              enableBudgetAlerts: d.enableBudgetAlerts ?? true,
              enableBillReminders: d.enableBillReminders ?? true,
              enableRoundUpSavings: Boolean(d.enableRoundUpSavings),
              hideBalancesOnLaunch: Boolean(d.hideBalancesOnLaunch),
              appPin: d.appPin || "",
            };
            setUserProfile(loadedProfile);
            if (d.themePreference === "light" || d.themePreference === "dark") {
              setThemeState(d.themePreference);
              saveThemePreference(d.themePreference);
            }
          } else {
            setUserProfile({
              ...EMPTY_PROFILE,
              id: uid,
              name: authUser.displayName || "",
              email: authUser.email || "",
              avatarUrl: authUser.photoURL || "",
              isOnboarded: false,
            });
          }
          setDataLoading(false);
        },
        (error) => {
          setDataLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        }
      )
    );

    const attachCollection = <T extends { id: string }>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      mapper: (id: string, data: Record<string, unknown>) => T,
      sorter?: (a: T, b: T) => number
    ) => {
      const q = query(collection(db, colName), where("userId", "==", uid));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => mapper(d.id, d.data()));
          if (sorter) items.sort(sorter);
          setter(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, colName);
        }
      );
      unsubscribers.push(unsub);
    };

    // 2. Accounts
    attachCollection<Account>(
      "accounts",
      setAccounts,
      (id, d) => ({
        id,
        userId: String(d.userId || uid),
        name: String(d.name || ""),
        bankName: String(d.bankName || ""),
        bankCode: d.bankCode ? String(d.bankCode) : undefined,
        accountType: (d.accountType as Account["accountType"]) || "savings",
        balance: Number(d.balance ?? 0),
        openingBalance: d.openingBalance !== undefined ? Number(d.openingBalance) : undefined,
        currency: String(d.currency || "INR"),
        maskedNumber: String(d.maskedNumber || "•••• 0000"),
        colorGradient: String(d.colorGradient || "from-[#1e3a8a] via-[#312e81] to-[#1e1b4b]"),
        isDefault: Boolean(d.isDefault),
        isArchived: Boolean(d.isArchived),
        isHidden: Boolean(d.isHidden),
        createdAt: normalizeTimestamp(d.createdAt),
        updatedAt: normalizeTimestamp(d.updatedAt),
      }),
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    );

    // 3. Transactions
    attachCollection<Transaction>(
      "transactions",
      setTransactions,
      (id, d) => ({
        id,
        accountId: String(d.accountId || ""),
        destinationAccountId: d.destinationAccountId ? String(d.destinationAccountId) : undefined,
        type: (d.type as Transaction["type"]) || "expense",
        amount: Number(d.amount ?? 0),
        category: String(d.category || "Other Expenses"),
        description: String(d.description || ""),
        date: String(d.date || new Date().toISOString().split("T")[0]),
        time: d.time ? String(d.time) : undefined,
        paymentMethod: String(d.paymentMethod || "UPI"),
        notes: d.notes ? String(d.notes) : undefined,
        createdAt: normalizeTimestamp(d.createdAt),
      }),
      (a, b) => {
        const dCmp = b.date.localeCompare(a.date);
        if (dCmp !== 0) return dCmp;
        return b.createdAt.localeCompare(a.createdAt);
      }
    );

    // 4. Categories
    attachCollection<UserCategory>(
      "categories",
      setCategories,
      (id, d) => ({
        id,
        userId: String(d.userId || uid),
        name: String(d.name || ""),
        type: (d.type as UserCategory["type"]) || "expense",
        icon: d.icon ? String(d.icon) : undefined,
        color: d.color ? String(d.color) : undefined,
        createdAt: normalizeTimestamp(d.createdAt),
      })
    );

    // 5. Budgets
    attachCollection<Budget>("budgets", setBudgets, (id, d) => ({
      id,
      category: String(d.category || ""),
      limitAmount: Number(d.limitAmount ?? 0),
      period: (d.period as Budget["period"]) || "monthly",
      monthYear: String(d.monthYear || new Date().toISOString().slice(0, 7)),
    }));

    // 6. Savings Goals
    attachCollection<SavingsGoal>(
      "savings_goals",
      setGoals,
      (id, d) => ({
        id,
        name: String(d.name || ""),
        targetAmount: Number(d.targetAmount ?? 0),
        currentAmount: Number(d.currentAmount ?? 0),
        targetDate: String(d.targetDate || ""),
        category: String(d.category || "Savings"),
        description: d.description ? String(d.description) : undefined,
        contributions: Array.isArray(d.contributions) ? (d.contributions as SavingsGoal["contributions"]) : [],
        createdAt: normalizeTimestamp(d.createdAt),
      }),
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    // 7. Recurring Transactions / Subscriptions
    attachCollection<Subscription>("recurring_transactions", setSubscriptions, (id, d) => ({
      id,
      name: String(d.name || ""),
      amount: Number(d.amount ?? 0),
      billingFrequency: (d.billingFrequency as Subscription["billingFrequency"]) || "monthly",
      nextRenewalDate: String(d.nextRenewalDate || ""),
      accountId: String(d.accountId || ""),
      category: String(d.category || "Entertainment & Subs"),
      status: (d.status as Subscription["status"]) || "active",
    }));

    // 8. Loans
    attachCollection<LoanRecord>(
      "loans",
      setLoans,
      (id, d) => ({
        id,
        type: (d.type as LoanRecord["type"]) || "lend",
        personName: String(d.personName || ""),
        personContact: d.personContact ? String(d.personContact) : undefined,
        originalAmount: Number(d.originalAmount ?? 0),
        outstandingAmount: Number(d.outstandingAmount ?? 0),
        startDate: String(d.startDate || ""),
        dueDate: String(d.dueDate || ""),
        description: String(d.description || ""),
        status: (d.status as LoanRecord["status"]) || "active",
        repayments: Array.isArray(d.repayments) ? (d.repayments as LoanRecord["repayments"]) : [],
        createdAt: normalizeTimestamp(d.createdAt),
      }),
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    // 9. Groups
    attachCollection<Group>(
      "groups",
      setGroups,
      (id, d) => ({
        id,
        name: String(d.name || ""),
        description: String(d.description || ""),
        members: Array.isArray(d.members) ? (d.members as Group["members"]) : [],
        expenses: Array.isArray(d.expenses) ? (d.expenses as Group["expenses"]) : [],
        settlements: Array.isArray(d.settlements) ? (d.settlements as Group["settlements"]) : [],
        createdAt: normalizeTimestamp(d.createdAt),
      }),
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    // 10. Cards
    attachCollection<VirtualCard>("cards", setCards, (id, d) => ({
      id,
      nickname: String(d.nickname || ""),
      provider: String(d.provider || ""),
      cardType: (d.cardType as VirtualCard["cardType"]) || "transit",
      linkedAccountId: d.linkedAccountId ? String(d.linkedAccountId) : undefined,
      lastFour: String(d.lastFour || "0000"),
      fullNumber: d.fullNumber ? String(d.fullNumber) : undefined,
      holderName: d.holderName ? String(d.holderName) : undefined,
      validTill: d.validTill ? String(d.validTill) : undefined,
      issuingAuthority: d.issuingAuthority ? String(d.issuingAuthority) : undefined,
      cardDesign: (d.cardDesign as VirtualCard["cardDesign"]) || "metro_cyan",
      status: (d.status as VirtualCard["status"]) || "active",
      notes: d.notes ? String(d.notes) : undefined,
      isPinned: Boolean(d.isPinned),
      transitBalance: d.transitBalance !== undefined ? Number(d.transitBalance) : 0,
    }));

    // 11. Transit Trips
    attachCollection<TransitTripLog>(
      "transit_trips",
      setTransitTrips,
      (id, d) => ({
        id,
        cardId: String(d.cardId || ""),
        type: (d.type as TransitTripLog["type"]) || "ride",
        mode: (d.mode as TransitTripLog["mode"]) || "metro",
        amount: Number(d.amount ?? 0),
        balanceAfter: Number(d.balanceAfter ?? 0),
        fromStation: d.fromStation ? String(d.fromStation) : undefined,
        toStation: d.toStation ? String(d.toStation) : undefined,
        routeNumber: d.routeNumber ? String(d.routeNumber) : undefined,
        sourceAccountId: d.sourceAccountId ? String(d.sourceAccountId) : undefined,
        date: String(d.date || ""),
        time: String(d.time || ""),
        notes: d.notes ? String(d.notes) : undefined,
        createdAt: normalizeTimestamp(d.createdAt),
      }),
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    // 12. Reminders
    attachCollection<FinancialReminder>("reminders", setReminders, (id, d) => ({
      id,
      title: String(d.title || ""),
      date: String(d.date || ""),
      amount: d.amount !== undefined ? Number(d.amount) : undefined,
      type: (d.type as FinancialReminder["type"]) || "custom",
      isCompleted: Boolean(d.isCompleted),
      recurrence: (d.recurrence as FinancialReminder["recurrence"]) || "none",
    }));

    // 13. Export History
    attachCollection<ExportHistoryItem>(
      "exports",
      setExportHistory,
      (id, d) => ({
        id,
        title: String(d.title || ""),
        generatedAt: String(d.generatedAt || ""),
        format: (d.format as ExportHistoryItem["format"]) || "pdf",
        filterSummary: String(d.filterSummary || ""),
        recordCount: Number(d.recordCount ?? 0),
        fileSizeEstimate: String(d.fileSizeEstimate || ""),
      })
    );

    // 14. Feedback
    attachCollection<FeedbackItem>(
      "feedback",
      setFeedbackList,
      (id, d) => ({
        id,
        category: (d.category as FeedbackItem["category"]) || "ui",
        rating: Number(d.rating ?? 5),
        comment: String(d.comment || ""),
        submittedAt: String(d.submittedAt || ""),
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [authUser, authVerifiedTick]);

  const refreshAuthUser = async (): Promise<boolean> => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    if (current.emailVerified) {
      await current.getIdToken(true);
    }
    setAuthUser(auth.currentUser);
    setAuthVerifiedTick((t) => t + 1);
    return Boolean(auth.currentUser?.emailVerified);
  };

  const isAuthenticated = Boolean(
    authUser && authUser.emailVerified && userProfile.isOnboarded
  );

  const setIsAuthenticated = (_val: boolean) => {
    // Authentication state is managed authoritatively by Firebase Auth + user onboarding document
  };

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
    setUserProfile((prev) => ({ ...prev, themePreference: newTheme }));
    if (authUser && authUser.emailVerified && userProfile.isOnboarded) {
      updateDoc(doc(db, "users", authUser.uid), {
        themePreference: newTheme,
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        console.warn("Failed to sync theme preference:", err);
      });
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setActiveTab("dashboard");
      showToast("Signed out safely.", "info");
    } catch (error) {
      showToast("Failed to sign out. Please try again.", "error");
      console.error("Sign out failed:", error);
    }
  };

  const updateUserProfile = async (partial: Partial<UserProfile>) => {
    if (!authUser || !authUser.emailVerified) return;
    const uid = authUser.uid;
    const nextProfile = { ...userProfile, ...partial };
    setUserProfile(nextProfile);

    const payload: Record<string, unknown> = {
      name: clampStr(nextProfile.name || "User", 100),
      email: clampStr(nextProfile.email || authUser.email || "", 200),
      avatarUrl: clampStr(nextProfile.avatarUrl || "", 150000),
      occupation: nextProfile.occupation,
      country: clampStr(nextProfile.country || "India", 80),
      preferredLanguage: clampStr(nextProfile.preferredLanguage || "English", 50),
      currency: clampStr(nextProfile.currency || "INR", 10),
      currencySymbol: clampStr(nextProfile.currencySymbol || "₹", 8),
      themePreference: nextProfile.themePreference || theme,
      isOnboarded: Boolean(nextProfile.isOnboarded),
      isHostelResident: Boolean(nextProfile.isHostelResident),
      monthlyIncomeOrAllowance: Math.max(0, Number(nextProfile.monthlyIncomeOrAllowance) || 0),
      incomeFrequency: nextProfile.incomeFrequency || "monthly",
      salaryOrAllowanceDate: Math.min(31, Math.max(1, Number(nextProfile.salaryOrAllowanceDate) || 1)),
      defaultPaymentMethod: clampStr(nextProfile.defaultPaymentMethod || "UPI", 40),
      dailySpendLimit: Math.max(0, Number(nextProfile.dailySpendLimit) || 0),
      lowBalanceThreshold: Math.max(0, Number(nextProfile.lowBalanceThreshold) || 0),
      enableBudgetAlerts: Boolean(nextProfile.enableBudgetAlerts),
      enableBillReminders: Boolean(nextProfile.enableBillReminders),
      enableRoundUpSavings: Boolean(nextProfile.enableRoundUpSavings),
      hideBalancesOnLaunch: Boolean(nextProfile.hideBalancesOnLaunch),
      appPin: clampStr(nextProfile.appPin || "", 4),
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(doc(db, "users", uid), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Financial Metric Calculations
  const totalTrackedBalance = useMemo(() => {
    return accounts
      .filter((a) => !a.isArchived)
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const cashInHand = useMemo(() => {
    return accounts
      .filter((a) => !a.isArchived && (a.accountType === "cash" || a.name.toLowerCase().includes("cash")))
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const { monthlyIncome, monthlyExpenses, yearlyIncome, yearlyExpenses } = useMemo(() => {
    let mInc = 0;
    let mExp = 0;
    let yInc = 0;
    let yExp = 0;
    const nowIso = new Date().toISOString();
    const currentMonthPrefix = nowIso.slice(0, 7);
    const currentYearPrefix = nowIso.slice(0, 4);

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentYearPrefix)) {
        if (tx.type === "income") yInc += tx.amount;
        else if (tx.type === "expense") yExp += tx.amount;
      }
      if (tx.date.startsWith(currentMonthPrefix)) {
        if (tx.type === "income") mInc += tx.amount;
        else if (tx.type === "expense") mExp += tx.amount;
      }
    });

    return {
      monthlyIncome: mInc,
      monthlyExpenses: mExp,
      yearlyIncome: yInc,
      yearlyExpenses: yExp,
    };
  }, [transactions]);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const yearlySavings = yearlyIncome - yearlyExpenses;

  const { totalToReceive, totalToPay } = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;

    loans.forEach((loan) => {
      if (loan.status !== "settled") {
        if (loan.type === "lend") toReceive += loan.outstandingAmount;
        else toPay += loan.outstandingAmount;
      }
    });

    return { totalToReceive: toReceive, totalToPay: toPay };
  }, [loans]);

  const budgetUtilization = useMemo(() => {
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    if (totalBudgetLimit === 0) return 0;
    return Math.min(100, Math.round((monthlyExpenses / totalBudgetLimit) * 100));
  }, [budgets, monthlyExpenses]);

  const monthlySubscriptionTotal = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        if (s.billingFrequency === "monthly") return sum + s.amount;
        if (s.billingFrequency === "quarterly") return sum + s.amount / 3;
        if (s.billingFrequency === "yearly") return sum + s.amount / 12;
        return sum + s.amount;
      }, 0);
  }, [subscriptions]);

  const financialHealthScore = useMemo(() => {
    if (accounts.length === 0 && transactions.length === 0) return 0;
    let score = 50;

    if (monthlyIncome > 0) {
      const savingsRate = (monthlySavings / monthlyIncome) * 100;
      if (savingsRate >= 30) score += 20;
      else if (savingsRate >= 15) score += 12;
      else if (savingsRate > 0) score += 5;
      else score -= 10;
    }

    if (totalToPay === 0) score += 15;
    else if (totalTrackedBalance > totalToPay * 2) score += 10;
    else if (totalToPay > totalTrackedBalance) score -= 15;

    if (budgetUtilization > 0 && budgetUtilization <= 85) score += 15;
    else if (budgetUtilization > 100) score -= 10;

    if (goals.some((g) => g.currentAmount > 0)) score += 10;

    return Math.max(15, Math.min(98, score));
  }, [accounts.length, transactions.length, monthlyIncome, monthlySavings, totalToPay, totalTrackedBalance, budgetUtilization, goals]);

  const formatCurrency = (amount: number): string => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const symbol = userProfile.currencySymbol || "₹";
    return `${symbol}${safeAmount.toLocaleString("en-IN", {
      minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => setNotifications([]);
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const requireAuthUid = (): string => {
    if (!authUser || !authUser.emailVerified) {
      throw new Error("Authenticated and verified Firebase session is required.");
    }
    return authUser.uid;
  };

  // ==================== ACCOUNTS CRUD ====================
  const addAccount = async (accountData: Omit<Account, "id" | "createdAt">) => {
    if (mutatingRef.current) return;
    const uid = requireAuthUid();
    mutatingRef.current = true;
    setIsMutating(true);
    const id = makeId("acc");

    try {
      const batch = writeBatch(db);
      if (accountData.isDefault) {
        accounts.forEach((a) => {
          if (a.isDefault) {
            batch.update(doc(db, "accounts", a.id), {
              isDefault: false,
              updatedAt: serverTimestamp(),
            });
          }
        });
      }

      const payload: Record<string, unknown> = {
        userId: uid,
        name: clampStr(accountData.name, 80) || "Account",
        bankName: clampStr(accountData.bankName, 80) || "Bank",
        accountType: accountData.accountType,
        balance: Number(accountData.balance) || 0,
        openingBalance: Number(accountData.balance) || 0,
        currency: clampStr(accountData.currency || userProfile.currency || "INR", 10),
        maskedNumber: clampStr(accountData.maskedNumber || "•••• 0000", 30),
        colorGradient: clampStr(accountData.colorGradient || "from-[#1e3a8a] via-[#312e81] to-[#1e1b4b]", 120),
        isDefault: Boolean(accountData.isDefault || accounts.length === 0),
        isArchived: Boolean(accountData.isArchived),
        isHidden: Boolean(accountData.isHidden),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (accountData.bankCode) {
        payload.bankCode = clampStr(accountData.bankCode, 20);
      }

      batch.set(doc(db, "accounts", id), payload);
      await batch.commit();
      showToast(`Account "${payload.name}" added.`);
    } catch (error) {
      showToast("Failed to save account.", "error");
      handleFirestoreError(error, OperationType.CREATE, `accounts/${id}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  const editAccount = async (id: string, updates: Partial<Account>) => {
    const uid = requireAuthUid();
    const existingAcc = accounts.find((a) => a.id === id);
    if (!existingAcc) return;

    try {
      const batch = writeBatch(db);
      if (updates.isDefault) {
        accounts.forEach((a) => {
          if (a.id !== id && a.isDefault) {
            batch.update(doc(db, "accounts", a.id), {
              isDefault: false,
              updatedAt: serverTimestamp(),
            });
          }
        });
      }

      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.name !== undefined) payload.name = clampStr(updates.name, 80);
      if (updates.bankName !== undefined) payload.bankName = clampStr(updates.bankName, 80);
      if (updates.bankCode !== undefined) payload.bankCode = clampStr(updates.bankCode, 20);
      if (updates.accountType !== undefined) payload.accountType = updates.accountType;
      if (updates.balance !== undefined) payload.balance = Number(updates.balance) || 0;
      if (updates.currency !== undefined) payload.currency = clampStr(updates.currency, 10);
      if (updates.maskedNumber !== undefined) payload.maskedNumber = clampStr(updates.maskedNumber, 30);
      if (updates.colorGradient !== undefined) payload.colorGradient = clampStr(updates.colorGradient, 120);
      if (updates.isDefault !== undefined) payload.isDefault = Boolean(updates.isDefault);
      if (updates.isArchived !== undefined) payload.isArchived = Boolean(updates.isArchived);
      if (updates.isHidden !== undefined) payload.isHidden = Boolean(updates.isHidden);

      if (uid) {
        batch.update(doc(db, "accounts", id), payload);
      }
      await batch.commit();
      showToast("Account updated.");
    } catch (error) {
      showToast("Failed to update account.", "error");
      handleFirestoreError(error, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const deleteAccount = async (id: string, deleteLinkedTransactions = true) => {
    requireAuthUid();
    try {
      const linkedTxs = transactions.filter(
        (t) => t.accountId === id || t.destinationAccountId === id
      );
      const linkedSubs = subscriptions.filter((s) => s.accountId === id);

      // Process in batches of max 450 operations to respect Firestore 500-op batch ceiling
      const ops: Array<{ type: "delete"; path: [string, string] }> = [
        { type: "delete", path: ["accounts", id] },
      ];
      if (deleteLinkedTransactions) {
        linkedTxs.forEach((t) => ops.push({ type: "delete", path: ["transactions", t.id] }));
      }
      linkedSubs.forEach((s) => ops.push({ type: "delete", path: ["recurring_transactions", s.id] }));

      for (let i = 0; i < ops.length; i += 450) {
        const chunk = ops.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach((op) => {
          batch.delete(doc(db, op.path[0], op.path[1]));
        });
        await batch.commit();
      }
      showToast("Account deleted.");
    } catch (error) {
      showToast("Failed to delete account.", "error");
      handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
    }
  };

  const toggleHideAccountBalance = async (id: string) => {
    requireAuthUid();
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    try {
      await updateDoc(doc(db, "accounts", id), {
        isHidden: !acc.isHidden,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const transferBetweenAccounts = async (
    fromId: string,
    toId: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (mutatingRef.current) return { success: false, error: "Action in progress..." };
    const uid = requireAuthUid();
    if (fromId === toId) {
      return { success: false, error: "Source and destination accounts must be different" };
    }
    const sourceAcc = accounts.find((a) => a.id === fromId);
    const destAcc = accounts.find((a) => a.id === toId);
    if (!sourceAcc || !destAcc) {
      return { success: false, error: "One or both accounts could not be found" };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }
    if (sourceAcc.balance < amount) {
      return {
        success: false,
        error: `Insufficient balance in ${sourceAcc.name} (${formatCurrency(sourceAcc.balance)})`,
      };
    }

    mutatingRef.current = true;
    setIsMutating(true);
    const txId = makeId("tx");

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "accounts", fromId), {
        balance: sourceAcc.balance - amount,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "accounts", toId), {
        balance: destAcc.balance + amount,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, "transactions", txId), {
        userId: uid,
        accountId: fromId,
        destinationAccountId: toId,
        type: "transfer",
        amount,
        category: "Internal Transfer",
        description: clampStr(`Transfer to ${destAcc.name}`, 180),
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        paymentMethod: "Account Transfer",
        notes: clampStr(note || `Self transfer from ${sourceAcc.name} to ${destAcc.name}`, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showToast(`Transferred ${formatCurrency(amount)} to ${destAcc.name}.`);
      return { success: true };
    } catch (error) {
      showToast("Transfer failed.", "error");
      handleFirestoreError(error, OperationType.WRITE, `transactions/${txId}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  // ==================== TRANSACTIONS CRUD ====================
  const addTransaction = async (
    txData: Omit<Transaction, "id" | "createdAt">
  ): Promise<{ success: boolean; error?: string }> => {
    if (mutatingRef.current) return { success: false, error: "Saving previous entry..." };
    const uid = requireAuthUid();
    const targetAcc = accounts.find((a) => a.id === txData.accountId);
    if (!targetAcc) {
      return { success: false, error: "Please select a valid account first." };
    }
    if (!Number.isFinite(txData.amount) || txData.amount <= 0) {
      return { success: false, error: "Amount must be greater than zero." };
    }

    mutatingRef.current = true;
    setIsMutating(true);
    const txId = makeId("tx");

    const updatedAccBalance =
      txData.type === "expense"
        ? targetAcc.balance - txData.amount
        : txData.type === "income"
        ? targetAcc.balance + txData.amount
        : targetAcc.balance;

    try {
      const batch = writeBatch(db);
      if (txData.type === "expense" || txData.type === "income") {
        batch.update(doc(db, "accounts", targetAcc.id), {
          balance: updatedAccBalance,
          updatedAt: serverTimestamp(),
        });
      }

      const payload: Record<string, unknown> = {
        userId: uid,
        accountId: txData.accountId,
        type: txData.type,
        amount: Number(txData.amount),
        category: clampStr(txData.category, 60) || "Other Expenses",
        description: clampStr(txData.description, 180) || "Transaction",
        date: clampStr(txData.date, 10) || new Date().toISOString().split("T")[0],
        time: clampStr(txData.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 24),
        paymentMethod: clampStr(txData.paymentMethod || "UPI", 60),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (txData.destinationAccountId) {
        payload.destinationAccountId = txData.destinationAccountId;
      }
      if (txData.notes) {
        payload.notes = clampStr(txData.notes, 300);
      }

      batch.set(doc(db, "transactions", txId), payload);

      // Guardrail notifications & optional Round-Up Micro-Savings
      const newNotifs: AppNotification[] = [];

      if (
        txData.type === "expense" &&
        userProfile.lowBalanceThreshold &&
        userProfile.lowBalanceThreshold > 0 &&
        updatedAccBalance < userProfile.lowBalanceThreshold
      ) {
        newNotifs.push({
          id: makeId("notif_low"),
          title: "Low Account Balance",
          message: `${targetAcc.name} dropped to ${formatCurrency(updatedAccBalance)} (below ${formatCurrency(userProfile.lowBalanceThreshold)}).`,
          type: "warning",
          time: "Just now",
          read: false,
        });
      }

      if (
        txData.type === "expense" &&
        userProfile.dailySpendLimit &&
        userProfile.dailySpendLimit > 0
      ) {
        const todayStr = new Date().toISOString().split("T")[0];
        if (payload.date === todayStr) {
          const spentToday =
            transactions
              .filter((t) => t.type === "expense" && t.date === todayStr)
              .reduce((sum, t) => sum + t.amount, 0) + txData.amount;
          if (spentToday > userProfile.dailySpendLimit) {
            newNotifs.push({
              id: makeId("notif_daily"),
              title: "Daily Spend Limit Exceeded",
              message: `Today's spending (${formatCurrency(spentToday)}) exceeded your ${formatCurrency(userProfile.dailySpendLimit)} daily cap.`,
              type: "warning",
              time: "Just now",
              read: false,
            });
          }
        }
      }

      if (txData.type === "expense" && userProfile.enableBudgetAlerts) {
        const matchedBudget = budgets.find((b) => b.category === payload.category);
        if (matchedBudget && matchedBudget.limitAmount > 0) {
          const monthPrefix = new Date().toISOString().slice(0, 7);
          const catSpent =
            transactions
              .filter(
                (t) =>
                  t.type === "expense" &&
                  t.category === payload.category &&
                  t.date.startsWith(monthPrefix)
              )
              .reduce((sum, t) => sum + t.amount, 0) +
            (String(payload.date).startsWith(monthPrefix) ? txData.amount : 0);
          const pct = Math.round((catSpent / matchedBudget.limitAmount) * 100);
          if (pct >= 80) {
            newNotifs.push({
              id: makeId("notif_bgt"),
              title: "Budget Threshold Reached",
              message: `${payload.category} is at ${pct}% of your ${formatCurrency(matchedBudget.limitAmount)} budget.`,
              type: "warning",
              time: "Just now",
              read: false,
            });
          }
        }
      }

      if (txData.type === "expense" && userProfile.enableRoundUpSavings && goals.length > 0) {
        const remainder = txData.amount % 10;
        const spareChange = remainder > 0 ? Math.round((10 - remainder) * 100) / 100 : 0;
        if (spareChange > 0 && spareChange < 10) {
          const targetGoal = goals[0];
          const updatedContribs = [
            {
              id: makeId("gc_ru"),
              amount: spareChange,
              date: String(payload.date),
              note: clampStr(`Round-up from "${payload.description}"`, 120),
            },
            ...targetGoal.contributions,
          ].slice(0, 100);

          batch.update(doc(db, "savings_goals", targetGoal.id), {
            currentAmount: targetGoal.currentAmount + spareChange,
            contributions: updatedContribs,
            updatedAt: serverTimestamp(),
          });

          newNotifs.push({
            id: makeId("notif_ru"),
            title: "Round-Up Micro-Saving",
            message: `Added ${formatCurrency(spareChange)} spare change to "${targetGoal.name}".`,
            type: "success",
            time: "Just now",
            read: false,
          });
        }
      }

      await batch.commit();
      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev]);
      }
      showToast(
        `${txData.type === "income" ? "Income" : "Expense"} saved (${formatCurrency(txData.amount)}).`
      );
      return { success: true };
    } catch (error) {
      showToast("Failed to save transaction.", "error");
      handleFirestoreError(error, OperationType.WRITE, `transactions/${txId}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  const editTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<{ success: boolean; error?: string }> => {
    if (mutatingRef.current) return { success: false, error: "Action in progress..." };
    requireAuthUid();
    const existingTx = transactions.find((t) => t.id === id);
    if (!existingTx) return { success: false, error: "Transaction not found" };

    const updatedTx: Transaction = { ...existingTx, ...updates };
    if (!Number.isFinite(updatedTx.amount) || updatedTx.amount <= 0) {
      return { success: false, error: "Amount must be greater than zero." };
    }

    mutatingRef.current = true;
    setIsMutating(true);

    try {
      const batch = writeBatch(db);
      const balanceDeltas = new Map<string, number>();

      const addDelta = (accId: string | undefined, delta: number) => {
        if (!accId) return;
        balanceDeltas.set(accId, (balanceDeltas.get(accId) || 0) + delta);
      };

      // Rollback old balance impact
      if (existingTx.type === "expense") addDelta(existingTx.accountId, existingTx.amount);
      else if (existingTx.type === "income") addDelta(existingTx.accountId, -existingTx.amount);
      else if (existingTx.type === "transfer") {
        addDelta(existingTx.accountId, existingTx.amount);
        addDelta(existingTx.destinationAccountId, -existingTx.amount);
      }

      // Apply new balance impact
      if (updatedTx.type === "expense") addDelta(updatedTx.accountId, -updatedTx.amount);
      else if (updatedTx.type === "income") addDelta(updatedTx.accountId, updatedTx.amount);
      else if (updatedTx.type === "transfer") {
        addDelta(updatedTx.accountId, -updatedTx.amount);
        addDelta(updatedTx.destinationAccountId, updatedTx.amount);
      }

      balanceDeltas.forEach((delta, accId) => {
        if (delta === 0) return;
        const acc = accounts.find((a) => a.id === accId);
        if (acc) {
          batch.update(doc(db, "accounts", accId), {
            balance: acc.balance + delta,
            updatedAt: serverTimestamp(),
          });
        }
      });

      const txPayload: Record<string, unknown> = {
        accountId: updatedTx.accountId,
        type: updatedTx.type,
        amount: Number(updatedTx.amount),
        category: clampStr(updatedTx.category, 60),
        description: clampStr(updatedTx.description, 180),
        date: clampStr(updatedTx.date, 10),
        paymentMethod: clampStr(updatedTx.paymentMethod, 60),
        updatedAt: serverTimestamp(),
      };
      if (updatedTx.destinationAccountId) {
        txPayload.destinationAccountId = updatedTx.destinationAccountId;
      }
      if (updatedTx.time !== undefined) {
        txPayload.time = clampStr(updatedTx.time, 24);
      }
      if (updatedTx.notes !== undefined) {
        txPayload.notes = clampStr(updatedTx.notes, 300);
      }

      batch.update(doc(db, "transactions", id), txPayload);
      await batch.commit();
      showToast("Transaction updated.");
      return { success: true };
    } catch (error) {
      showToast("Failed to update transaction.", "error");
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    requireAuthUid();
    const existingTx = transactions.find((t) => t.id === id);
    if (!existingTx) return;

    try {
      const batch = writeBatch(db);
      const sourceAcc = accounts.find((a) => a.id === existingTx.accountId);
      if (sourceAcc) {
        if (existingTx.type === "expense") {
          batch.update(doc(db, "accounts", sourceAcc.id), {
            balance: sourceAcc.balance + existingTx.amount,
            updatedAt: serverTimestamp(),
          });
        } else if (existingTx.type === "income") {
          batch.update(doc(db, "accounts", sourceAcc.id), {
            balance: sourceAcc.balance - existingTx.amount,
            updatedAt: serverTimestamp(),
          });
        } else if (existingTx.type === "transfer") {
          batch.update(doc(db, "accounts", sourceAcc.id), {
            balance: sourceAcc.balance + existingTx.amount,
            updatedAt: serverTimestamp(),
          });
          if (existingTx.destinationAccountId) {
            const destAcc = accounts.find((a) => a.id === existingTx.destinationAccountId);
            if (destAcc) {
              batch.update(doc(db, "accounts", destAcc.id), {
                balance: destAcc.balance - existingTx.amount,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }

      batch.delete(doc(db, "transactions", id));
      await batch.commit();
      showToast("Transaction deleted & balance restored.");
    } catch (error) {
      showToast("Failed to delete transaction.", "error");
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  // ==================== CATEGORIES CRUD ====================
  const addCategory = async (cat: Omit<UserCategory, "id" | "createdAt">) => {
    const uid = requireAuthUid();
    const id = makeId("cat");
    try {
      await setDoc(doc(db, "categories", id), {
        userId: uid,
        name: clampStr(cat.name, 60),
        type: cat.type,
        icon: clampStr(cat.icon || "Tag", 40),
        color: clampStr(cat.color || "#6366f1", 30),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Category "${cat.name}" added.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "categories", id));
      showToast("Category removed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  // ==================== CARDS & TRANSIT ====================
  const addVirtualCard = async (card: Omit<VirtualCard, "id">) => {
    const uid = requireAuthUid();
    const id = makeId("card");
    try {
      const payload: Record<string, unknown> = {
        userId: uid,
        nickname: clampStr(card.nickname, 80) || "Card",
        provider: clampStr(card.provider, 80) || "Provider",
        cardType: card.cardType,
        lastFour: clampStr(card.lastFour || "0000", 10),
        cardDesign: clampStr(card.cardDesign || "metro_cyan", 40),
        status: card.status || "active",
        isPinned: Boolean(card.isPinned),
        transitBalance: Number(card.transitBalance ?? 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (card.linkedAccountId) payload.linkedAccountId = card.linkedAccountId;
      if (card.fullNumber) payload.fullNumber = clampStr(card.fullNumber, 40);
      if (card.holderName) payload.holderName = clampStr(card.holderName, 80);
      if (card.validTill) payload.validTill = clampStr(card.validTill, 40);
      if (card.issuingAuthority) payload.issuingAuthority = clampStr(card.issuingAuthority, 80);
      if (card.notes) payload.notes = clampStr(card.notes, 240);

      await setDoc(doc(db, "cards", id), payload);
      showToast(`"${payload.nickname}" added to carousel.`);
    } catch (error) {
      showToast("Failed to add card.", "error");
      handleFirestoreError(error, OperationType.CREATE, `cards/${id}`);
    }
  };

  const updateVirtualCard = async (id: string, updates: Partial<VirtualCard>) => {
    requireAuthUid();
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.nickname !== undefined) payload.nickname = clampStr(updates.nickname, 80);
      if (updates.provider !== undefined) payload.provider = clampStr(updates.provider, 80);
      if (updates.holderName !== undefined) payload.holderName = clampStr(updates.holderName, 80);
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.isPinned !== undefined) payload.isPinned = Boolean(updates.isPinned);
      if (updates.notes !== undefined) payload.notes = clampStr(updates.notes, 240);
      if (updates.validTill !== undefined) payload.validTill = clampStr(updates.validTill, 40);
      if (updates.transitBalance !== undefined) payload.transitBalance = Math.max(0, Number(updates.transitBalance) || 0);

      await updateDoc(doc(db, "cards", id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${id}`);
    }
  };

  const deleteVirtualCard = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "cards", id));
      showToast("Card removed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cards/${id}`);
    }
  };

  const recordTransitTrip = async (
    tripData: Omit<TransitTripLog, "id" | "createdAt" | "balanceAfter">
  ): Promise<{ success: boolean; error?: string }> => {
    if (mutatingRef.current) return { success: false, error: "Action in progress..." };
    const uid = requireAuthUid();
    const card = cards.find((c) => c.id === tripData.cardId);
    if (!card) return { success: false, error: "Transit card not found" };

    const currentBal = Number(card.transitBalance ?? 0);
    if (!Number.isFinite(tripData.amount) || tripData.amount <= 0) {
      return { success: false, error: "Ride fare must be greater than zero." };
    }
    if (currentBal < tripData.amount) {
      return {
        success: false,
        error: `Insufficient transit balance (Available: ${formatCurrency(currentBal)}, Fare: ${formatCurrency(tripData.amount)}). Please recharge your card.`,
      };
    }

    mutatingRef.current = true;
    setIsMutating(true);
    const newBalance = currentBal - tripData.amount;
    const tripId = makeId("tt");
    const txId = makeId("tx_transit");

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "cards", card.id), {
        transitBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      const tripPayload: Record<string, unknown> = {
        userId: uid,
        cardId: card.id,
        type: "ride",
        mode: tripData.mode,
        amount: tripData.amount,
        balanceAfter: newBalance,
        date: clampStr(tripData.date, 10) || new Date().toISOString().split("T")[0],
        time: clampStr(tripData.time, 24) || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (tripData.fromStation) tripPayload.fromStation = clampStr(tripData.fromStation, 80);
      if (tripData.toStation) tripPayload.toStation = clampStr(tripData.toStation, 80);
      if (tripData.routeNumber) tripPayload.routeNumber = clampStr(tripData.routeNumber, 60);
      if (tripData.notes) tripPayload.notes = clampStr(tripData.notes, 240);

      batch.set(doc(db, "transit_trips", tripId), tripPayload);

      // Record commute activity using card.id or linked account without touching bank balance
      batch.set(doc(db, "transactions", txId), {
        userId: uid,
        accountId: card.linkedAccountId || card.id,
        type: "expense",
        amount: tripData.amount,
        category: "Transportation",
        description: clampStr(
          `${tripData.mode.toUpperCase()}: ${tripData.fromStation || "Origin"} → ${tripData.toStation || "Destination"}`,
          180
        ),
        date: String(tripPayload.date),
        time: String(tripPayload.time),
        paymentMethod: clampStr(`Transit Card (${card.nickname})`, 60),
        notes: clampStr(
          tripData.routeNumber ? `Route/Line: ${tripData.routeNumber}` : "Travel card fare tap",
          300
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      showToast(`Commute ride logged (${formatCurrency(tripData.amount)}).`);
      return { success: true };
    } catch (error) {
      showToast("Failed to record transit trip.", "error");
      handleFirestoreError(error, OperationType.WRITE, `transit_trips/${tripId}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  const rechargeTransitCard = async (
    cardId: string,
    amount: number,
    sourceAccountId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (mutatingRef.current) return { success: false, error: "Action in progress..." };
    const uid = requireAuthUid();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return { success: false, error: "Transit card not found" };

    const sourceAcc = accounts.find((a) => a.id === sourceAccountId);
    if (!sourceAcc) return { success: false, error: "Source payment account not found" };
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Recharge amount must be greater than zero." };
    }
    if (sourceAcc.balance < amount) {
      return {
        success: false,
        error: `Insufficient funds in ${sourceAcc.name} (Balance: ${formatCurrency(sourceAcc.balance)})`,
      };
    }

    mutatingRef.current = true;
    setIsMutating(true);
    const newBal = Number(card.transitBalance ?? 0) + amount;
    const tripId = makeId("tt_rec");
    const txId = makeId("tx_rec");
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "accounts", sourceAccountId), {
        balance: sourceAcc.balance - amount,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "cards", cardId), {
        transitBalance: newBal,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, "transit_trips", tripId), {
        userId: uid,
        cardId,
        type: "recharge",
        mode: "metro",
        amount,
        balanceAfter: newBal,
        sourceAccountId,
        date: todayStr,
        time: nowTime,
        notes: clampStr(notes || `Recharged via ${sourceAcc.name}`, 240),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, "transactions", txId), {
        userId: uid,
        accountId: sourceAccountId,
        type: "expense",
        amount,
        category: "Transportation",
        description: clampStr(`Transit Card Recharge: ${card.nickname}`, 180),
        date: todayStr,
        time: nowTime,
        paymentMethod: sourceAcc.accountType === "cash" ? "Cash" : "Bank Transfer / UPI",
        notes: clampStr(notes || `Card ${card.lastFour} top-up from ${sourceAcc.name}`, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      showToast(`Recharged ${card.nickname} with ${formatCurrency(amount)}.`);
      return { success: true };
    } catch (error) {
      showToast("Transit recharge failed.", "error");
      handleFirestoreError(error, OperationType.WRITE, `transit_trips/${tripId}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  // ==================== FEEDBACK ====================
  const submitFeedback = async (fb: Omit<FeedbackItem, "id" | "submittedAt">) => {
    const uid = requireAuthUid();
    const id = makeId("fb");
    const submittedAt = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      await setDoc(doc(db, "feedback", id), {
        userId: uid,
        category: fb.category,
        rating: Math.min(5, Math.max(1, Number(fb.rating) || 5)),
        comment: clampStr(fb.comment, 1000),
        submittedAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fb,
          userName: userProfile.name,
          userEmail: userProfile.email,
        }),
      }).catch(() => {});

      showToast("Feedback saved. Thank you!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `feedback/${id}`);
    }
  };

  // ==================== LOANS ====================
  const addLoan = async (
    loanData: Omit<LoanRecord, "id" | "outstandingAmount" | "status" | "repayments" | "createdAt">
  ) => {
    const uid = requireAuthUid();
    const id = makeId("loan");
    try {
      const payload: Record<string, unknown> = {
        userId: uid,
        type: loanData.type,
        personName: clampStr(loanData.personName, 80) || "Contact",
        originalAmount: Number(loanData.originalAmount) || 0,
        outstandingAmount: Number(loanData.originalAmount) || 0,
        startDate: clampStr(loanData.startDate, 20),
        dueDate: clampStr(loanData.dueDate, 20),
        description: clampStr(loanData.description, 240),
        status: "active",
        repayments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (loanData.personContact) {
        payload.personContact = clampStr(loanData.personContact, 60);
      }

      await setDoc(doc(db, "loans", id), payload);
      showToast("Loan record saved.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `loans/${id}`);
    }
  };

  const recordRepayment = async (
    loanId: string,
    repaymentData: Omit<Repayment, "id" | "loanId">
  ) => {
    requireAuthUid();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status === "settled") return;

    const newRepayment: Repayment = {
      ...repaymentData,
      id: makeId("rep"),
      loanId,
    };
    const newOutstanding = Math.max(0, loan.outstandingAmount - repaymentData.amount);
    const status = newOutstanding === 0 ? "settled" : loan.status;

    try {
      await updateDoc(doc(db, "loans", loanId), {
        outstandingAmount: newOutstanding,
        status,
        repayments: [...loan.repayments, newRepayment].slice(0, 50),
        updatedAt: serverTimestamp(),
      });
      showToast(status === "settled" ? "Loan fully settled!" : "Repayment recorded.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `loans/${loanId}`);
    }
  };

  const deleteLoan = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "loans", id));
      showToast("Loan record removed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `loans/${id}`);
    }
  };

  // ==================== GROUPS ====================
  const addGroup = async (name: string, description: string, memberNames: string[]) => {
    const uid = requireAuthUid();
    const id = makeId("grp");
    try {
      await setDoc(doc(db, "groups", id), {
        userId: uid,
        name: clampStr(name, 80) || "Group",
        description: clampStr(description, 240),
        members: [
          { id: "mem_me", name: `${userProfile.name || "You"} (You)`, isCurrentUser: true },
          ...memberNames.slice(0, 24).map((m, i) => ({ id: `mem_${Date.now()}_${i}`, name: clampStr(m, 60) })),
        ],
        expenses: [],
        settlements: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Group "${name}" created.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `groups/${id}`);
    }
  };

  const addGroupExpense = async (
    groupId: string,
    expenseData: Omit<GroupExpense, "id" | "createdAt">
  ) => {
    requireAuthUid();
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return;
    const newExpense: GroupExpense = {
      ...expenseData,
      id: makeId("gexp"),
      createdAt: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, "groups", groupId), {
        expenses: [newExpense, ...grp.expenses].slice(0, 200),
        updatedAt: serverTimestamp(),
      });
      showToast("Group expense recorded.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const recordGroupSettlement = async (
    groupId: string,
    settlementData: Omit<GroupSettlement, "id">
  ) => {
    requireAuthUid();
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return;
    const newSettlement: GroupSettlement = {
      ...settlementData,
      id: makeId("gset"),
    };
    try {
      await updateDoc(doc(db, "groups", groupId), {
        settlements: [newSettlement, ...grp.settlements].slice(0, 100),
        updatedAt: serverTimestamp(),
      });
      showToast("Group settlement recorded.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  // ==================== BUDGETS ====================
  const addBudget = async (budgetData: Omit<Budget, "id">) => {
    const uid = requireAuthUid();
    const id = makeId("bgt");
    try {
      await setDoc(doc(db, "budgets", id), {
        userId: uid,
        category: clampStr(budgetData.category, 60),
        limitAmount: Number(budgetData.limitAmount) || 0,
        period: budgetData.period,
        monthYear: clampStr(budgetData.monthYear, 7),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Budget set for ${budgetData.category}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `budgets/${id}`);
    }
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
    requireAuthUid();
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.category !== undefined) payload.category = clampStr(updates.category, 60);
      if (updates.limitAmount !== undefined) payload.limitAmount = Number(updates.limitAmount) || 0;
      if (updates.period !== undefined) payload.period = updates.period;
      if (updates.monthYear !== undefined) payload.monthYear = clampStr(updates.monthYear, 7);
      await updateDoc(doc(db, "budgets", id), payload);
      showToast("Budget updated.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `budgets/${id}`);
    }
  };

  const deleteBudget = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "budgets", id));
      showToast("Budget deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `budgets/${id}`);
    }
  };

  // ==================== SAVINGS GOALS ====================
  const addGoal = async (
    goalData: Omit<SavingsGoal, "id" | "currentAmount" | "contributions" | "createdAt">
  ) => {
    const uid = requireAuthUid();
    const id = makeId("goal");
    try {
      const payload: Record<string, unknown> = {
        userId: uid,
        name: clampStr(goalData.name, 100),
        targetAmount: Number(goalData.targetAmount) || 0,
        currentAmount: 0,
        targetDate: clampStr(goalData.targetDate, 20),
        category: clampStr(goalData.category || "Savings", 60),
        contributions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (goalData.description) {
        payload.description = clampStr(goalData.description, 240);
      }

      await setDoc(doc(db, "savings_goals", id), payload);
      showToast(`Goal "${goalData.name}" created.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `savings_goals/${id}`);
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, note?: string) => {
    requireAuthUid();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !Number.isFinite(amount) || amount <= 0) return;

    const contribution = {
      id: makeId("gc"),
      amount,
      date: new Date().toISOString().split("T")[0],
      note: clampStr(note || "Contribution added", 120),
    };

    try {
      await updateDoc(doc(db, "savings_goals", goalId), {
        currentAmount: goal.currentAmount + amount,
        contributions: [contribution, ...goal.contributions].slice(0, 100),
        updatedAt: serverTimestamp(),
      });
      showToast(`Added ${formatCurrency(amount)} to "${goal.name}".`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `savings_goals/${goalId}`);
    }
  };

  const deleteGoal = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "savings_goals", id));
      showToast("Savings goal deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savings_goals/${id}`);
    }
  };

  // ==================== RECURRING TRANSACTIONS / SUBSCRIPTIONS ====================
  const addSubscription = async (subData: Omit<Subscription, "id">) => {
    const uid = requireAuthUid();
    const id = makeId("rec");
    try {
      await setDoc(doc(db, "recurring_transactions", id), {
        userId: uid,
        name: clampStr(subData.name, 100),
        amount: Number(subData.amount) || 0,
        billingFrequency: subData.billingFrequency,
        nextRenewalDate: clampStr(subData.nextRenewalDate, 20),
        accountId: clampStr(subData.accountId, 128),
        category: clampStr(subData.category || "Entertainment & Subs", 60),
        status: subData.status || "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Recurring item "${subData.name}" added.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `recurring_transactions/${id}`);
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    requireAuthUid();
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.name !== undefined) payload.name = clampStr(updates.name, 100);
      if (updates.amount !== undefined) payload.amount = Number(updates.amount) || 0;
      if (updates.billingFrequency !== undefined) payload.billingFrequency = updates.billingFrequency;
      if (updates.nextRenewalDate !== undefined) payload.nextRenewalDate = clampStr(updates.nextRenewalDate, 20);
      if (updates.accountId !== undefined) payload.accountId = clampStr(updates.accountId, 128);
      if (updates.category !== undefined) payload.category = clampStr(updates.category, 60);
      if (updates.status !== undefined) payload.status = updates.status;

      await updateDoc(doc(db, "recurring_transactions", id), payload);
      showToast("Subscription updated.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recurring_transactions/${id}`);
    }
  };

  const deleteSubscription = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "recurring_transactions", id));
      showToast("Subscription deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recurring_transactions/${id}`);
    }
  };

  // ==================== REMINDERS ====================
  const addReminder = async (remData: Omit<FinancialReminder, "id">) => {
    const uid = requireAuthUid();
    const id = makeId("rem");
    try {
      const payload: Record<string, unknown> = {
        userId: uid,
        title: clampStr(remData.title, 120),
        date: clampStr(remData.date, 20),
        type: remData.type,
        isCompleted: Boolean(remData.isCompleted),
        recurrence: remData.recurrence || "none",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (remData.amount !== undefined) payload.amount = Number(remData.amount) || 0;

      await setDoc(doc(db, "reminders", id), payload);
      showToast("Reminder added.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reminders/${id}`);
    }
  };

  const toggleReminder = async (id: string) => {
    requireAuthUid();
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;
    try {
      await updateDoc(doc(db, "reminders", id), {
        isCompleted: !rem.isCompleted,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reminders/${id}`);
    }
  };

  const deleteReminder = async (id: string) => {
    requireAuthUid();
    try {
      await deleteDoc(doc(db, "reminders", id));
      showToast("Reminder deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reminders/${id}`);
    }
  };

  // ==================== EXPORTS ====================
  const addExportHistory = async (item: Omit<ExportHistoryItem, "id">) => {
    const uid = requireAuthUid();
    const id = makeId("exp");
    try {
      await setDoc(doc(db, "exports", id), {
        userId: uid,
        title: clampStr(item.title, 120),
        generatedAt: clampStr(item.generatedAt, 60),
        format: item.format,
        filterSummary: clampStr(item.filterSummary, 160),
        recordCount: Number(item.recordCount) || 0,
        fileSizeEstimate: clampStr(item.fileSizeEstimate, 30),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `exports/${id}`);
    }
  };

  // ==================== ONBOARDING WORKSPACE SETUP (ZERO DEMO DATA) ====================
  const setupUserWorkspace = async (opts: {
    name: string;
    email: string;
    cashInHand: number;
    currency: string;
    currencySymbol: string;
    occupation: OccupationType;
    isHostelResident: boolean;
    avatarUrl?: string;
  }) => {
    if (mutatingRef.current) return;
    const uid = requireAuthUid();
    mutatingRef.current = true;
    setIsMutating(true);

    const cleanName = clampStr(opts.name || authUser?.displayName || opts.email.split("@")[0] || "User", 100);
    const cleanEmail = clampStr(opts.email || authUser?.email || "", 200);
    const safeCash = Number.isFinite(opts.cashInHand) && opts.cashInHand > 0 ? opts.cashInHand : 0;

    try {
      const batch = writeBatch(db);

      const userPayload: Record<string, unknown> = {
        id: uid,
        userId: uid,
        name: cleanName,
        email: cleanEmail,
        avatarUrl: clampStr(opts.avatarUrl || authUser?.photoURL || "", 150000),
        occupation: opts.occupation,
        country: "India",
        preferredLanguage: "English",
        currency: clampStr(opts.currency || "INR", 10),
        currencySymbol: clampStr(opts.currencySymbol || "₹", 8),
        themePreference: theme,
        isOnboarded: true,
        isHostelResident: Boolean(opts.isHostelResident),
        monthlyIncomeOrAllowance: 0,
        incomeFrequency: "monthly",
        salaryOrAllowanceDate: 1,
        defaultPaymentMethod: "UPI",
        dailySpendLimit: 0,
        lowBalanceThreshold: 0,
        enableBudgetAlerts: true,
        enableBillReminders: true,
        enableRoundUpSavings: false,
        hideBalancesOnLaunch: false,
        appPin: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(doc(db, "users", uid), userPayload);

      // Only create initial Cash Wallet if user explicitly provided an opening cash balance > 0
      if (safeCash > 0 && accounts.length === 0) {
        const cashId = makeId("acc_cash");
        batch.set(doc(db, "accounts", cashId), {
          userId: uid,
          name: "Cash Wallet",
          bankName: "Cash on Hand",
          bankCode: "CASH",
          accountType: "cash",
          balance: safeCash,
          openingBalance: safeCash,
          currency: clampStr(opts.currency || "INR", 10),
          maskedNumber: "•••• CASH",
          colorGradient: "from-[#059669] via-[#047857] to-[#064e3b]",
          isDefault: true,
          isArchived: false,
          isHidden: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Seed user's default categories in Firestore if none exist yet
      if (categories.length === 0) {
        EXPENSE_CATEGORIES.forEach((cat) => {
          batch.set(doc(db, "categories", makeId(`cat_exp_${cat.id}`)), {
            userId: uid,
            name: clampStr(cat.name, 60),
            type: "expense",
            icon: clampStr(cat.icon, 40),
            color: clampStr(cat.color, 30),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        INCOME_CATEGORIES.forEach((cat) => {
          batch.set(doc(db, "categories", makeId(`cat_inc_${cat.id}`)), {
            userId: uid,
            name: clampStr(cat.name, 60),
            type: "income",
            icon: clampStr(cat.icon, 40),
            color: clampStr(cat.color, 30),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();
      showToast(`Welcome to FINORA, ${cleanName}!`);
    } catch (error) {
      showToast("Failed to set up your workspace.", "error");
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    } finally {
      mutatingRef.current = false;
      setIsMutating(false);
    }
  };

  // ==================== CLEAR ALL USER DATA IN FIRESTORE ====================
  const clearAllData = async () => {
    const uid = requireAuthUid();
    const userCollections = [
      "accounts",
      "transactions",
      "categories",
      "budgets",
      "savings_goals",
      "recurring_transactions",
      "loans",
      "groups",
      "cards",
      "transit_trips",
      "reminders",
      "exports",
      "feedback",
    ];

    try {
      const refsToDelete: Array<ReturnType<typeof doc>> = [];
      for (const colName of userCollections) {
        const snap = await getDocs(query(collection(db, colName), where("userId", "==", uid)));
        snap.docs.forEach((d) => refsToDelete.push(d.ref));
      }

      for (let i = 0; i < refsToDelete.length; i += 450) {
        const chunk = refsToDelete.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      await updateDoc(doc(db, "users", uid), {
        monthlyIncomeOrAllowance: 0,
        dailySpendLimit: 0,
        lowBalanceThreshold: 0,
        updatedAt: serverTimestamp(),
      });

      setNotifications([]);
      showToast("All cloud records cleared.");
    } catch (error) {
      showToast("Failed to clear cloud records.", "error");
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        authUser,
        authLoading,
        dataLoading,
        isMutating,
        toast,
        dismissToast,
        showToast,
        userProfile,
        accounts,
        transactions,
        categories,
        cards,
        transitTrips,
        recordTransitTrip,
        rechargeTransitCard,
        feedbackList,
        submitFeedback,
        loans,
        groups,
        budgets,
        goals,
        subscriptions,
        reminders,
        exportHistory,
        theme,
        activeTab,
        isAuthenticated,
        setIsAuthenticated,
        notifications,
        unreadNotificationCount,
        totalTrackedBalance,
        cashInHand,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        yearlyIncome,
        yearlyExpenses,
        yearlySavings,
        totalToReceive,
        totalToPay,
        budgetUtilization,
        monthlySubscriptionTotal,
        financialHealthScore,
        setActiveTab,
        setTheme,
        toggleTheme,
        refreshAuthUser,
        logoutUser,
        updateUserProfile,
        formatCurrency,
        markNotificationAsRead,
        clearNotifications,
        addAccount,
        editAccount,
        deleteAccount,
        toggleHideAccountBalance,
        transferBetweenAccounts,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        addVirtualCard,
        updateVirtualCard,
        deleteVirtualCard,
        addLoan,
        recordRepayment,
        deleteLoan,
        addGroup,
        addGroupExpense,
        recordGroupSettlement,
        addBudget,
        editBudget,
        deleteBudget,
        addGoal,
        contributeToGoal,
        deleteGoal,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        addReminder,
        toggleReminder,
        deleteReminder,
        addExportHistory,
        setupUserWorkspace,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
