import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Bot,
  ShoppingBag,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useBot } from '../../context/BotContext';
import {
  generateProductSalesReportPDF,
  generateUserTransactionsReportPDF,
  generateComprehensiveAccountingStatementPDF,
  filterOrdersByOptions,
  filterTransactionsByOptions,
  AccountingFilterOptions
} from '../../utils/accountingPdfGenerator';

interface AccountingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: 'sales' | 'transactions' | 'comprehensive';
}

export const AccountingExportModal: React.FC<AccountingExportModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'sales'
}) => {
  const {
    orders,
    transactions,
    products,
    allUsers,
    logs,
    bots,
    activeBot,
    settings
  } = useBot();

  const [reportType, setReportType] = useState<'sales' | 'transactions' | 'comprehensive'>(defaultReportType);
  const [dateRange, setDateRange] = useState<AccountingFilterOptions['dateRange']>('all');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [txnStatus, setTxnStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Available unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Current filter object
  const currentOptions: AccountingFilterOptions = useMemo(() => ({
    dateRange,
    startDate,
    endDate,
    category: selectedCategory,
    txnStatus
  }), [dateRange, startDate, endDate, selectedCategory, txnStatus]);

  // Filtered live preview data
  const previewFilteredOrders = useMemo(() => {
    return filterOrdersByOptions(orders, currentOptions, products);
  }, [orders, currentOptions, products]);

  const previewFilteredTxns = useMemo(() => {
    return filterTransactionsByOptions(transactions, currentOptions, logs);
  }, [transactions, currentOptions, logs]);

  // Live Calculations for instant feedback
  const previewMetrics = useMemo(() => {
    const totalSalesRev = previewFilteredOrders.reduce((s, o) => s + (o.price_paid || 0), 0);
    const totalOrdersCount = previewFilteredOrders.length;
    const totalDeposits = previewFilteredTxns
      .filter(t => t.status === 'paid' || !t.status)
      .reduce((s, t) => s + (t.amount_inr || 0), 0);
    const totalTxnsCount = previewFilteredTxns.length;
    const userWalletLiability = allUsers.reduce((s, u) => s + (u.balance || 0), 0);
    const uniqueCustomers = new Set(previewFilteredOrders.map(o => o.user_id)).size;

    return {
      totalSalesRev,
      totalOrdersCount,
      totalDeposits,
      totalTxnsCount,
      userWalletLiability,
      uniqueCustomers
    };
  }, [previewFilteredOrders, previewFilteredTxns, allUsers]);

  const handleExportPDF = () => {
    setIsGenerating(true);
    setDownloadSuccess(null);

    setTimeout(() => {
      try {
        const payload = {
          orders,
          transactions,
          products,
          users: allUsers,
          logs,
          bots,
          activeBot,
          settings,
          options: currentOptions
        };

        if (reportType === 'sales') {
          generateProductSalesReportPDF(payload);
          setDownloadSuccess('Product Sales PDF Report successfully downloaded!');
        } else if (reportType === 'transactions') {
          generateUserTransactionsReportPDF(payload);
          setDownloadSuccess('User Transactions & Deposits Ledger PDF successfully downloaded!');
        } else {
          generateComprehensiveAccountingStatementPDF(payload);
          setDownloadSuccess('Comprehensive Financial Audit Statement PDF successfully downloaded!');
        }
      } catch (err: any) {
        console.error('PDF export error:', err);
        alert(`Failed to generate PDF: ${err?.message || 'Please try again.'}`);
      } finally {
        setIsGenerating(false);
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black tracking-wider text-cyan-400">
                  External Accounting & Audit Engine
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  PDF Export
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Export Financial & Sales Statement
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Report Type Selection Cards */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 block">
              Select Statement Format & Type:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Product Sales Report */}
              <button
                type="button"
                onClick={() => {
                  setReportType('sales');
                  setDownloadSuccess(null);
                }}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer active:scale-[0.98] ${
                  reportType === 'sales'
                    ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  {reportType === 'sales' && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div className="font-bold text-sm text-white">Product Sales Report</div>
                <div className="text-xs text-slate-400 mt-1">
                  Itemized sales orders, product revenue breakdown & fulfillment ledger.
                </div>
              </button>

              {/* User Transactions & Deposits */}
              <button
                type="button"
                onClick={() => {
                  setReportType('transactions');
                  setDownloadSuccess(null);
                }}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer active:scale-[0.98] ${
                  reportType === 'transactions'
                    ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  {reportType === 'transactions' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="font-bold text-sm text-white">User Inflows & Deposits</div>
                <div className="text-xs text-slate-400 mt-1">
                  UPI wallet deposits, transaction UTR verification & customer float balance.
                </div>
              </button>

              {/* Comprehensive Statement */}
              <button
                type="button"
                onClick={() => {
                  setReportType('comprehensive');
                  setDownloadSuccess(null);
                }}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer active:scale-[0.98] ${
                  reportType === 'comprehensive'
                    ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-400 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  {reportType === 'comprehensive' && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="font-bold text-sm text-white">Full Accounting Package</div>
                <div className="text-xs text-slate-400 mt-1">
                  Master statement with P&L, sales, deposits, customer liability & auditor sign-off.
                </div>
              </button>
            </div>
          </div>

          {/* 2. Filter Configuration */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
              <Filter className="w-4 h-4" />
              Accounting Scope & Filters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Range Selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Reporting Period:</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All Time (Complete Historical Ledger)</option>
                  <option value="today">Today (Last 24 Hours)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="this_month">Current Month to Date</option>
                  <option value="last_month">Previous Full Month</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Category Filter (if Sales / Comprehensive) */}
              {reportType !== 'transactions' ? (
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Product Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:border-cyan-400 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c === 'ALL' ? 'All Categories (Full Catalog)' : c}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Deposit Verification Status:</label>
                  <select
                    value={txnStatus}
                    onChange={(e) => setTxnStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="all">All Statuses (Paid, Pending, Failed)</option>
                    <option value="paid">Verified Paid Only (Settled Revenue)</option>
                    <option value="pending">Pending Settlements Only</option>
                    <option value="failed">Failed / Expired Only</option>
                  </select>
                </div>
              )}
            </div>

            {/* Custom Date Inputs if Custom selected */}
            {dateRange === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800"
              >
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">From Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">To Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </motion.div>
            )}

            {/* Store & Bot Scope Banner */}
            <div className="flex items-center justify-between bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">
                  Target Store: <strong className="text-white">{activeBot ? activeBot.name : 'Kalam Store'}</strong>
                  <span className="text-cyan-400 font-mono text-[11px] ml-1.5">
                    (@{activeBot?.username || settings?.bot_username || 'KALAMFFPANEL1BOT'})
                  </span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Admin UID: {activeBot?.admin_id || settings?.admin_id || 12846461}
              </span>
            </div>
          </div>

          {/* 3. Live Accounting Calculations Preview */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                Live Statement Calculation Preview
              </div>
              <span className="text-[11px] text-slate-400">
                Matches: <strong className="text-white">{reportType === 'transactions' ? previewMetrics.totalTxnsCount : previewMetrics.totalOrdersCount} records</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Gross Sales:</span>
                <div className="text-base font-black text-emerald-400 font-mono">
                  ₹{previewMetrics.totalSalesRev.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">{previewMetrics.totalOrdersCount} orders</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">UPI Inflow:</span>
                <div className="text-base font-black text-cyan-400 font-mono">
                  ₹{previewMetrics.totalDeposits.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">{previewMetrics.totalTxnsCount} deposits</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Wallet Liability:</span>
                <div className="text-base font-black text-amber-400 font-mono">
                  ₹{previewMetrics.userWalletLiability.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">Current float balance</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Active Buyers:</span>
                <div className="text-base font-black text-purple-400 font-mono">
                  {previewMetrics.uniqueCustomers}
                </div>
                <span className="text-[10px] text-slate-400">Unique accounts</span>
              </div>
            </div>
          </div>

          {/* Success Notification */}
          {downloadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm font-bold"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Ready for external accountants, auditors & tax filing.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling Statement...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Statement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
