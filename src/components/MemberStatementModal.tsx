import React from 'react';
import { Member, MonthlyDue, AnnualDue, Receipt, OrgSettings } from '../types';
import { formatBDT, toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import { calculateMemberBalance } from '../utils/calculations';
import { Printer, X, FileText, CheckCircle2, Clock } from 'lucide-react';

interface MemberStatementModalProps {
  member: Member | null;
  monthlyDues: MonthlyDue[];
  annualDues: AnnualDue[];
  receipts: Receipt[];
  settings: OrgSettings;
  onClose: () => void;
}

export const MemberStatementModal: React.FC<MemberStatementModalProps> = ({
  member,
  monthlyDues,
  annualDues,
  receipts,
  settings,
  onClose,
}) => {
  if (!member) return null;

  const memberMonthly = monthlyDues
    .filter((d) => d.memberId === member.memberId)
    .sort((a, b) => b.year - a.year || b.month - a.month);
  const memberAnnual = annualDues
    .filter((d) => d.memberId === member.memberId)
    .sort((a, b) => b.year - a.year);
  const memberReceipts = receipts
    .filter((r) => r.memberId === member.memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const balance = calculateMemberBalance(memberMonthly, memberAnnual);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Bar */}
        <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>সদস্য আর্থিক হিসাব বিবরণী (Member Financial Statement)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div className="p-6 sm:p-8 print:p-4">
          {/* Organization Header with Logo */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b-2 border-emerald-800 gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-700 bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                alt="SPWA Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center flex-1 px-2">
              <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                {settings.orgNameBn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {settings.orgNameEn}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.address} • যোগাযোগ: {toBengaliDigits(settings.phone)}
              </p>
              <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                সদস্য ব্যক্তিগত আর্থিক বিবরণী (Statement of Account)
              </div>
            </div>
            <div className="w-16 hidden sm:block opacity-0 shrink-0" />
          </div>

          {/* Member Profile Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">সদস্যের নাম:</span>
              <span className="font-bold text-slate-900 text-sm">{member.nameBn}</span>
            </div>
            <div>
              <span className="text-slate-500 block">সদস্য আইডি:</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">{member.memberId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">পদবী ও স্থিতি:</span>
              <span className="font-semibold text-slate-800">
                {member.position} ({STATUS_LABELS_BN[member.status]})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">মোবাইল:</span>
              <span className="font-semibold text-slate-800">{toBengaliDigits(member.phone)}</span>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[11px] font-medium text-blue-700 block">মোট ধার্যকৃত চাঁদা</span>
              <span className="text-base sm:text-lg font-bold text-blue-950">
                {formatBDT(balance.totalDue)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[11px] font-medium text-emerald-700 block">মোট পরিশোধিত চাঁদা</span>
              <span className="text-base sm:text-lg font-bold text-emerald-950">
                {formatBDT(balance.totalPaid)}
              </span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              balance.netOutstanding > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-[11px] font-medium block">
                {balance.netOutstanding > 0 ? 'সর্বমোট বকেয়া' : 'বকেয়া নেই'}
              </span>
              <span className="text-base sm:text-lg font-bold">
                {formatBDT(balance.netOutstanding)}
              </span>
            </div>
          </div>

          {/* Monthly Dues Table */}
          <div className="mb-6">
            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center justify-between">
              <span>মাসিক চাঁদা বিবরণী (Monthly Dues)</span>
              <span className="text-xs text-slate-500 font-normal">
                বকেয়া মাস: {toBengaliDigits(balance.monthlyUnpaidCount + balance.monthlyPartialCount)} টি
              </span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">মাস ও বছর</th>
                    <th className="px-3 py-2 text-right font-semibold">ধার্য চাঁদা</th>
                    <th className="px-3 py-2 text-right font-semibold">পরিশোধ</th>
                    <th className="px-3 py-2 text-center font-semibold">স্থিতি</th>
                    <th className="px-3 py-2 text-left font-semibold">পরিশোধের তারিখ ও রশিদ নং</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {memberMonthly.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                        কোন মাসিক চাঁদার রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    memberMonthly.map((due) => (
                      <tr key={due.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {due.monthNameBn} {toBengaliDigits(due.year)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">{formatBDT(due.amountDue)}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                          {formatBDT(due.amountPaid)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                        <td className="px-3 py-2 text-slate-600">
                          {due.paymentDate ? (
                            <span>
                              {toBengaliDigits(due.paymentDate)} {due.receiptNumber && `(${due.receiptNumber})`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annual Dues Table */}
          <div className="mb-6">
            <h4 className="font-bold text-sm text-slate-900 mb-2">
              বার্ষিক চাঁদা বিবরণী (Annual Dues)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">অর্থবছর / বছর</th>
                    <th className="px-3 py-2 text-right font-semibold">ধার্য চাঁদা</th>
                    <th className="px-3 py-2 text-right font-semibold">পরিশোধ</th>
                    <th className="px-3 py-2 text-center font-semibold">স্থিতি</th>
                    <th className="px-3 py-2 text-left font-semibold">পরিশোধের তারিখ ও রশিদ নং</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {memberAnnual.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                        কোন বার্ষিক চাঁদার রেকর্ড নেই।
                      </td>
                    </tr>
                  ) : (
                    memberAnnual.map((due) => (
                      <tr key={due.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {due.financialYear} ({toBengaliDigits(due.year)})
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">{formatBDT(due.amountDue)}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                          {formatBDT(due.amountPaid)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              due.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {STATUS_LABELS_BN[due.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {due.paymentDate ? (
                            <span>
                              {toBengaliDigits(due.paymentDate)} {due.receiptNumber && `(${due.receiptNumber})`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Certification */}
          <div className="mt-10 pt-4 flex items-end justify-between text-xs text-slate-600 border-t border-slate-200">
            <div>
              <p className="text-[11px] text-slate-500">বিবরণী তৈরির তারিখ: {toBengaliDigits(new Date().toISOString().split('T')[0])}</p>
              <p className="text-[10px] text-slate-400">সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন সফটওয়্যার কর্তৃক সংরক্ষিত</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-800">কোষাধ্যক্ষ / সাধারণ সম্পাদক</p>
              <p className="text-[10px] text-slate-500">অনুমোদিত স্বাক্ষর</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="bg-slate-50 px-4 py-3 flex justify-end space-x-2 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            বন্ধ করুন
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm inline-flex items-center space-x-1"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
