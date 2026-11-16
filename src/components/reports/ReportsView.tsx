import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { EXPENSE_CATEGORIES } from "../../config/brand";
import {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport,
  downloadBlob,
} from "../../utils/export";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const { transactions, accounts, categories, exportHistory, addExportHistory, userProfile } = useFinance();

  const categoryFilterOptions = Array.from(
    new Set([
      ...EXPENSE_CATEGORIES.map((c) => c.name),
      ...categories.map((c) => c.name),
    ])
  );

  const [period, setPeriod] = useState<string>("this_month");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentMonthPrefix = todayStr.slice(0, 7);
  const currentYearPrefix = todayStr.slice(0, 4);
  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayShortLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const getFilteredTransactions = () => {
    return transactions.filter((tx) => {
      if (selectedType !== "all" && tx.type !== selectedType) return false;
      if (selectedCategory !== "all" && tx.category !== selectedCategory) return false;
      if (
        selectedAccountId !== "all" &&
        tx.accountId !== selectedAccountId &&
        tx.destinationAccountId !== selectedAccountId
      )
        return false;

      if (period === "this_month" && !tx.date.startsWith(currentMonthPrefix)) return false;
      if (period === "today" && tx.date !== todayStr) return false;
      if (period === "this_year" && !tx.date.startsWith(currentYearPrefix)) return false;

      return true;
    });
  };

  const periodLabelMap: Record<string, string> = {
    this_month: currentMonthLabel,
    today: `Today (${todayShortLabel})`,
    this_year: `Year ${currentYearPrefix}`,
    all: "All Time Ledger",
  };

  const handleExport = (format: "pdf" | "xlsx" | "csv") => {
    setIsExporting(format);
    const filtered = getFilteredTransactions();
    const periodLabel = periodLabelMap[period] || "Period";
    const filters = {
      periodLabel,
      accountId: selectedAccountId !== "all" ? selectedAccountId : undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      transactionType: selectedType !== "all" ? selectedType : undefined,
    };

    try {
      if (format === "pdf") {
        const { blob, filename } = generatePDFReport(
          filtered,
          accounts,
          filters,
          userProfile.currencySymbol || "₹"
        );
        downloadBlob(blob, filename);
        addExportHistory({
          title: `Statement ${periodLabel}`,
          generatedAt: new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          format: "pdf",
          filterSummary: `${periodLabel} · ${filtered.length} records`,
          recordCount: filtered.length,
          fileSizeEstimate: "145 KB",
        });
      } else if (format === "xlsx") {
        const { blob, filename } = generateExcelReport(
          filtered,
          accounts,
          filters,
          userProfile.currencySymbol || "₹"
        );
        downloadBlob(blob, filename);
        addExportHistory({
          title: `Excel Workbook ${periodLabel}`,
          generatedAt: new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          format: "xlsx",
          filterSummary: `${periodLabel} · Multi-sheet structured ledger`,
          recordCount: filtered.length,
          fileSizeEstimate: "32 KB",
        });
      } else if (format === "csv") {
        const { blob, filename } = generateCSVReport(filtered, accounts, filters);
        downloadBlob(blob, filename);
        addExportHistory({
          title: `CSV Transactions ${periodLabel}`,
          generatedAt: new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          format: "csv",
          filterSummary: `${periodLabel} · Raw comma-separated data`,
          recordCount: filtered.length,
          fileSizeEstimate: "14 KB",
        });
      }
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  const currentFilteredCount = getFilteredTransactions().length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Financial History Export & Reports
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Generate official PDF statements, multi-sheet Excel spreadsheets, and CSV ledgers with verified accounting.
        </p>
      </div>

      {/* Filter Configuration Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          1. Select Report Filters & Scope
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1">
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="this_month">This Month ({currentMonthLabel})</option>
              <option value="today">Today ({todayShortLabel})</option>
              <option value="this_year">This Year ({currentYearPrefix})</option>
              <option value="all">All Available Records</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1">
              Account Selection
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Accounts Consolidated</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Categories</option>
              {categoryFilterOptions.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1">
              Transaction Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="all">All Types (Income, Expense, Transfer)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Internal Transfers Only</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)]">
          <span>
            Matched records in scope:{" "}
            <strong className="text-[var(--text-primary)]">{currentFilteredCount} transactions</strong>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for instant generation</span>
          </span>
        </div>
      </div>

      {/* Download Action Cards */}
      <div>
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
          2. Choose Download Format
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PDF Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D6B77A] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                PDF Financial Statement
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                FINORA branded executive report with opening/closing balances, summary box, and ledger table.
              </p>
            </div>

            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting !== null}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold rounded-xl bg-[#D6B77A] text-[#101827] hover:bg-[#E4CA92] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting === "pdf" ? "Generating PDF..." : "Download PDF"}</span>
            </button>
          </div>

          {/* Excel Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D6B77A] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Excel (.xlsx) Workbook
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Structured multi-sheet workbook with transactions sheet and individual account balances sheet.
              </p>
            </div>

            <button
              onClick={() => handleExport("xlsx")}
              disabled={isExporting !== null}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] hover:text-[var(--accent-gold)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting === "xlsx" ? "Generating XLSX..." : "Download Excel"}</span>
            </button>
          </div>

          {/* CSV Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D6B77A] transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                <FileCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Structured CSV Ledger
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Clean comma-separated values compatible with Google Sheets, accounting tools, and data scripts.
              </p>
            </div>

            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting !== null}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] hover:text-[var(--accent-gold)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting === "csv" ? "Generating CSV..." : "Download CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export History Section */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--accent-gold)]" />
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Export History & Re-Download Log
          </h3>
        </div>

        {exportHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
            No reports generated yet. Choose a format above to download your first statement.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)] text-xs">
            {exportHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-elevated)]/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.format === "pdf"
                        ? "bg-rose-500/15 text-rose-400"
                        : item.format === "xlsx"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {item.format}
                  </span>

                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{item.title}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {item.filterSummary} · Generated {item.generatedAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {item.fileSizeEstimate}
                  </span>
                  <button
                    onClick={() => handleExport(item.format)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#D6B77A] transition-colors cursor-pointer"
                  >
                    Download Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
