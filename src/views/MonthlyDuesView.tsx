import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member, MonthlyDue, OrgSettings, Receipt } from '../types';
import {
  formatBDT,
  toBengaliDigits,
  BENGALI_MONTHS,
  STATUS_LABELS_BN,
  PAYMENT_METHODS,
} from '../utils/bengali';
import {
  generateMonthlyDueId,
  prepareBatchMonthlyDues,
} from '../utils/calculations';
import {
  createMonthlyDueRecord,
  recordMonthlyPayment,
} from '../services/db';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Search,
  Receipt as ReceiptIcon,
  X,
  CreditCard,
  Layers,
  Sparkles,
  Bell,
  Copy,
  Check,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  get10thTarikNotificationStatus,
  generateMemberReminderSMS,
} from '../utils/paymentNotification';

interface MonthlyDuesViewProps {
  members: Member[];
  monthlyDues: MonthlyDue[];
  settings: OrgSettings;
  onOpenReceipt: (receipt: Receipt) => void;
  selectedMemberForPay?: Member | null;
  onClearSelectedMemberForPay?: () => void;
  onPaymentSuccess?: (dueId: string, paidAmount: number, receipt: Receipt) => void;
}

export const MonthlyDuesView: React.FC<MonthlyDuesViewProps> = ({
  members,
  monthlyDues,
  settings,
  onOpenReceipt,
  selectedMemberForPay,
  onClearSelectedMemberForPay,
  onPaymentSuccess,
}) => {
  const { user, isAdmin, adminProfile } = useAuth();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal state
  const [payingDue, setPayingDue] = useState<MonthlyDue | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(settings.defaultMonthlyFee || 100);
  const [paymentMethod, setPaymentMethod] = useState<string>('নগদ (Cash)');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Batch generate modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchMonth, setBatchMonth] = useState<number>(selectedMonth);
  const [batchYear, setBatchYear] = useState<number>(selectedYear);
  const [batchAmount, setBatchAmount] = useState<number>(settings.defaultMonthlyFee || 100);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');

  // If a member was selected from Members view to pay dues, auto open payment
  React.useEffect(() => {
    if (selectedMemberForPay) {
      // Find or construct due for this member for current month
      const dueId = generateMonthlyDueId(selectedMemberForPay.memberId, selectedYear, selectedMonth);
      const existing = monthlyDues.find((d) => d.id === dueId);
      const dueToPay: MonthlyDue = existing || {
        id: dueId,
        memberId: selectedMemberForPay.memberId,
        memberNameBn: selectedMemberForPay.nameBn,
        year: selectedYear,
        month: selectedMonth,
        monthNameBn: BENGALI_MONTHS.find((m) => m.id === selectedMonth)?.name || '',
        amountDue: settings.defaultMonthlyFee || 100,
        amountPaid: 0,
        status: 'unpaid',
      };
      setPayingDue(dueToPay);
      setPaymentAmount(Math.max(0, dueToPay.amountDue - (dueToPay.amountPaid || 0)));
      if (onClearSelectedMemberForPay) {
        onClearSelectedMemberForPay();
      }
    }
  }, [selectedMemberForPay]);

  // Current filtered dues for selected month & year
  const currentMonthDues = monthlyDues.filter(
    (d) => d.year === selectedYear && d.month === selectedMonth
  );

  const filteredDues = currentMonthDues.filter((d) => {
    const matchesSearch =
      d.memberNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.memberId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Aggregates for current month
  const totalTarget = currentMonthDues.reduce((s, d) => s + (d.amountDue || 0), 0);
  const totalCollected = currentMonthDues.reduce((s, d) => s + (d.amountPaid || 0), 0);
  const totalDuePending = Math.max(0, totalTarget - totalCollected);
  const paidCount = currentMonthDues.filter((d) => d.status === 'paid').length;
  const unpaidCount = currentMonthDues.filter((d) => d.status === 'unpaid').length;
  const partialCount = currentMonthDues.filter((d) => d.status === 'partial').length;

  const currentMonthNameBn =
    BENGALI_MONTHS.find((m) => m.id === selectedMonth)?.name || '';

  // Trigger Payment
  const handleOpenPayment = (due: MonthlyDue) => {
    setPayingDue(due);
    const remaining = Math.max(0, due.amountDue - (due.amountPaid || 0));
    setPaymentAmount(remaining > 0 ? remaining : due.amountDue);
    setPaymentMethod('নগদ (Cash)');
    setPaymentNotes('');
    setPaymentError('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDue) return;

    if (paymentAmount <= 0) {
      setPaymentError('পরিশোধের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentError('');

      // Find member details for phone
      const member = members.find((m) => m.memberId === payingDue.memberId);
      const recorder =
        adminProfile?.name || user?.displayName || 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)';

      const receipt = await recordMonthlyPayment({
        dueId: payingDue.id,
        memberId: payingDue.memberId,
        memberNameBn: payingDue.memberNameBn,
        memberPhone: member?.phone,
        monthNameBn: payingDue.monthNameBn,
        year: payingDue.year,
        amountDue: payingDue.amountDue,
        existingPaid: payingDue.amountPaid || 0,
        newPaymentAmount: paymentAmount,
        paymentMethod,
        recorderName: recorder,
        notes: paymentNotes,
      });

      setPayingDue(null);
      if (onPaymentSuccess) {
        onPaymentSuccess(payingDue.id, paymentAmount, receipt);
      }
      // Immediately open printable receipt modal for the user/admin!
      onOpenReceipt(receipt);
    } catch (err: any) {
      console.error(err);
      setPaymentError('চাঁদা পরিশোধ সংরক্ষণে সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Batch Dues Generation
  const handleBatchGenerate = async () => {
    try {
      setIsBatchGenerating(true);
      setBatchMessage('');
      const existingIds = new Set(monthlyDues.map((d) => d.id));
      const monthObj = BENGALI_MONTHS.find((m) => m.id === batchMonth);
      const monthName = monthObj ? monthObj.name : '';

      const newDues = prepareBatchMonthlyDues(
        members,
        batchYear,
        batchMonth,
        monthName,
        batchAmount,
        existingIds
      );

      if (newDues.length === 0) {
        setBatchMessage('এই মাসের জন্য সকল সক্রিয় সদস্যের চাঁদার হিসাব ইতিমধ্যে তৈরি করা আছে!');
        setIsBatchGenerating(false);
        return;
      }

      for (const due of newDues) {
        await createMonthlyDueRecord(due);
      }

      setBatchMessage(
        `সফল! ${toBengaliDigits(newDues.length)} জন সক্রিয় সদস্যের জন্য ${monthName} ${toBengaliDigits(batchYear)}-এর চাঁদার হিসাব প্রস্তুত করা হয়েছে।`
      );
      setTimeout(() => {
        setIsBatchModalOpen(false);
        setBatchMessage('');
      }, 1800);
    } catch (err) {
      console.error(err);
      setBatchMessage('চাঁদা তৈরিতে সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const [copiedSMS, setCopiedSMS] = useState(false);

  // Unpaid dues for currently selected month
  const unpaidForMonth = currentMonthDues.filter((d) => d.status !== 'paid');

  const handleCopyMonthSMS = () => {
    const list = unpaidForMonth.map((d) => {
      const remaining = Math.max(0, d.amountDue - (d.amountPaid || 0));
      return generateMemberReminderSMS(d.memberNameBn, d.memberId, currentMonthNameBn, remaining);
    });
    navigator.clipboard.writeText(list.join('\n---\n')).then(() => {
      setCopiedSMS(true);
      setTimeout(() => setCopiedSMS(false), 2500);
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck2 className="w-5 h-5 text-emerald-700" />
            <span>মাসিক চাঁদা আদায় ও রেজিস্টার (Monthly Dues)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মাসিক চাঁদার নির্ধারিত হার: {formatBDT(settings.defaultMonthlyFee || 100)} / সদস্য
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setBatchMonth(selectedMonth);
              setBatchYear(selectedYear);
              setBatchAmount(settings.defaultMonthlyFee || 100);
              setBatchMessage('');
              setIsBatchModalOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            <span>একসাথে মাসের চাঁদা প্রস্তুত (Batch Generate)</span>
          </button>
        )}
      </div>

      {/* 10th Tarik Monthly Payment Auto-Notification Card */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-xs font-black text-base">
            ১০
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span>প্রতি মাসের ১০ তারিখ চাঁদা আদায়ের নিয়ম ও নোটিফিকেশন</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                সক্রিয়
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {currentMonthNameBn} {toBengaliDigits(selectedYear)} মাসে বকেয়া চাঁদা: <strong>{formatBDT(totalDuePending)}</strong> (বকেয়া সদস্য: {toBengaliDigits(unpaidCount + partialCount)} জন)
            </p>
          </div>
        </div>

        {isAdmin && unpaidForMonth.length > 0 && (
          <button
            onClick={handleCopyMonthSMS}
            className="inline-flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition shrink-0"
          >
            {copiedSMS ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-amber-300" />}
            <span>{copiedSMS ? 'SMS মেসেজ কপি হয়েছে!' : `${toBengaliDigits(unpaidForMonth.length)} জনের ১০ তারিখ SMS কপি`}</span>
          </button>
        )}
      </div>

      {/* Month & Year Selector Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Month Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
          {BENGALI_MONTHS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedMonth === m.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="py-1.5 px-3 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {toBengaliDigits(y)} সাল
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">
            {currentMonthNameBn} মোট লক্ষ্যমাত্রা
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatBDT(totalTarget)}
          </span>
          <span className="text-[10px] text-slate-400">
            {toBengaliDigits(currentMonthDues.length)} জন সদস্য
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-emerald-700 font-medium block">মোট আদায় হয়েছে</span>
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
            {formatBDT(totalDuePending)}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">
            বকেয়া: {toBengaliDigits(unpaidCount)} জন
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-amber-700 font-medium block">আংশিক পরিশোধ</span>
          <span className="text-lg font-black text-amber-800 mt-1 block">
            {toBengaliDigits(partialCount)} জন
          </span>
          <span className="text-[10px] text-amber-700">বাকি টাকা অপরিশোধিত</span>
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
            <option value="partial">আংশিক (Partial)</option>
            <option value="unpaid">বকেয়া (Unpaid)</option>
            <option value="waived">মওকুফ (Waived)</option>
          </select>
        </div>
      </div>

      {/* Monthly Dues Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">সদস্য তথ্য</th>
                <th className="px-4 py-3 text-right font-semibold">ধার্য চাঁদা</th>
                <th className="px-4 py-3 text-right font-semibold">পরিশোধিত</th>
                <th className="px-4 py-3 text-right font-semibold">বকেয়া</th>
                <th className="px-4 py-3 text-center font-semibold">স্থিতি</th>
                <th className="px-4 py-3 text-left font-semibold">পরিশোধের তথ্য ও রশিদ</th>
                <th className="px-4 py-3 text-right font-semibold">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {currentMonthNameBn} {toBengaliDigits(selectedYear)}-এর জন্য কোন চাঁদার হিসাব পাওয়া যায়নি।
                    {isAdmin && ' উপরের "একসাথে প্রস্তুত" বোতামে ক্লিক করে নতুন হিসাব তৈরি করুন।'}
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => {
                  const remaining = Math.max(0, due.amountDue - (due.amountPaid || 0));
                  return (
                    <tr key={due.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{due.memberNameBn}</div>
                        <div className="font-mono text-emerald-800 text-xs font-semibold">
                          {due.memberId}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatBDT(due.amountDue)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatBDT(due.amountPaid || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-rose-700">
                        {remaining > 0 ? formatBDT(remaining) : '৳ ০'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            due.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : due.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
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
                              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs transition shadow-2xs"
                            >
                              চাঁদা গ্রহণ
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payingDue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <span>মাসিক চাঁদা আদায় নিশ্চিতকরণ</span>
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
                  <span className="text-slate-600">চাঁদার মাস ও বছর:</span>
                  <span className="font-semibold text-slate-900">
                    {payingDue.monthNameBn} {toBengaliDigits(payingDue.year)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1 text-xs">
                  <span className="text-slate-600">মোট ধার্য:</span>
                  <span className="font-bold text-slate-800">{formatBDT(payingDue.amountDue)}</span>
                </div>
                {payingDue.amountPaid > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">পূর্বের পরিশোধ:</span>
                    <span className="text-emerald-700 font-bold">
                      {formatBDT(payingDue.amountPaid)}
                    </span>
                  </div>
                )}
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
                <span className="text-[11px] text-slate-500 mt-1 block">
                  আংশিক বা পূর্ণ পরিশোধ প্রযোজ্য
                </span>
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
                  মন্তব্য / ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="যেমন: সরাসরি নগদ প্রদান / বিকাশ TrxID"
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
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <ReceiptIcon className="w-4 h-4" />
                  <span>
                    {isSubmittingPayment ? 'আদায় ও রশিদ তৈরি হচ্ছে...' : 'জমা নিশ্চিত ও রশিদ তৈরি'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Generate Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <span>মাসের চাঁদা ব্যাচ প্রস্তুত (Batch Dues)</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                নির্বাচিত মাসের জন্য সকল <strong>সক্রিয় সদস্যদের (Active Members)</strong> নামে চাঁদা ধার্য করা হবে। যাঁদের চাঁদা ইতোমধ্যে তৈরি আছে, তাঁদের হিসাব অপরিবর্তিত থাকবে (কোন ডুপ্লিকেট হবে না)।
              </p>

              {batchMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium text-xs">
                  {batchMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মাস</label>
                  <select
                    value={batchMonth}
                    onChange={(e) => setBatchMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {BENGALI_MONTHS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সাল</label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {toBengaliDigits(y)} সাল
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মাসিক চাঁদার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  min={1}
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBatchGenerate}
                  disabled={isBatchGenerating}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isBatchGenerating ? 'প্রস্তুত হচ্ছে...' : 'চাঁদার হিসাব তৈরি করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
