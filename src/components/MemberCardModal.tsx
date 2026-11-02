import React from 'react';
import { Member, OrgSettings } from '../types';
import { toBengaliDigits } from '../utils/bengali';
import { getMemberVerificationUrl } from '../utils/qr';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, User, QrCode } from 'lucide-react';

interface MemberCardModalProps {
  member: Member | null;
  settings: OrgSettings;
  onClose: () => void;
  onOpenQRModal?: (member: Member) => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({
  member,
  settings,
  onClose,
  onOpenQRModal,
}) => {
  if (!member) return null;

  const verificationUrl = getMemberVerificationUrl(member.memberId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Modal Top Bar */}
        <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 print:hidden">
          <div className="text-emerald-800 font-semibold text-sm">
            অফিসিয়াল সদস্য পরিচয়পত্র (Member ID Card)
          </div>
          <div className="flex items-center space-x-2">
            {onOpenQRModal && (
              <button
                onClick={() => onOpenQRModal(member)}
                className="inline-flex items-center space-x-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                title="পূর্ণাঙ্গ কিউআর কোড ব্যাজ দেখুন"
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>কিউআর ব্যাজ</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট</span>
            </button>
            <button
              onClick={onClose}
              title="বন্ধ করুন"
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Member ID Card UI */}
        <div className="p-6 flex justify-center print:p-0">
          <div className="w-80 rounded-2xl border-2 border-emerald-800 overflow-hidden shadow-lg bg-gradient-to-b from-emerald-800 via-emerald-800 to-emerald-950 text-white relative">
            {/* Top Org Header with Official Logo */}
            <div className="p-3.5 bg-emerald-900 border-b border-amber-400/40 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-300 bg-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                  alt="SPWA Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="inline-block px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-bold text-[9px] uppercase tracking-wider mb-0.5">
                  সদস্য পরিচয়পত্র
                </div>
                <h3 className="text-xs font-black leading-tight text-white truncate">
                  {settings.orgNameBn}
                </h3>
                <p className="text-[9px] text-emerald-200 truncate">
                  {settings.orgNameEn}
                </p>
              </div>
            </div>

            {/* Photo & Badge */}
            <div className="flex flex-col items-center pt-4 pb-2">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden bg-emerald-700 shadow-md flex items-center justify-center">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.nameBn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-emerald-200" />
                )}
              </div>
              <div className="mt-2 text-center px-4">
                <h4 className="text-lg font-black text-amber-300 leading-tight">
                  {member.nameBn}
                </h4>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 text-xs font-semibold border border-emerald-600">
                  {member.position}
                </div>
              </div>
            </div>

            {/* Info Table */}
            <div className="px-4 py-2.5 space-y-1.5 text-xs bg-emerald-900/60 mx-3 rounded-xl border border-emerald-700/50">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1">
                <span className="text-emerald-300">সদস্য নম্বর:</span>
                <span className="font-bold text-amber-300 text-sm">
                  {member.memberId}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1">
                <span className="text-emerald-300">মোবাইল:</span>
                <span className="font-medium text-white">{toBengaliDigits(member.phone)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1">
                <span className="text-emerald-300">যোগদান:</span>
                <span className="font-medium text-white">{toBengaliDigits(member.joiningDate)}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-emerald-300">ঠিকানা:</span>
                <span className="font-medium text-white text-right max-w-[150px] truncate">
                  {member.address}
                </span>
              </div>
            </div>

            {/* Bottom Scannable QR Code & Signatures */}
            <div className="p-3 text-center text-[10px] text-emerald-300 flex items-center justify-between px-4 mt-1 bg-emerald-950/60 border-t border-emerald-800/60">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-white rounded-md shadow-xs">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={48}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-amber-300 font-bold leading-tight">স্ক্যান ভেরিফিকেশন</p>
                  <p className="text-[8px] text-emerald-400">অনলাইন সত্যতা যাচাই</p>
                </div>
              </div>

              <div className="text-right">
                <div className="w-16 border-b border-emerald-500 mb-0.5 ml-auto"></div>
                <p className="text-[9px] text-emerald-300 font-semibold">সাধারণ সম্পাদক</p>
                <p className="text-[8px] text-emerald-400">অনুমোদিত স্বাক্ষর</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 print:hidden">
          {onOpenQRModal ? (
            <button
              onClick={() => onOpenQRModal(member)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center space-x-1"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>পূর্ণাঙ্গ কিউআর কোড ডাউনলোড / প্রিন্ট</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
            >
              বন্ধ করুন
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs inline-flex items-center space-x-1 transition"
            >
              <Printer className="w-4 h-4" />
              <span>আইডি কার্ড প্রিন্ট</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
