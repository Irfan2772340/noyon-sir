import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Member,
  MonthlyDue,
  AnnualDue,
  Transaction,
  Receipt,
  Announcement,
  OrgSettings,
} from '../types';
import { formatBDT, toBengaliDigits, BENGALI_MONTHS } from '../utils/bengali';
import { calculateFundSummary } from '../utils/calculations';
import {
  Users,
  CalendarCheck,
  AlertCircle,
  Wallet,
  Landmark,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Megaphone,
  PlusCircle,
  ReceiptText,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  members: Member[];
  monthlyDues: MonthlyDue[];
  annualDues: AnnualDue[];
  transactions: Transaction[];
  receipts: Receipt[];
  announcements: Announcement[];
  settings: OrgSettings;
  onNavigate: (tab: NavTab) => void;
  onOpenQuickPayment: () => void;
  onOpenAddMember: () => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  monthlyDues,
  annualDues,
  transactions,
  receipts,
  announcements,
  settings,
  onNavigate,
  onOpenQuickPayment,
  onOpenAddMember,
  onOpenAddTransaction,
}) => {
  const { isAdmin, role } = useAuth();

  // Active members
  const activeMembers = members.filter((m) => m.status === 'active');

  // Fund summary
  const fund = calculateFundSummary(transactions);

  // Current month collection
  const now = new Date();
  const currentMonthId = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const thisMonthDues = monthlyDues.filter(
    (d) => d.year === currentYear && d.month === currentMonthId
  );
  const thisMonthCollected = thisMonthDues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
  const thisMonthTarget = thisMonthDues.reduce((sum, d) => sum + (d.amountDue || 0), 0);

  // Total Outstanding dues across all records
  const totalMonthlyDue = monthlyDues.reduce((sum, d) => sum + (d.amountDue || 0), 0);
  const totalMonthlyPaid = monthlyDues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
  const totalAnnualDue = annualDues.reduce((sum, d) => sum + (d.amountDue || 0), 0);
  const totalAnnualPaid = annualDues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
  const totalOutstanding = Math.max(0, totalMonthlyDue - totalMonthlyPaid) + Math.max(0, totalAnnualDue - totalAnnualPaid);

  const currentMonthNameBn =
    BENGALI_MONTHS.find((m) => m.id === currentMonthId)?.name || 'চলতি মাস';

  return (
    <div className="space-y-6">
      {/* Top Banner with Org Title, Official Emblem & Financial Year */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-400 bg-white overflow-hidden shadow-lg shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                  alt="SPWA Emblem"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-700/60 px-3 py-0.5 rounded-full text-xs font-semibold text-amber-300 border border-emerald-600/60 mb-1">
                  <span>অর্থবছর: {settings.financialYear}</span>
                  <span>•</span>
                  <span>স্থাপিত: {settings.establishedDateBn || '৫ ই মে ২০২৬ খ্রি.'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                  স্বাগতম, {settings.orgNameBn}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
                  {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'} • {settings.address}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Chips */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-emerald-700/60">
              <button
                onClick={onOpenQuickPayment}
                className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>চাঁদা আদায় এন্ট্রি</span>
              </button>
              <button
                onClick={onOpenAddMember}
                className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-emerald-500"
              >
                <Users className="w-4 h-4" />
                <span>নতুন সদস্য যোগ</span>
              </button>
              <button
                onClick={onOpenAddTransaction}
                className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-emerald-500"
              >
                <Wallet className="w-4 h-4" />
                <span>আয় / ব্যয় এন্ট্রি</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-emerald-500"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>রিপোর্ট বিবরণী</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div
          onClick={() => onNavigate('members')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট সক্রিয় সদস্য</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {toBengaliDigits(activeMembers.length)}
            </span>
            <span className="text-xs text-slate-500">জন</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            নিষ্ক্রিয়: {toBengaliDigits(members.length - activeMembers.length)} জন
          </div>
        </div>

        {/* Current Month Collection */}
        <div
          onClick={() => onNavigate('monthly')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {currentMonthNameBn} মাসের আদায়
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-900">
              {formatBDT(thisMonthCollected)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ধার্য: {formatBDT(thisMonthTarget)}
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">সর্বমোট বকেয়া চাঁদা</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-700">
              {formatBDT(totalOutstanding)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">
            মাসিক ও বার্ষিক সম্মিলিত বকেয়া
          </div>
        </div>

        {/* Total Fund Balance */}
        <div
          onClick={() => onNavigate('cashbook')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট তহবিল স্থিতি</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-800">
              {formatBDT(fund.netBalance)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>নগদ: {formatBDT(fund.cashBalance)}</span>
            <span>ব্যাংক: {formatBDT(fund.bankBalance)}</span>
          </div>
        </div>
      </div>

      {/* Cash & Bank Fund Position Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>তহবিল ও ক্যাশ বুক অবস্থান (Fund Position)</span>
          <button
            onClick={() => onNavigate('cashbook')}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            বিস্তারিত খাতা দেখুন &rarr;
          </button>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-500 block">হাতে নগদ (Cash in Hand)</span>
              <span className="text-base font-bold text-slate-900">{formatBDT(fund.cashBalance)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-500 block">ব্যাংক স্থিতি (Bank Balance)</span>
              <span className="text-base font-bold text-slate-900">{formatBDT(fund.bankBalance)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-emerald-800 block font-medium">মোট উদ্বৃত্ত তহবিল (Net Balance)</span>
              <span className="text-lg font-black text-emerald-950">{formatBDT(fund.netBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Cashbook Transactions & Latest Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Cashbook Entries */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>সাম্প্রতিক আয় ও ব্যয় (Recent Transactions)</span>
              </h3>
              <button
                onClick={() => onNavigate('cashbook')}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                সকল এন্ট্রি &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        t.type === 'income'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                        {t.category}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {toBengaliDigits(t.date)} • {t.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold font-mono text-sm ${
                        t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {formatBDT(t.amount)}
                    </p>
                    {t.receiptNumber && (
                      <p className="text-[10px] text-slate-400">{t.receiptNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>বিজ্ঞপ্তি ও নোটিশ বোর্ড (Announcements)</span>
              </h3>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                সকল নোটিশ &rarr;
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {announcements.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {a.content}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>প্রকাশক: {a.authorName}</span>
                    <span>{toBengaliDigits(a.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
