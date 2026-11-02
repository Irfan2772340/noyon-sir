import React, { useState } from 'react';
import {
  Member,
  MonthlyDue,
  AnnualDue,
  Transaction,
  Receipt,
  OrgSettings,
} from '../types';
import {
  formatBDT,
  toBengaliDigits,
  BENGALI_MONTHS,
  STATUS_LABELS_BN,
} from '../utils/bengali';
import {
  calculateFundSummary,
  calculateMemberBalance,
} from '../utils/calculations';
import {
  FileSpreadsheet,
  Printer,
  CalendarCheck2,
  CalendarDays,
  AlertOctagon,
  Wallet,
  Landmark,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

type ReportTab =
  | 'monthly'
  | 'annual'
  | 'outstanding'
  | 'income_expense'
  | 'cash_bank';

interface ReportsViewProps {
  members: Member[];
  monthlyDues: MonthlyDue[];
  annualDues: AnnualDue[];
  transactions: Transaction[];
  receipts: Receipt[];
  settings: OrgSettings;
  onOpenStatement?: (member: Member) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  members,
  monthlyDues,
  annualDues,
  transactions,
  receipts,
  settings,
  onOpenStatement,
}) => {
  const [activeReport, setActiveReport] = useState<ReportTab>('monthly');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const fund = calculateFundSummary(transactions);

  // 1. Monthly collection report data
  const currentMonthDues = monthlyDues.filter(
    (d) => d.year === selectedYear && d.month === selectedMonth
  );
  const monthlyTotalTarget = currentMonthDues.reduce((s, d) => s + (d.amountDue || 0), 0);
  const monthlyTotalPaid = currentMonthDues.reduce((s, d) => s + (d.amountPaid || 0), 0);
  const monthlyTotalDue = Math.max(0, monthlyTotalTarget - monthlyTotalPaid);

  // 2. Annual collection report data
  const currentYearAnnualDues = annualDues.filter((d) => d.year === selectedYear);
  const annualTotalTarget = currentYearAnnualDues.reduce((s, d) => s + (d.amountDue || 0), 0);
  const annualTotalPaid = currentYearAnnualDues.reduce((s, d) => s + (d.amountPaid || 0), 0);
  const annualTotalDue = Math.max(0, annualTotalTarget - annualTotalPaid);

  // 3. Outstanding dues report data (Members who have outstanding balances)
  const outstandingMembersList = members
    .map((member) => {
      const mDues = monthlyDues.filter((d) => d.memberId === member.memberId);
      const aDues = annualDues.filter((d) => d.memberId === member.memberId);
      const balance = calculateMemberBalance(mDues, aDues);
      return {
        member,
        balance,
      };
    })
    .filter((item) => item.balance.netOutstanding > 0)
    .sort((a, b) => b.balance.netOutstanding - a.balance.netOutstanding);

  const totalOutstandingAcrossAll = outstandingMembersList.reduce(
    (sum, item) => sum + item.balance.netOutstanding,
    0
  );

  // 4. Income & Expense breakdown
  const incomeCategoryMap: Record<string, number> = {};
  const expenseCategoryMap: Record<string, number> = {};

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      incomeCategoryMap[t.category] = (incomeCategoryMap[t.category] || 0) + amt;
    } else {
      expenseCategoryMap[t.category] = (expenseCategoryMap[t.category] || 0) + amt;
    }
  }

  const currentMonthNameBn =
    BENGALI_MONTHS.find((m) => m.id === selectedMonth)?.name || '';

  return (
    <div className="space-y-5">
      {/* Top Header & Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>সাংগঠনিক ও আর্থিক রিপোর্ট (Reports & Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মাসিক আদায়, বার্ষিক চাঁদা, বকেয়া তালিকা, আয়-ব্যয় ও তহবিলের অফিসিয়াল প্রতিবেদন
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>রিপোর্ট প্রিন্ট বা PDF সংরক্ষণ</span>
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5 print:hidden">
        {[
          { id: 'monthly' as ReportTab, label: 'মাসিক আদায় রিপোর্ট', icon: CalendarCheck2 },
          { id: 'annual' as ReportTab, label: 'বার্ষিক চাঁদা রিপোর্ট', icon: CalendarDays },
          { id: 'outstanding' as ReportTab, label: 'বকেয়া চাঁদা রিপোর্ট', icon: AlertOctagon },
          { id: 'income_expense' as ReportTab, label: 'আয়-ব্যয় বিবরণী', icon: Wallet },
          { id: 'cash_bank' as ReportTab, label: 'নগদ ও ব্যাংক তহবিল', icon: Landmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs print:p-0 print:border-none print:shadow-none">
        {/* Printable Official Letterhead Header */}
        <div className="text-center pb-4 border-b-2 border-emerald-800 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
            {settings.orgNameBn}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {settings.orgNameEn}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.address} • যোগাযোগ: {toBengaliDigits(settings.phone)}
          </p>
          <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            {activeReport === 'monthly' && `মাসিক চাঁদা আদায় রিপোর্ট - ${currentMonthNameBn} ${toBengaliDigits(selectedYear)}`}
            {activeReport === 'annual' && `বার্ষিক চাঁদা আদায় রিপোর্ট - ${toBengaliDigits(selectedYear)} (${settings.financialYear})`}
            {activeReport === 'outstanding' && 'সদস্যদের বকেয়া চাঁদা সংক্রান্ত বিস্তারিত প্রতিবেদন'}
            {activeReport === 'income_expense' && `আয় ও ব্যয় সংক্রান্ত ক্যাশ বুক হিসাব বিবরণী (${settings.financialYear})`}
            {activeReport === 'cash_bank' && 'নগদ ও ব্যাংক তহবিলের সামগ্রিক অবস্থান প্রতিবেদন'}
          </div>
        </div>

        {/* 1. MONTHLY COLLECTION REPORT */}
        {activeReport === 'monthly' && (
          <div className="space-y-4">
            {/* Filter Bar (hidden when print) */}
            <div className="flex items-center space-x-3 print:hidden bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">মাস ও বছর নির্বাচন:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="py-1 px-2.5 rounded-lg border border-slate-300"
              >
                {BENGALI_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="py-1 px-2.5 rounded-lg border border-slate-300"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {toBengaliDigits(y)} সাল
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">মোট ধার্যকৃত চাঁদা</span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {formatBDT(monthlyTotalTarget)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block">মোট আদায়কৃত চাঁদা</span>
                <span className="text-base sm:text-lg font-bold text-emerald-900">
                  {formatBDT(monthlyTotalPaid)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-700 block">মোট বকেয়া চাঁদা</span>
                <span className="text-base sm:text-lg font-bold text-rose-900">
                  {formatBDT(monthlyTotalDue)}
                </span>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">সদস্য আইডি</th>
                    <th className="px-3 py-2 text-left font-semibold">সদস্যের নাম</th>
                    <th className="px-3 py-2 text-right font-semibold">ধার্য চাঁদা</th>
                    <th className="px-3 py-2 text-right font-semibold">আদায়কৃত</th>
                    <th className="px-3 py-2 text-right font-semibold">বকেয়া</th>
                    <th className="px-3 py-2 text-center font-semibold">স্থিতি</th>
                    <th className="px-3 py-2 text-left font-semibold">রশিদ ও তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentMonthDues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                        নির্বাচিত মাসের জন্য কোন চাঁদার ডাটা নেই।
                      </td>
                    </tr>
                  ) : (
                    currentMonthDues.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-emerald-800">{d.memberId}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{d.memberNameBn}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatBDT(d.amountDue)}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                          {formatBDT(d.amountPaid || 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-rose-700">
                          {formatBDT(Math.max(0, d.amountDue - (d.amountPaid || 0)))}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {STATUS_LABELS_BN[d.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {d.receiptNumber ? (
                            <span>
                              {d.receiptNumber} ({toBengaliDigits(d.paymentDate || '')})
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ANNUAL COLLECTION REPORT */}
        {activeReport === 'annual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">মোট ধার্য বার্ষিক ফি</span>
                <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                  {formatBDT(annualTotalTarget)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block">মোট আদায়</span>
                <span className="text-base sm:text-lg font-bold text-emerald-900 font-mono">
                  {formatBDT(annualTotalPaid)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-700 block">বকেয়া বার্ষিক ফি</span>
                <span className="text-base sm:text-lg font-bold text-rose-900 font-mono">
                  {formatBDT(annualTotalDue)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">সদস্য আইডি</th>
                    <th className="px-3 py-2 text-left font-semibold">সদস্যের নাম</th>
                    <th className="px-3 py-2 text-left font-semibold">অর্থবছর</th>
                    <th className="px-3 py-2 text-right font-semibold">ধার্য চাঁদা</th>
                    <th className="px-3 py-2 text-right font-semibold">আদায়কৃত</th>
                    <th className="px-3 py-2 text-center font-semibold">স্থিতি</th>
                    <th className="px-3 py-2 text-left font-semibold">রশিদ ও তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentYearAnnualDues.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-emerald-800">{d.memberId}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{d.memberNameBn}</td>
                      <td className="px-3 py-2 text-slate-600">{d.financialYear}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatBDT(d.amountDue)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                        {formatBDT(d.amountPaid || 0)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            d.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {STATUS_LABELS_BN[d.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {d.receiptNumber ? (
                          <span>
                            {d.receiptNumber} ({toBengaliDigits(d.paymentDate || '')})
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. OUTSTANDING DUES REPORT */}
        {activeReport === 'outstanding' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="font-bold text-rose-950 block">
                  মোট বকেয়াগ্রস্ত সদস্য সংখ্যা: {toBengaliDigits(outstandingMembersList.length)} জন
                </span>
                <span className="text-rose-700 text-xs">
                  সংগঠনের বকেয়া আদায়ে অগ্রাধিকার ভিত্তিতে তাগিদ দিন
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-rose-700 block">সর্বমোট বকেয়া টাকার পরিমাণ</span>
                <span className="text-xl font-black text-rose-900 font-mono">
                  {formatBDT(totalOutstandingAcrossAll)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">সদস্য পরিচিতি</th>
                    <th className="px-3 py-2 text-left font-semibold">মোবাইল</th>
                    <th className="px-3 py-2 text-right font-semibold">মাসিক বকেয়া</th>
                    <th className="px-3 py-2 text-right font-semibold">বার্ষিক বকেয়া</th>
                    <th className="px-3 py-2 text-right font-semibold">সর্বমোট বকেয়া</th>
                    <th className="px-3 py-2 text-center font-semibold">বকেয়া মাস</th>
                    <th className="px-3 py-2 text-right font-semibold">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {outstandingMembersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                        আলহামদুলিল্লাহ! বর্তমানে কোন সদস্যের চাঁদা বকেয়া নেই।
                      </td>
                    </tr>
                  ) : (
                    outstandingMembersList.map(({ member, balance }) => (
                      <tr key={member.memberId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <span className="font-bold text-slate-900 block">{member.nameBn}</span>
                          <span className="font-mono text-emerald-800 text-[11px]">
                            {member.memberId}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {toBengaliDigits(member.phone)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-rose-700 font-semibold">
                          {formatBDT(balance.monthlyOutstanding)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-rose-700 font-semibold">
                          {formatBDT(balance.annualOutstanding)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-black text-rose-900 text-sm">
                          {formatBDT(balance.netOutstanding)}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {toBengaliDigits(balance.monthlyUnpaidCount)} মাস
                        </td>
                        <td className="px-3 py-2 text-right">
                          {onOpenStatement && (
                            <button
                              onClick={() => onOpenStatement(member)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px]"
                            >
                              বিবরণী
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. INCOME & EXPENSE REPORT */}
        {activeReport === 'income_expense' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
              {/* Income breakdown */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-700 text-white p-3 font-bold flex items-center justify-between">
                  <span>আয়ের খাতভিত্তিক বিবরণ (Income Breakdown)</span>
                  <span className="font-mono">{formatBDT(fund.totalIncome)}</span>
                </div>
                <div className="divide-y divide-slate-100 p-2">
                  {Object.entries(incomeCategoryMap).map(([category, amount]) => (
                    <div key={category} className="py-2 px-2 flex justify-between">
                      <span className="text-slate-800">{category}</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {formatBDT(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense breakdown */}
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="bg-rose-700 text-white p-3 font-bold flex items-center justify-between">
                  <span>ব্যয়ের খাতভিত্তিক বিবরণ (Expense Breakdown)</span>
                  <span className="font-mono">{formatBDT(fund.totalExpense)}</span>
                </div>
                <div className="divide-y divide-slate-100 p-2">
                  {Object.entries(expenseCategoryMap).map(([category, amount]) => (
                    <div key={category} className="py-2 px-2 flex justify-between">
                      <span className="text-slate-800">{category}</span>
                      <span className="font-bold text-rose-800 font-mono">
                        {formatBDT(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Net Surplus Card */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-semibold uppercase block">
                  অর্থবছরের নিট আর্থিক উদ্বৃত্ত (Net Surplus)
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-950">
                  {formatBDT(fund.netBalance)}
                </span>
              </div>
              <div className="text-right text-xs text-slate-600">
                <span>হাতে নগদ: {formatBDT(fund.cashBalance)}</span>
                <span className="block mt-0.5">ব্যাংক স্থিতি: {formatBDT(fund.bankBalance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. CASH & BANK POSITION REPORT */}
        {activeReport === 'cash_bank' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center space-x-2 text-amber-800 font-bold mb-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span>নগদ তহবিল স্থিতি (Cash in Hand Position)</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">নগদে মোট জমা:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatBDT(fund.cashIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">নগদে মোট খরচ:</span>
                    <span className="font-mono font-bold text-rose-700">{formatBDT(fund.cashExpense)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1.5 font-bold text-sm">
                    <span className="text-slate-900">বর্তমান নগদ স্থিতি:</span>
                    <span className="font-mono text-amber-900">{formatBDT(fund.cashBalance)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center space-x-2 text-blue-800 font-bold mb-2">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <span>ব্যাংক তহবিল স্থিতি (Bank Account Position)</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ব্যাংকে মোট জমা:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatBDT(fund.bankIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ব্যাংক থেকে মোট খরচ:</span>
                    <span className="font-mono font-bold text-rose-700">{formatBDT(fund.bankExpense)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1.5 font-bold text-sm">
                    <span className="text-slate-900">বর্তমান ব্যাংক স্থিতি:</span>
                    <span className="font-mono text-blue-900">{formatBDT(fund.bankBalance)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-700 text-white flex items-center justify-between">
              <span className="font-bold text-base">সম্মিলিত মোট তহবিল স্থিতি (Net Combined Fund)</span>
              <span className="font-mono text-2xl font-black text-amber-300">{formatBDT(fund.netBalance)}</span>
            </div>
          </div>
        )}

        {/* Official Signatures Footer (Visible in Print) */}
        <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs text-slate-700">
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
            <p className="font-bold">কোষাধ্যক্ষ</p>
            <p className="text-[10px] text-slate-500">হিসাব ও তহবিল দায়িত্ব</p>
          </div>
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
            <p className="font-bold">সাধারণ সম্পাদক</p>
            <p className="text-[10px] text-slate-500">কার্যকরী কমিটি</p>
          </div>
          <div>
            <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
            <p className="font-bold">সভাপতি</p>
            <p className="text-[10px] text-slate-500">সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন</p>
          </div>
        </div>
      </div>
    </div>
  );
};
