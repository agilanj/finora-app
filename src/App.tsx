/**
 * FINORA – Complete Personal Finance Management Web Application
 */

import React, { useState, useEffect, useRef } from "react";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { Header } from "./components/common/Header";
import { DesktopSidebar } from "./components/layout/DesktopSidebar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { DashboardView } from "./components/dashboard/DashboardView";
import { AccountsView } from "./components/accounts/AccountsView";
import { TransactionsView } from "./components/transactions/TransactionsView";
import { BorrowLendView } from "./components/loans/BorrowLendView";
import { BudgetsView } from "./components/budgets/BudgetsView";
import { HostelModeView } from "./components/hostel/HostelModeView";
import { GroupsView } from "./components/groups/GroupsView";
import { ReportsView } from "./components/reports/ReportsView";
import { AIAssistantView } from "./components/ai/AIAssistantView";
import { SettingsView } from "./components/settings/SettingsView";
import { AboutView } from "./components/about/AboutView";
import { AmbientBackground } from "./components/common/AmbientBackground";
import { BRAND } from "./config/brand";

// Modals & Auth
import { AddTransactionModal } from "./components/transactions/AddTransactionModal";
import { SmartEntryModal } from "./components/ai/SmartEntryModal";
import { TransferModal } from "./components/accounts/TransferModal";
import { AddAccountModal } from "./components/accounts/AddAccountModal";
import { EditAccountModal } from "./components/accounts/EditAccountModal";
import { AuthOnboardingFlow } from "./components/auth/AuthOnboardingFlow";
import { PinLockScreen } from "./components/auth/PinLockScreen";
import { Account, Transaction } from "./types/finance";
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from "lucide-react";

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    isAuthenticated,
    setIsAuthenticated,
    authLoading,
    dataLoading,
    userProfile,
    logoutUser,
    toast,
    dismissToast,
  } = useFinance();

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // PIN lock state (lock once per authenticated session if user has configured a 4-digit PIN)
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const pinInitializedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      pinInitializedForUid.current = null;
      setIsPinLocked(false);
      return;
    }
    if (userProfile.id && pinInitializedForUid.current !== userProfile.id) {
      pinInitializedForUid.current = userProfile.id;
      if (userProfile.appPin) {
        setIsPinLocked(true);
      }
    }
  }, [isAuthenticated, userProfile.id, userProfile.appPin]);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"expense" | "income" | "transfer">("expense");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSmartAIOpen, setIsSmartAIOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const openQuickAdd = (initialType: "expense" | "income" | "transfer" = "expense") => {
    setEditingTransaction(null);
    setQuickAddType(initialType);
    setIsQuickAddOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setQuickAddType(tx.type);
    setIsQuickAddOpen(true);
  };

  const handleOpenTransfer = (sourceAccountId?: string) => {
    setTransferSourceAccountId(sourceAccountId);
    setIsTransferOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
  };

  // Loading state while verifying session or syncing initial Firestore snapshot
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05060E] text-white p-6">
        <img
          src={BRAND.logoUrl}
          alt={BRAND.name}
          className="w-16 h-16 object-contain rounded-2xl bg-white p-1.5 shadow-2xl mb-4"
        />
        <h1 className="font-finora text-2xl font-black tracking-[0.18em] bg-gradient-to-r from-indigo-300 via-violet-200 to-amber-300 bg-clip-text text-transparent mb-3">
          {BRAND.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>{authLoading ? "Checking session..." : "Syncing your FINORA vault..."}</span>
        </div>
      </div>
    );
  }

  // Initial Sign Up -> Email Verification -> Profile Selection flow
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AuthOnboardingFlow
          onComplete={() => {
            setIsAuthenticated(true);
            setIsPinLocked(false);
          }}
        />
      </div>
    );
  }

  // App Lock PIN Screen
  if (isPinLocked && userProfile.appPin) {
    return (
      <PinLockScreen
        expectedPin={userProfile.appPin}
        userName={userProfile.name}
        onUnlock={() => setIsPinLocked(false)}
        onSignOut={() => {
          setIsPinLocked(false);
          logoutUser();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors relative">
      {/* Background Animated Royal Gradients & Canvas Particles */}
      <AmbientBackground />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-[60] max-w-sm animate-fade-up">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl text-xs font-semibold ${
              toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                : toast.type === "info"
                ? "bg-indigo-950/90 border-indigo-400/40 text-indigo-100"
                : "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === "info" ? (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Minimalist Header */}
      <Header
        onOpenQuickAdd={() => openQuickAdd("expense")}
        onOpenSmartAI={() => setIsSmartAIOpen(true)}
        onOpenTransfer={() => handleOpenTransfer()}
        onLockApp={() => setIsPinLocked(true)}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar Navigation */}
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-3.5 py-5 sm:px-6 md:px-8 max-w-6xl mx-auto w-full pb-24 md:pb-8">
          {activeTab === "dashboard" && (
            <DashboardView
              onOpenQuickAdd={openQuickAdd}
              onOpenSmartAI={() => setIsSmartAIOpen(true)}
              onOpenTransfer={handleOpenTransfer}
              onOpenAddAccount={() => setIsAddAccountOpen(true)}
              onEditAccount={handleEditAccount}
            />
          )}

          {activeTab === "accounts" && (
            <AccountsView
              onOpenAddAccount={() => setIsAddAccountOpen(true)}
              onOpenTransfer={handleOpenTransfer}
              onEditAccount={handleEditAccount}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsView
              onOpenQuickAdd={() => openQuickAdd("expense")}
              onOpenSmartAI={() => setIsSmartAIOpen(true)}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {activeTab === "loans" && <BorrowLendView />}
          {activeTab === "budgets" && <BudgetsView />}
          {activeTab === "hostel" && <HostelModeView />}
          {activeTab === "groups" && <GroupsView />}
          {activeTab === "reports" && <ReportsView />}
          {activeTab === "ai" && <AIAssistantView />}
          {activeTab === "about" && <AboutView />}
          {activeTab === "settings" && (
            <SettingsView onLockApp={() => setIsPinLocked(true)} />
          )}
        </main>
      </div>

      {/* Mobile Ergonomic Floating Glass Dock */}
      <MobileBottomNav onOpenQuickAdd={() => openQuickAdd("expense")} />

      {/* Interactive Modals */}
      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingTransaction(null);
        }}
        onOpenSmartAI={() => setIsSmartAIOpen(true)}
        onOpenAddAccount={() => {
          setIsQuickAddOpen(false);
          setIsAddAccountOpen(true);
        }}
        initialType={quickAddType}
        editingTransaction={editingTransaction}
      />

      <SmartEntryModal
        isOpen={isSmartAIOpen}
        onClose={() => setIsSmartAIOpen(false)}
        onOpenManualModal={() => openQuickAdd("expense")}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setTransferSourceAccountId(undefined);
        }}
        initialSourceAccountId={transferSourceAccountId}
      />

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />

      <EditAccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
