import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member, MonthlyDue, AnnualDue, Receipt, PaymentRequest, OrgSettings } from '../types';
import { formatBDT, toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import { calculateMemberBalance } from '../utils/calculations';
import {
  submitPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  updateMember,
} from '../services/db';
import { processImageFileToDataUrl } from '../utils/imageUpload';
import {
  UserCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Receipt as ReceiptIcon,
  Send,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  Phone,
  MapPin,
  XCircle,
  QrCode,
  Calendar,
  Sparkles,
  Camera,
  Upload,
} from 'lucide-react';
import {
  get10thTarikNotificationStatus,
  getMemberMonthlyDueStatus,
} from '../utils/paymentNotification';

interface PersonalMemberViewProps {
  members: Member[];
  monthlyDues: MonthlyDue[];
  annualDues: AnnualDue[];
  receipts: Receipt[];
  paymentRequests: PaymentRequest[];
  settings: OrgSettings;
  onOpenReceipt: (receipt: Receipt) => void;
  onOpenStatement: (member: Member) => void;
  onOpenCard: (member: Member) => void;
  onOpenQR?: (member: Member) => void;
}

export const PersonalMemberView: React.FC<PersonalMemberViewProps> = ({
  members,
  monthlyDues,
  annualDues,
  receipts,
  paymentRequests,
  settings,
  onOpenReceipt,
  onOpenStatement,
  onOpenCard,
  onOpenQR,
}) => {
  const { user, isAdmin, isMember, linkedMember } = useAuth();

  // If user has a linked member, default to that member; otherwise default to MEM-0001
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    linkedMember?.memberId || members[0]?.memberId || 'MEM-0001'
  );

  // Sync when linkedMember changes (e.g. member logs in)
  React.useEffect(() => {
    if (linkedMember?.memberId) {
      setSelectedMemberId(linkedMember.memberId);
    }
  }, [linkedMember]);


  // Deposit Notification Form state
  const [reqAmount, setReqAmount] = useState<number>(100);
  const [reqType, setReqType] = useState<'monthly' | 'annual' | 'donation'>('monthly');
  const [reqPeriod, setReqPeriod] = useState<string>('চলতি মাস');
  const [reqMethod, setReqMethod] = useState<string>('বিকাশ (bKash)');
  const [reqTrxId, setReqTrxId] = useState<string>('');
  const [reqNotes, setReqNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reject reason state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Member photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState('');

  const currentMember =
    members.find((m) => m.memberId === selectedMemberId) || members[0];

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;
    try {
      setIsUploadingPhoto(true);
      setPhotoUploadMsg('');
      const dataUrl = await processImageFileToDataUrl(file, 400, 0.85);
      await updateMember(currentMember.memberId, { photoUrl: dataUrl });
      currentMember.photoUrl = dataUrl;
      setPhotoUploadMsg('ছবি সফলভাবে আপডেট হয়েছে!');
      setTimeout(() => setPhotoUploadMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'ছবি আপলোডে সমস্যা হয়েছে।');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!currentMember) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">কোন সদস্যের প্রোফাইল পাওয়া যায়নি।</p>
      </div>
    );
  }

  const memberMonthly = monthlyDues
    .filter((d) => d.memberId === currentMember.memberId)
    .sort((a, b) => b.year - a.year || b.month - a.month);
  const memberAnnual = annualDues
    .filter((d) => d.memberId === currentMember.memberId)
    .sort((a, b) => b.year - a.year);
  const memberReceipts = receipts
    .filter((r) => r.memberId === currentMember.memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const memberRequests = paymentRequests.filter(
    (p) => p.memberId === currentMember.memberId
  );

  const balance = calculateMemberBalance(memberMonthly, memberAnnual);

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  const currentDayNum = new Date().getDate();
  const currentMonthDueStatus = getMemberMonthlyDueStatus(
    currentMember.memberId,
    monthlyDues,
    currentYearNum,
    currentMonthNum,
    settings.defaultMonthlyFee || 100
  );
  const notif10th = get10thTarikNotificationStatus(currentDayNum);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTrxId.trim() || reqAmount <= 0) return;

    try {
      setIsSubmitting(true);
      await submitPaymentRequest({
        memberId: currentMember.memberId,
        memberName: currentMember.nameBn,
        amount: reqAmount,
        type: reqType,
        period: reqPeriod,
        method: reqMethod,
        trxId: reqTrxId.trim(),
        status: 'pending',
        submittedBy: user?.uid || 'guest_user',
        notes: reqNotes.trim(),
      });
      setSubmitSuccess(true);
      setReqTrxId('');
      setReqNotes('');
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (req: PaymentRequest) => {
    try {
      await approvePaymentRequest(req, user?.displayName || 'কোষাধ্যক্ষ');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectPaymentRequest(reqId, rejectReason || 'যাচাই করা সম্ভব হয়নি');
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Member Switcher for Admin preview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <span>আমার সদস্য হিসাব ও পোর্টাল (Member Portal)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ব্যক্তিগত চাঁদা হিসাব, রশিদ ও অনলাইন পেমেন্ট ভেরিফিকেশন রিকোয়েস্ট
          </p>
        </div>

        {/* Member Selector (admins can view any member's account) */}
        {isAdmin && (
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold pl-1">সদস্য বাছাই:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="py-1 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            >
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>
                  {m.memberId} - {m.nameBn}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Member Profile Overview Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Profile Avatar with Direct Upload Option */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-emerald-700 flex items-center justify-center text-xl font-bold text-white shadow-inner overflow-hidden">
                {currentMember.photoUrl ? (
                  <img
                    src={currentMember.photoUrl}
                    alt={currentMember.nameBn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentMember.nameBn.charAt(0)
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 p-1.5 rounded-full shadow-md cursor-pointer transition transform active:scale-95"
                title="সদস্যের ছবি আপলোড / পরিবর্তন করুন"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black">{currentMember.nameBn}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-xs font-bold font-mono">
                  {currentMember.memberId}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                {currentMember.position} • যোগদানের তারিখ: {toBengaliDigits(currentMember.joiningDate)}
              </p>
              <div className="flex items-center space-x-3 text-xs text-emerald-100 mt-2">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span>{toBengaliDigits(currentMember.phone)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentMember.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenQR && (
              <button
                onClick={() => onOpenQR(currentMember)}
                className="inline-flex items-center space-x-1.5 bg-emerald-900/80 hover:bg-emerald-900 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs transition border border-emerald-600 shadow-xs"
                title="কিউআর কোড ও ভেরিফিকেশন লিঙ্ক"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>কিউআর কোড</span>
              </button>
            )}
            <button
              onClick={() => onOpenCard(currentMember)}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-2 rounded-xl text-xs transition border border-emerald-500 shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>পরিচয়পত্র</span>
            </button>
            <button
              onClick={() => onOpenStatement(currentMember)}
              className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>পূর্ণাঙ্গ হিসাব বিবরণী</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10th Tarik Personal Monthly Dues Status Alert Card */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
          currentMonthDueStatus.isPaid
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : notif10th.urgency === 'critical'
            ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-rose-300 text-rose-950'
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
              currentMonthDueStatus.isPaid
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-400 text-emerald-950'
            }`}
          >
            {currentMonthDueStatus.isPaid ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Calendar className="w-6 h-6 text-emerald-950" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                প্রতি মাসের ১০ তারিখের নিয়ম
              </span>
              <span className="text-xs font-bold">
                {currentMonthDueStatus.isPaid ? 'পরিশোধ সম্পন্ন' : 'চাঁদা প্রদেয়'}
              </span>
            </div>
            <h4 className="text-base font-black mt-1 leading-tight">
              {currentMonthDueStatus.isPaid
                ? `চলতি মাসের চাঁদা (${formatBDT(currentMonthDueStatus.amountPaid)}) পরিশোধিত`
                : `চলতি মাসের চাঁদা বকেয়া: ${formatBDT(currentMonthDueStatus.remainingDue)}`}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {currentMonthDueStatus.isPaid
                ? 'আপনার চলতি মাসের মাসিক চাঁদা ১০ তারিখের নিয়ম অনুযায়ী পরিশোধিত রয়েছে। সংগঠনের কার্যক্রমে পাশে থাকার জন্য ধন্যবাদ।'
                : notif10th.descriptionBn}
            </p>
          </div>
        </div>

        {!currentMonthDueStatus.isPaid && (
          <a
            href="#deposit-form"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition shrink-0"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>চাঁদা জমা দিন (TrxID)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Balance Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">মোট ধার্য চাঁদা</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatBDT(balance.totalDue)}
          </span>
          <span className="text-[10px] text-slate-400">মাসিক ও বার্ষিক সম্মিলিত</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-medium block">মোট পরিশোধিত</span>
          <span className="text-lg font-black text-emerald-800 mt-1 block">
            {formatBDT(balance.totalPaid)}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">পরিশোধ নিশ্চিত</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          balance.netOutstanding > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <span className="text-[11px] font-medium block">
            {balance.netOutstanding > 0 ? 'সর্বমোট বকেয়া চাঁদা' : 'কোন বকেয়া নেই'}
          </span>
          <span className="text-xl font-black mt-1 block">
            {formatBDT(balance.netOutstanding)}
          </span>
          <span className="text-[10px] block opacity-80">
            বকেয়া মাস: {toBengaliDigits(balance.monthlyUnpaidCount)} টি
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-blue-700 font-medium block">রশিদ সংখ্যা</span>
          <span className="text-lg font-black text-blue-900 mt-1 block">
            {toBengaliDigits(memberReceipts.length)} টি
          </span>
          <span className="text-[10px] text-slate-400">অনুমোদিত মানি রশিদ</span>
        </div>
      </div>

      {/* Payment Deposit Notification Form (Self-Service for member) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
          <Send className="w-4 h-4 text-emerald-700" />
          <span>চাঁদা জমা ও ভেরিফিকেশন তথ্য পাঠান (Submit Payment Deposit)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          আপনি বিকাশ, নগদ বা ব্যাংকের মাধ্যমে চাঁদা পরিশোধ করে থাকলে নিচের ফর্মে ট্রানজেকশন আইডি (TrxID) দিন। কোষাধ্যক্ষ যাচাই করে আপনার নামে মানি রশিদ ইস্যু করবেন।
        </p>

        {submitSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>আপনার জমার তথ্য সফলভাবে জমা হয়েছে! অনুমোদনের অপেক্ষায় রয়েছে।</span>
          </div>
        )}

        <form onSubmit={handleDepositSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">খাত</label>
            <select
              value={reqType}
              onChange={(e) => setReqType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="monthly">মাসিক চাঁদা</option>
              <option value="annual">বার্ষিক চাঁদা</option>
              <option value="donation">বিশেষ অনুদান</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳)</label>
            <input
              type="number"
              required
              min={1}
              value={reqAmount}
              onChange={(e) => setReqAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">পরিশোধের মাধ্যম</label>
            <select
              value={reqMethod}
              onChange={(e) => setReqMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
              <option value="নগদ (Nagad)">নগদ (Nagad)</option>
              <option value="রকেট (Rocket)">রকেট (Rocket)</option>
              <option value="ব্যাংক ট্রান্সফার (Bank)">ব্যাংক ট্রান্সফার (Bank)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ট্রানজেকশন আইডি (TrxID) *</label>
            <input
              type="text"
              required
              placeholder="যেমন: 8N7K6D4..."
              value={reqTrxId}
              onChange={(e) => setReqTrxId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">সময়কাল / মন্তব্য</label>
            <input
              type="text"
              placeholder="যেমন: মার্চ ও এপ্রিল ২০২৫ মাসের চাঁদা"
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'পাঠানো হচ্ছে...' : 'জমা রিকোয়েস্ট পাঠান'}
            </button>
          </div>
        </form>

        {/* Existing Requests Table */}
        {memberRequests.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2">আপনার জমার পূর্ববর্তী রিকোয়েস্ট সমূহ:</h4>
            <div className="space-y-2">
              {memberRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800">{formatBDT(req.amount)}</span> •{' '}
                    <span className="text-slate-600">{req.method}</span> •{' '}
                    <span className="font-mono text-emerald-800">{req.trxId}</span>
                    {req.notes && <p className="text-[11px] text-slate-500 mt-0.5">{req.notes}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {STATUS_LABELS_BN[req.status]}
                    </span>
                    {/* Admin Action on Request */}
                    {isAdmin && req.status === 'pending' && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                        >
                          অনুমোদন
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                        >
                          বাতিল
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Columns: Receipts & Monthly Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Receipts List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ReceiptIcon className="w-4 h-4 text-emerald-700" />
              <span>আপনার মানি রশিদ সমূহ (My Receipts)</span>
            </span>
            <span className="text-xs text-slate-500 font-normal">
              মোট: {toBengaliDigits(memberReceipts.length)} টি
            </span>
          </h3>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {memberReceipts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">এখনও কোন রশিদ ইস্যু করা হয়নি।</p>
            ) : (
              memberReceipts.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onOpenReceipt(r)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-sm">{r.receiptNumber}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {toBengaliDigits(r.date)} • {r.period} • {r.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <span className="font-bold text-emerald-700 text-sm">{formatBDT(r.amount)}</span>
                    <Printer className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Dues Grid/List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>মাসিক চাঁদা বিবরণী (Monthly Contribution Dues)</span>
            <span className="text-xs text-emerald-700 font-semibold">
              বকেয়া: {formatBDT(balance.monthlyOutstanding)}
            </span>
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {memberMonthly.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">কোন চাঁদার রেকর্ড নেই।</p>
            ) : (
              memberMonthly.map((due) => (
                <div
                  key={due.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">
                      {due.monthNameBn} {toBengaliDigits(due.year)}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ধার্য: {formatBDT(due.amountDue)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatBDT(due.amountPaid || 0)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        due.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : due.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {STATUS_LABELS_BN[due.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
