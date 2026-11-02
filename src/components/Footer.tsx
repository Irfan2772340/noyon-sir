import React from 'react';
import { OrgSettings } from '../types';
import { APP_ORG_CONFIG } from '../config/orgConfig';
import { toBengaliDigits } from '../utils/bengali';
import {
  MessageCircle,
  Facebook,
  ShieldCheck,
  Heart,
  ExternalLink,
  Code2,
  MapPin,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface FooterProps {
  settings: OrgSettings;
  onOpenPrivacyPolicy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenPrivacyPolicy }) => {
  const whatsappUrl = settings.whatsappLink || APP_ORG_CONFIG.whatsappLink;
  const facebookUrl = settings.facebookPageLink || APP_ORG_CONFIG.facebookPageLink;
  const developer = APP_ORG_CONFIG.developer;

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 print:hidden font-['Hind_Siliguri',sans-serif] mt-auto">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          {/* Org Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={settings.logoUrl || '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg'}
                  alt="SPWA Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {settings.orgNameBn}
                </h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {settings.orgNameEn}
                </p>
              </div>
            </div>

            <p className="text-xs text-amber-300 font-semibold">
              {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              {settings.address}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="inline-flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>স্থাপিত: {settings.establishedDateBn || '৫ ই মে ২০২৬ খ্রি.'}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                অর্থবছর: {settings.financialYear}
              </span>
            </div>
          </div>

          {/* Social Links & Community Connect */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              অফিসিয়াল কমিউনিটি ও সামাজিক যোগাযোগ
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              সংগঠনের জরুরি বিজ্ঞপ্তি, মাসিক চাঁদার আপডেট ও সামাজিক কর্মকাণ্ডে সরাসরি যুক্ত থাকতে আমাদের হোয়াটসঅ্যাপ গ্রুপে যোগ দিন।
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {/* WhatsApp Community Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>হোয়াটসঅ্যাপ গ্রুপে যুক্ত হোন</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Facebook Page Button */}
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <Facebook className="w-4 h-4 fill-current" />
                  <span>ফেসবুক পেজ</span>
                </a>
              ) : (
                <div className="inline-flex items-center justify-center space-x-1.5 bg-slate-800 text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700">
                  <Facebook className="w-4 h-4 text-slate-500" />
                  <span>ফেসবুক পেজ (শীঘ্রই আসছে)</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenPrivacyPolicy}
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition underline underline-offset-4"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>প্রাইভেসি পলিসি ও তথ্য সুরক্ষা নীতিমালা</span>
              </button>
            </div>
          </div>

          {/* Developer Credit & Support Info */}
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-amber-300">
              <Code2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                কারিগরি সহায়তা ও সিস্টেম ডেভেলপার
              </h4>
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                {developer.name}
              </p>
              <p className="text-xs font-medium text-emerald-400 mt-0.5">
                {developer.degree}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                ইমেইল: <a href={`mailto:${developer.email}`} className="text-slate-300 hover:underline font-mono">{developer.email}</a>
              </p>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal pt-2 border-t border-slate-700">
              সংগঠনের আর্থিক স্বচ্ছতা, ডিজিটাল সদস্য পরিচয়পত্র ও চাঁদা অটোমেশনের জন্য নিবেদিত সফটওয়্যার প্ল্যাটফর্ম।
            </p>
          </div>
        </div>

        {/* Bottom Bar with Developer Credit */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {toBengaliDigits(new Date().getFullYear())} {settings.orgNameBn}। সর্বস্বত্ব সংরক্ষিত।
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span>Developed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current inline" />
            <span>by</span>
            <strong className="text-white hover:text-amber-300 transition">
              {developer.nameEn}
            </strong>
            <span className="text-slate-500">({developer.degree})</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
