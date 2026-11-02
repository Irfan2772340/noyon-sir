import React, { useState } from 'react';
import { Member, OrgSettings } from '../types';
import { toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import { getMemberVerificationUrl, downloadQRCodeImage } from '../utils/qr';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  User,
  QrCode,
} from 'lucide-react';

interface MemberQRModalProps {
  member: Member | null;
  settings: OrgSettings;
  onClose: () => void;
  onOpenPublicVerification?: (memberId: string) => void;
}

export const MemberQRModal: React.FC<MemberQRModalProps> = ({
  member,
  settings,
  onClose,
  onOpenPublicVerification,
}) => {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const verificationUrl = getMemberVerificationUrl(member.memberId);
  const qrSvgId = `member-qr-${member.memberId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    downloadQRCodeImage(qrSvgId, `QR-${member.memberId}-${member.nameBn}.svg`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Modal Top Bar */}
        <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
            <QrCode className="w-5 h-5 text-emerald-700" />
            <span>সদস্য কিউআর কোড ও অনলাইন ভেরিফিকেশন</span>
          </div>
          <button
            onClick={onClose}
            title="বন্ধ করুন"
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 print:p-4">
          <div
            id="printable-qr-badge"
            className="border-2 border-emerald-600 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/40 text-center relative overflow-hidden shadow-sm"
          >
            {/* Header with Official Logo */}
            <div className="border-b border-emerald-200 pb-3 mb-4 flex items-center justify-center space-x-3 text-left">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-600 bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                  alt="SPWA"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300 font-bold text-[9px] tracking-wider uppercase mb-0.5">
                  ডিজিটাল মেম্বার ব্যাজ
                </span>
                <h3 className="text-sm sm:text-base font-black text-emerald-950 leading-tight">
                  {settings.orgNameBn}
                </h3>
                <p className="text-[10px] text-emerald-700 font-medium">
                  {settings.orgNameEn}
                </p>
              </div>
            </div>

            {/* Member Info */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-600 overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.nameBn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-emerald-700" />
                )}
              </div>
              <div className="text-left">
                <h4 className="text-base font-black text-slate-900 leading-tight">
                  {member.nameBn}
                </h4>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-bold text-emerald-800 text-xs">
                    আইডি: {member.memberId}
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {member.position}
                  </span>
                </div>
              </div>
            </div>

            {/* Big High-Res QR Code */}
            <div className="inline-block p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 my-1">
              <QRCodeSVG
                id={qrSvgId}
                value={verificationUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Instructions */}
            <p className="text-xs text-slate-600 font-medium mt-3 max-w-xs mx-auto">
              যেকোনো স্মার্টফোনের ক্যামেরা দিয়ে কিউআর কোড স্ক্যান করে সদস্যের পরিচিতি
              ও চাঁদার স্থিতি অনলাইন যাচাই করুন।
            </p>

            {/* Status footer inside badge */}
            <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-slate-600 px-2">
              <span className="flex items-center space-x-1 text-emerald-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>যাচাইকৃত প্রোফাইল</span>
              </span>
              <span className="font-semibold text-slate-700">
                যোগদান: {toBengaliDigits(member.joiningDate)}
              </span>
            </div>
          </div>

          {/* Verification URL Display & Copy */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              সরাসরি পাবলিক যাচাইকরণ লিঙ্ক:
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={verificationUrl}
                className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 print:hidden">
          {onOpenPublicVerification ? (
            <button
              onClick={() => {
                onClose();
                onOpenPublicVerification(member.memberId);
              }}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>যাচাইকরণ পাতা খুলুন</span>
            </button>
          ) : (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>যাচাইকরণ পাতা খুলুন</span>
            </a>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড (SVG)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট কিউআর ব্যাজ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
