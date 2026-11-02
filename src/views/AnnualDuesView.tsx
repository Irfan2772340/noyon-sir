import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member, AnnualDue, OrgSettings, Receipt } from '../types';
import {
  formatBDT,
  toBengaliDigits,
  STATUS_LABELS_BN,
  PAYMENT_METHODS,
} from '../utils/bengali';
import {
  generateAnnualDueId,
} from '../utils/calculations';
import {
  createAnnualDueRecord,
  recordAnnualPayment,
} from '../services/db';
import {
  CalendarDays,
  Calendar,
  CheckCircle,
  PlusCircle,
  Search,
  Receipt as ReceiptIcon,
  X,
  CreditCard,
  Layers,
} from 'lucide-react';

interface AnnualDuesViewProps {
  members: Member[];
  annualDues: AnnualDue[];
  settings: OrgSettings;
  onOpenReceipt: (receipt: Receipt) => void;
}

export const AnnualDuesView: React.FC<AnnualDuesViewProps> = ({
  members,
  annualDues,
  settings,
  onOpenReceipt,
}) => {
  const { user, isAdmin, adminProfile } = useAuth();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [financialYearInput, setFinancialYearInput] = useState<string>(settings.financialYear);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal
  const [payingDue, setPayingDue] = useState<AnnualDue | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(settings.defaultAnnualFee || 500);
  const [paymentMethod, setPaymentMethod] = useState<string>('ব্যাংক ট্রান্সফার (Bank)');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Batch generate
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchYear, setBatchYear] = useState<number>(currentYear);
  const [batchFinYear, setBatchFinYear] = useState<string>(settings.financialYear);
  const [batchFee, setBatchFee] = useState<number>(settings.defaultAnnualFee || 500);
  const [batchMessage, setBatchMessage] = useState('');
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Filter dues for selected year
  const currentYearDues = annualDues.filter((d) => d.year === selectedYear);

  const filteredDues = currentYearDues.filter((d) => {
    const matchesSearch =
      d.memberNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.memberId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTarget = currentYearDues.reduce((s, d) => s + (d.amountDue || 0), 0);
  const totalCollected = currentYearDues.reduce((s, d) => s + (d.amountPaid || 0), 0);
  const totalPending = Math.max(0, totalTarget - totalCollected);
  const paidCount = currentYearDues.filter((d) => d.status === 'paid').length;
  const unpaidCount = currentYearDues.filter((d) => d.status === 'unpaid').length;

  const handleOpenPayment = (due: AnnualDue) => {
    setPayingDue(due);
    const rem = Math.max(0, due.amountDue - (due.amountPaid || 0));
    setPaymentAmount(rem > 0 ? rem : due.amountDue);
    setPaymentMethod('ব্যাংক ট্রান্সফার (Bank)');
    setPaymentNotes('');
    setPaymentError('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDue) return;

    if (paymentAmount <= 0) {
      setPaymentError('পরিশোধের পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }

    try {
      setIsSubmitting(true);
      setPaymentError('');

      const member = members.find((m) => m.memberId === payingDue.memberId);
      const recorder =
        adminProfile?.name || user?.displayName || 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)';

      const receipt = await recordAnnualPayment({
        dueId: payingDue.id,
        memberId: payingDue.memberId,
        memberNameBn: payingDue.memberNameBn,
        memberPhone: member?.phone,
        financialYear: payingDue.financialYear,
        year: payingDue.year,
        amountDue: payingDue.amountDue,
        existingPaid: payingDue.amountPaid || 0,
        newPaymentAmount: paymentAmount,
        paymentMethod,
        recorderName: recorder,
        notes: paymentNotes,
      });

      setPayingDue(null);
      onOpenReceipt(receipt);
    } catch (err) {
      console.error(err);
      setPaymentError('বার্ষিক চাঁদা সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchGenerate = async () => {
    try {
      setIsBatchRunning(true);
      setBatchMessage('');
      const existingIds = new Set(annualDues.map((d) => d.id));
      let count = 0;

      for (const m of members) {
        if (m.status !== 'active') continue;
        const dueId = generateAnnualDueId(m.memberId, batchYear);
        if (!existingIds.has(dueId)) {
          await createAnnualDueRecord({
            id: dueId,
            memberId: m.memberId,
            memberNameBn: m.nameBn,
            year: batchYear,
            financialYear: batchFinYear,
            amountDue: batchFee,
            amountPaid: 0,
            status: 'unpaid',
          });
          count++;
        }
      }

      setBatchMessage(
        count > 0
          ? `সফল! ${toBengaliDigits(count)} জন সক্রিয় সদস্যের বার্ষিক চাঁদার হিসাব তৈরি হয়েছে।`
          : 'নির্বাচিত বছরের জন্য সকল সক্রিয় সদস্যের চাঁদা পূর্বেই তৈরি আছে।'
      );
      setTimeout(() => {
        setIsBatchOpen(false);
        setBatchMessage('');
      }, 1800);
    } catch (err) {
      console.error(err);
      setBatchMessage('বার্ষিক চাঁদা তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            <span>বার্ষিক চাঁদা ব্যবস্থাপনা (Annual Contributions)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            নির্ধারিত বার্ষিক চাঁদার হার: {formatBDT(settings.defaultAnnualFee || 500)} / অর্থবছর
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setBatchYear(selectedYear);
              setBatchFinYear(settings.financialYear);
              setBatchFee(settings.defaultAnnualFee || 500);
              setBatchMessage('');
              setIsBatchOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            <span>বার্ষিক চাঁদা তৈরি (Batch Generate)</span>
          </button>
        )}
      </div>

      {/* Year Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-700">অর্থবছর / বছর নির্বাচন করুন:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="py-1.5 px-3 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {toBengaliDigits(y)} সাল
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          সংগঠনের সক্রিয় অর্থবছর: <strong className="text-emerald-800">{settings.financialYear}</strong>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">বার্ষিক লক্ষ্যমাত্রা</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatBDT(totalTarget)}
          </span>
          <span className="text-[10px] text-slate-400">
            {toBengaliDigits(currentYearDues.length)} সদস্য
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-emerald-700 font-medium block">আদায় হয়েছে</span>
          <span className="text-lg font-black text-emerald-800 mt-1 block">
            {formatBDT(totalCollected)}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">
            পরিশোধিত: {toBengaliDigits(paidCount)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-rose-700 font-medium block">বকেয়া রয়েছে</span>
          <span className="text-lg font-black text-rose-700 mt-1 block">
            {formatBDT(totalPending)}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">
            বকেয়া: {toBengaliDigits(unpaidCount)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-blue-700 font-medium block">পরিশোধের শতকরা হার</span>
          <span className="text-lg font-black text-blue-900 mt-1 block">
            {totalTarget > 0 ? toBengaliDigits(Math.round((totalCollected / totalTarget) * 100)) : '০'}%
          </span>
          <span className="text-[10px] text-slate-400">আদায় অগ্রগতি</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="সদস্যের নাম বা আইডি খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">স্থিতি:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">সকল (All)</option>
            <option value="paid">পরিশোধিত (Paid)</option>
            <option value="unpaid">বকেয়া (Unpaid)</option>
          </select>
        </div>
      </div>

      {/* Annual Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">সদস্য তথ্য</th>
                <th className="px-4 py-3 text-left font-semibold">অর্থবছর</th>
                <th className="px-4 py-3 text-right font-semibold">ধার্য চাঁদা</th>
                <th className="px-4 py-3 text-right font-semibold">পরিশোধিত</th>
                <th className="px-4 py-3 text-center font-semibold">স্থিতি</th>
                <th className="px-4 py-3 text-left font-semibold">পরিশোধ ও রশিদ</th>
                <th className="px-4 py-3 text-right font-semibold">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {toBengaliDigits(selectedYear)} সালের জন্য কোন বার্ষিক চাঁদার হিসাব পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => (
                  <tr key={due.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{due.memberNameBn}</div>
                      <div className="font-mono text-emerald-800 text-xs font-semibold">
                        {due.memberId}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {due.financialYear} ({toBengaliDigits(due.year)})
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatBDT(due.amountDue)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatBDT(due.amountPaid || 0)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          due.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {STATUS_LABELS_BN[due.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {due.paymentDate ? (
                        <div>
                          <span className="font-medium text-slate-800">
                            {toBengaliDigits(due.paymentDate)}
                          </span>
                          {due.receiptNumber && (
                            <span className="block font-mono text-emerald-700 text-[11px]">
                              {due.receiptNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {due.status === 'paid' ? (
                        <div className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>পরিশোধিত</span>
                        </div>
                      ) : (
                        isAdmin && (
                          <button
                            onClick={() => handleOpenPayment(due)}
                            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs transition"
                          >
                            চাঁদা গ্রহণ
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payingDue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <span>বার্ষিক চাঁদা আদায় নিশ্চিতকরণ</span>
              </h3>
              <button
                onClick={() => setPayingDue(null)}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-3.5 text-xs sm:text-sm">
              {paymentError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {paymentError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">সদস্যের নাম:</span>
                  <span className="font-bold text-slate-900">{payingDue.memberNameBn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">সদস্য আইডি:</span>
                  <span className="font-mono font-bold text-emerald-800">{payingDue.memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">অর্থবছর:</span>
                  <span className="font-semibold text-slate-900">{payingDue.financialYear}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1 text-xs">
                  <span className="text-slate-600">ধার্যকৃত চাঁদা:</span>
                  <span className="font-mono">{formatBDT(payingDue.amountDue)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  এখন কত টাকা জমা নেওয়া হচ্ছে? (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-base text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পরিশোধের মাধ্যম (Payment Method) *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মন্তব্য / রেফারেন্স
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="যেমন: ব্যাংক চেক নং / রশিদ"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingDue(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <ReceiptIcon className="w-4 h-4" />
                  <span>{isSubmitting ? 'প্রসেসিং...' : 'জমা নিশ্চিত ও রশিদ তৈরি'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Open Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <span>বার্ষিক চাঁদা ব্যাচ প্রস্তুত</span>
              </h3>
              <button
                onClick={() => setIsBatchOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                সকল <strong>সক্রিয় সদস্যদের</strong> জন্য নির্দিষ্ট অর্থবছরের বার্ষিক চাঁদার রেকর্ড প্রস্তুত করা হবে। ডুপ্লিকেট এড়ানো হবে।
              </p>

              {batchMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium text-xs">
                  {batchMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বছর</label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {toBengaliDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অর্থবছর শিরোনাম</label>
                  <input
                    type="text"
                    value={batchFinYear}
                    onChange={(e) => setBatchFinYear(e.target.value)}
                    placeholder="২০২৫-২০২৬"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বার্ষিক চাঁদার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  min={1}
                  value={batchFee}
                  onChange={(e) => setBatchFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBatchGenerate}
                  disabled={isBatchRunning}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isBatchRunning ? 'প্রস্তুত হচ্ছে...' : 'চাঁদা ধার্য করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
