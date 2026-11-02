import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction, TransactionType } from '../types';
import {
  formatBDT,
  toBengaliDigits,
  PAYMENT_METHODS,
} from '../utils/bengali';
import {
  calculateFundSummary,
  generateTransactionId,
} from '../utils/calculations';
import { addTransaction } from '../services/db';
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Search,
  Filter,
  Coins,
  Landmark,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react';

const INCOME_CATEGORIES = [
  'সদস্য মাসিক চাঁদা',
  'সদস্য বার্ষিক চাঁদা',
  'সাধারণ সদস্য ভর্তি ফি',
  'বিশেষ অনুদান (Donation)',
  'প্রবাসী কল্যাণ অনুদান',
  'ব্যাংক মুনাফা / লভ্যাংশ',
  'বিবিধ আয়',
];

const EXPENSE_CATEGORIES = [
  'দরিদ্র ও এতিম সহায়তা',
  'চিকিৎসা ও ওষুধ সহায়তা',
  'শিক্ষা সহায়তা ও শিক্ষা উপকরণ বিতরণ',
  'ঈদ সামগ্রী / ইফতার বিতরণ',
  'মৃত ব্যক্তির কাফন-দাফন সহায়তা',
  'দাপ্তরিক ও কার্যালয় খরচ',
  'সাধারণ সভার খরচ ও চা-নাশতা',
  'প্রচার ও ব্যানার প্রিন্টিং',
  'ব্যাংক চার্জ / হিসাব ফি',
  'বিবিধ সামাজিক ব্যয়',
];

interface CashBookViewProps {
  transactions: Transaction[];
  onOpenAddTransactionModal?: boolean;
  onCloseAddTransactionModal?: () => void;
}

export const CashBookView: React.FC<CashBookViewProps> = ({
  transactions,
  onOpenAddTransactionModal = false,
  onCloseAddTransactionModal,
}) => {
  const { user, isAdmin, adminProfile } = useAuth();

  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(onOpenAddTransactionModal);

  // Form states
  const [txnType, setTxnType] = useState<TransactionType>('income');
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txnCategory, setTxnCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [txnAmount, setTxnAmount] = useState<number>(500);
  const [txnDescription, setTxnDescription] = useState<string>('');
  const [txnMethod, setTxnMethod] = useState<string>('নগদ (Cash)');
  const [txnVoucher, setTxnVoucher] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Update modal state if prop changes
  React.useEffect(() => {
    if (onOpenAddTransactionModal) {
      setIsAddModalOpen(true);
    }
  }, [onOpenAddTransactionModal]);

  const fund = calculateFundSummary(transactions);

  const filteredTransactions = transactions
    .filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchSearch =
        t.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.voucherRef && t.voucherRef.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenAdd = (type: TransactionType = 'income') => {
    setTxnType(type);
    setTxnCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setTxnDate(new Date().toISOString().split('T')[0]);
    setTxnAmount(type === 'income' ? 1000 : 500);
    setTxnDescription('');
    setTxnMethod('নগদ (Cash)');
    setTxnVoucher('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txnAmount <= 0) {
      setFormError('টাকার পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }
    if (!txnDescription.trim()) {
      setFormError('বিবরণ দেওয়া বাধ্যতামূলক।');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      const transactionId = generateTransactionId(txnType);

      await addTransaction({
        transactionId,
        date: txnDate,
        type: txnType,
        category: txnCategory,
        amount: txnAmount,
        description: txnDescription.trim(),
        paymentMethod: txnMethod,
        voucherRef: txnVoucher.trim() || undefined,
        recordedBy: user?.uid || 'admin',
        recordedByName: adminProfile?.name || user?.displayName || 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
      });

      setIsAddModalOpen(false);
      if (onCloseAddTransactionModal) onCloseAddTransactionModal();
    } catch (err) {
      console.error(err);
      setFormError('লেনদেন সংরক্ষণে সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <WalletCards className="w-5 h-5 text-emerald-700" />
            <span>আয়-ব্যয় ক্যাশ বুক লেজার (Cash Book Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            সংগঠনের প্রতিটি আয় ও ব্যয়ের হিসাবরক্ষণ ও তহবিল ভারসাম্য
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAdd('income')}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>আয় এন্ট্রি</span>
            </button>
            <button
              onClick={() => handleOpenAdd('expense')}
              className="inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>ব্যয় এন্ট্রি</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Position Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-medium text-slate-500">সর্বমোট আয় (Total Income)</span>
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-emerald-800 mt-2 block">
            {formatBDT(fund.totalIncome)}
          </span>
          <span className="text-[11px] text-slate-400">চাঁদা, অনুদান ও অন্যান্য</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-medium text-slate-500">সর্বমোট ব্যয় (Total Expense)</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-rose-700 mt-2 block">
            {formatBDT(fund.totalExpense)}
          </span>
          <span className="text-[11px] text-slate-400">কল্যাণমূলক ও দাপ্তরিক খরচ</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-medium text-slate-500">হাতে নগদ (Cash in Hand)</span>
            <Coins className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-amber-900 mt-2 block">
            {formatBDT(fund.cashBalance)}
          </span>
          <span className="text-[11px] text-slate-400">কোষাধ্যক্ষের হেফাজতে</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold">মোট বর্তমান তহবিল (Net Balance)</span>
            <Landmark className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-2xl font-black text-emerald-950 mt-2 block">
            {formatBDT(fund.netBalance)}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">
            ব্যাংক স্থিতি: {formatBDT(fund.bankBalance)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ভাউচার, ক্যাটাগরি বা বিবরণ খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সকল লেনদেন ({toBengaliDigits(transactions.length)})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'income'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            শুধুমাত্র আয়
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'expense'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            শুধুমাত্র ব্যয়
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">তারিখ ও আইডি</th>
                <th className="px-4 py-3 text-left font-semibold">খাত / ক্যাটাগরি</th>
                <th className="px-4 py-3 text-left font-semibold">বিবরণ ও ভাউচার</th>
                <th className="px-4 py-3 text-left font-semibold">মাধ্যম</th>
                <th className="px-4 py-3 text-right font-semibold">টাকার পরিমাণ (৳)</th>
                <th className="px-4 py-3 text-right font-semibold">দায়িত্বপ্রাপ্ত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    কোন আয় বা ব্যয়ের লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{toBengaliDigits(t.date)}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{t.transactionId}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block">{t.category}</span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.type === 'income' ? 'আয় (Income)' : 'ব্যয় (Expense)'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs">{t.description}</div>
                      {t.voucherRef && (
                        <div className="mt-0.5 text-[11px] text-blue-700 font-mono flex items-center space-x-1">
                          <FileCheck className="w-3 h-3" />
                          <span>ভাউচার: {t.voucherRef}</span>
                        </div>
                      )}
                      {t.receiptNumber && (
                        <div className="text-[11px] text-emerald-700 font-mono">
                          রশিদ: {t.receiptNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {t.paymentMethod}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm sm:text-base font-black font-mono ${
                          t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'} {formatBDT(t.amount)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {t.recordedByName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <WalletCards className="w-5 h-5 text-emerald-700" />
                <span>নতুন আয় বা ব্যয় এন্ট্রি সংরক্ষণ</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onCloseAddTransactionModal) onCloseAddTransactionModal();
                }}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-3.5 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Type selector toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTxnType('income');
                    setTxnCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    txnType === 'income'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + আয় এন্ট্রি (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxnType('expense');
                    setTxnCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    txnType === 'expense'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  - ব্যয় এন্ট্রি (Expense)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">হিসাবের খাত (Category) *</label>
                <select
                  value={txnCategory}
                  onChange={(e) => setTxnCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  {(txnType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পরিশোধের মাধ্যম</label>
                  <select
                    value={txnMethod}
                    onChange={(e) => setTxnMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ভাউচার / স্লিপ নং (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="VOUCH-001"
                    value={txnVoucher}
                    onChange={(e) => setTxnVoucher(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="লেনদেনের সুনির্দিষ্ট কারণ ও বিবরণ..."
                  value={txnDescription}
                  onChange={(e) => setTxnDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    if (onCloseAddTransactionModal) onCloseAddTransactionModal();
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'ক্যাশ বুকে সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
