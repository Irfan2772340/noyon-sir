import React from 'react';
import { OrgSettings } from '../types';
import { APP_ORG_CONFIG } from '../config/orgConfig';
import { ShieldCheck, Lock, CheckCircle2, X, FileText, Phone, Mail, ExternalLink } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OrgSettings;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Hind_Siliguri',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between border-b border-amber-400/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-amber-300 bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src={settings.logoUrl || '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg'}
                alt="SPWA"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                প্রাইভেসি পলিসি ও তথ্য সুরক্ষা নীতিমালা
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                {settings.orgNameBn} (SPWA)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-700 max-h-[75vh] overflow-y-auto leading-relaxed">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide">নিরাপত্তা ও গোপনীয়তা অঙ্গীকার</h4>
              <p className="text-xs text-emerald-900 mt-0.5">
                সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA) সকল সদস্যের ব্যক্তিগত তথ্য এবং আর্থিক হিসাবের স্বচ্ছতা ও গোপনীয়তা বজায় রাখতে সর্বোচ্চ অঙ্গীকারবদ্ধ।
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">১</span>
              <span>কোন কোন তথ্য সংগ্রহ করা হয়</span>
            </h4>
            <p className="text-slate-600 pl-7">
              সংগঠনের সদস্য নিবন্ধন ও পরিচয়পত্র প্রণয়নের জন্য সদস্যের পূর্ণ নাম, পিতা/স্বামীর নাম, মোবাইল নম্বর, স্থায়ী ও বর্তমান ঠিকানা, জরুরি যোগাযোগ নম্বর এবং ফটো সংগ্রহ করা হয়। এছাড়া মাসিক ও বার্ষিক চাঁদা আদায়ের রেকর্ড সংরক্ষিত থাকে।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">২</span>
              <span>তথ্যের প্রাতিষ্ঠানিক ব্যবহার</span>
            </h4>
            <p className="text-slate-600 pl-7">
              সংগৃহীত সকল তথ্য কেবল সংগঠনের কার্যক্রম পরিচালনা, মাসিক ১০ তারিখের চাঁদা নোটিফিকেশন প্রদান, ডিজিটাল মানি রশিদ ইস্যু এবং বার্ষিক সাধারণ সভায় হিসাব উপস্থাপনের উদ্দেশ্যে ব্যবহৃত হয়। কোনো বাণিজ্যিক উদ্দেশ্যে সদস্যদের তথ্য তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">৩</span>
              <span>ডিজিটাল কিউআর কোড ও অনলাইন ভেরিফিকেশন</span>
            </h4>
            <p className="text-slate-600 pl-7">
              পরিচয়পত্রে মুদ্রিত কিউআর কোড স্ক্যান করলে কেবল সদস্যের বৈধতা, সদস্য আইডি, নাম ও পদবী জনসম্মুখে নিশ্চিত করা হয়। পাসওয়ার্ড বা গোপনীয় ব্যাংকিং বিবরণ কখনোই উন্মুক্ত রাখা হয় না।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">৪</span>
              <span>আর্থিক হিসাব ও অডিট লগ সুরক্ষা</span>
            </h4>
            <p className="text-slate-600 pl-7">
              পোর্টালে সম্পাদিত প্রতিটি চাঁদা আদায়, ট্রানজেকশন অনুমোদন এবং সেটিংস পরিবর্তন একটি অপরিবর্তনীয় অডিট লগে (Immutable Audit Log) সংরক্ষিত থাকে, যা আর্থিক গরমিল প্রতিরোধ করে।
            </p>
          </div>

          {/* Developer & Contact section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-4 space-y-2">
            <h5 className="font-bold text-slate-900 text-xs">কারিগরি সহায়তা ও সিস্টেম ডেভেলপার:</h5>
            <p className="text-xs text-slate-700 font-medium">
              <strong>{APP_ORG_CONFIG.developer.name}</strong> ({APP_ORG_CONFIG.developer.degree})
            </p>
            <p className="text-xs text-slate-500">
              যোগাযোগ ইমেইল: <a href={`mailto:${APP_ORG_CONFIG.developer.email}`} className="text-emerald-700 underline font-mono">{APP_ORG_CONFIG.developer.email}</a>
            </p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              ঠিকানা: {settings.address} | হেল্পলাইন: {settings.phone}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 flex items-center justify-between border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            সর্বশেষ আপডেট: অর্থবছর {settings.financialYear}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition"
          >
            আমি সম্মত / বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
