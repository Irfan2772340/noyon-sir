import React, { useState } from 'react';
import { Receipt, OrgSettings } from '../types';
import { formatBDT, toBengaliDigits } from '../utils/bengali';
import {
  ReceiptText,
  Search,
  Printer,
  Calendar,
  Filter,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface ReceiptsViewProps {
  receipts: Receipt[];
  settings: OrgSettings;
  onOpenReceipt: (receipt: Receipt) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  settings,
  onOpenReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredReceipts = receipts
    .filter((r) => {
      const matchType = typeFilter === 'all' || r.paymentType === typeFilter;
      const matchSearch =
        r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.memberNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.period.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalReceiptsAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-emerald-700" />
            <span>অফিসিয়াল মানি রশিদ রেজিস্টার (Money Receipts)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            চাঁদা ও অনুদানের অনুমোদিত মানি রশিদ যাচাই, ডাউনলোড ও প্রিন্ট
          </p>
        </div>

        <div className="text-right sm:text-right bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
          <span className="text-[11px] text-emerald-800 font-medium block">
            রশিদের সর্বমোট সংগৃহীত অর্থ
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">
            {formatBDT(totalReceiptsAmount)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="রশিদ নং (REC-...), সদস্য নাম বা আইডি..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">খাত:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">সকল রশিদ (All Receipts)</option>
            <option value="monthly">মাসিক চাঁদা (Monthly)</option>
            <option value="annual">বার্ষিক চাঁদা (Annual)</option>
            <option value="donation">অনুদান (Donation)</option>
          </select>
        </div>
      </div>

      {/* Receipts List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">রশিদ নম্বর</th>
                <th className="px-4 py-3 text-left font-semibold">সদস্যের নাম ও আইডি</th>
                <th className="px-4 py-3 text-left font-semibold">খাত ও সময়কাল</th>
                <th className="px-4 py-3 text-left font-semibold">তারিখ ও মাধ্যম</th>
                <th className="px-4 py-3 text-right font-semibold">আদায়ের পরিমাণ</th>
                <th className="px-4 py-3 text-right font-semibold">প্রিন্ট ও দেখুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    কোন রশিদ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800 text-xs">
                      {r.receiptNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{r.memberNameBn}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{r.memberId}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-semibold block">
                        {r.paymentType === 'monthly'
                          ? 'মাসিক চাঁদা'
                          : r.paymentType === 'annual'
                          ? 'বার্ষিক চাঁদা'
                          : 'অনুদান'}
                      </span>
                      <span className="text-[11px] text-emerald-800">{r.period}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <div>{toBengaliDigits(r.date)}</div>
                      <div className="text-[11px] text-slate-400">{r.paymentMethod}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">
                      {formatBDT(r.amount)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(r)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>রশিদ প্রিন্ট</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
