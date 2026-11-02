import React from 'react';
import { Receipt, OrgSettings } from '../types';
import { formatBDT, toBengaliDigits } from '../utils/bengali';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  receipt: Receipt | null;
  settings: OrgSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  settings,
  onClose,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Bar (hidden when printing) */}
        <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>অফিসিয়াল মানি রশিদ (Official Money Receipt)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
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

        {/* Printable Official Receipt Body */}
        <div className="p-6 sm:p-8 bg-amber-50/20 border-8 border-emerald-900/10 m-2 rounded-xl print:m-0 print:border-2 print:border-slate-800 print:p-6 print:bg-white">
          {/* Header with Official Logo */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b-2 border-emerald-800 gap-3 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-700 bg-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                alt="SPWA Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center flex-1 px-2">
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold tracking-widest uppercase mb-1">
                মানি রশিদ / MONEY RECEIPT
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                {settings.orgNameBn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {settings.orgNameEn}
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.address} • যোগাযোগ: {toBengaliDigits(settings.phone)}
              </p>
            </div>
            <div className="w-16 sm:w-20 hidden sm:block opacity-0 shrink-0" />
          </div>

          {/* Receipt Info Bar */}
          <div className="grid grid-cols-2 gap-4 my-4 text-xs sm:text-sm bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
            <div>
              <span className="text-slate-500 font-medium">রশিদ নং: </span>
              <span className="font-bold text-slate-900 font-mono">{receipt.receiptNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">তারিখ: </span>
              <span className="font-bold text-slate-900">{toBengaliDigits(receipt.date)}</span>
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-800">
            <div className="flex border-b border-dashed border-slate-300 pb-1.5">
              <span className="w-32 text-slate-500 flex-shrink-0">সদস্যের নাম:</span>
              <span className="font-bold text-slate-900 text-base">{receipt.memberNameBn}</span>
            </div>

            <div className="flex border-b border-dashed border-slate-300 pb-1.5">
              <span className="w-32 text-slate-500 flex-shrink-0">সদস্য আইডি:</span>
              <span className="font-bold font-mono text-emerald-800">{receipt.memberId}</span>
              {receipt.phone && (
                <span className="ml-auto text-slate-500">মোবাইল: {toBengaliDigits(receipt.phone)}</span>
              )}
            </div>

            <div className="flex border-b border-dashed border-slate-300 pb-1.5">
              <span className="w-32 text-slate-500 flex-shrink-0">পরিশোধের খাত:</span>
              <span className="font-semibold text-slate-900">
                {receipt.paymentType === 'monthly'
                  ? 'মাসিক চাঁদা'
                  : receipt.paymentType === 'annual'
                  ? 'বার্ষিক চাঁদা'
                  : receipt.paymentType === 'donation'
                  ? 'অনুদান'
                  : 'অন্যান্য'}
              </span>
              <span className="ml-auto font-medium text-emerald-900">সময়কাল: {receipt.period}</span>
            </div>

            <div className="flex border-b border-dashed border-slate-300 pb-1.5">
              <span className="w-32 text-slate-500 flex-shrink-0">টাকার পরিমাণ:</span>
              <span className="font-black text-lg text-emerald-900">
                {formatBDT(receipt.amount)}
              </span>
              <span className="ml-auto text-slate-500">পদ্ধতি: {receipt.paymentMethod}</span>
            </div>

            <div className="flex border-b border-dashed border-slate-300 pb-1.5 bg-slate-50 p-2 rounded">
              <span className="w-32 text-slate-500 flex-shrink-0">কথায়:</span>
              <span className="font-bold text-slate-800 italic">{receipt.amountInWords}</span>
            </div>

            {receipt.notes && (
              <div className="text-xs text-slate-500 pt-1">
                মন্তব্য: {receipt.notes}
              </div>
            )}
          </div>

          {/* Verification Badge & Signatures */}
          <div className="mt-8 pt-4 flex items-end justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-medium text-[11px]">অনুমোদিত কম্পিউটার জেনারেটেড রশিদ</span>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-800">{receipt.recorderName || 'দায়িত্বপ্রাপ্ত কোষাধ্যক্ষ'}</p>
              <p className="text-[10px] text-slate-500">আদায়কারীর স্বাক্ষর</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (hidden when printing) */}
        <div className="bg-slate-50 px-4 py-3 flex justify-end space-x-2 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            বন্ধ করুন
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট বা PDF হিসেবে সংরক্ষণ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
