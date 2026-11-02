import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Member, OrgSettings } from '../types';
import { INITIAL_MEMBERS, INITIAL_ORG_SETTINGS } from '../services/initialData';
import { toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import { getMemberVerificationUrl } from '../utils/qr';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Printer,
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Award,
} from 'lucide-react';

interface PublicVerificationViewProps {
  memberId: string;
  onBackToApp?: () => void;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  memberId,
  onBackToApp,
}) => {
  const [member, setMember] = useState<Member | null>(null);
  const [settings, setSettings] = useState<OrgSettings>(INITIAL_ORG_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [verifiedTime, setVerifiedTime] = useState<string>('');

  useEffect(() => {
    // Current verification timestamp in Bengali
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}, ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
    setVerifiedTime(formattedDate);

    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch organization settings
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as OrgSettings);
        }

        // 2. Fetch member by ID
        const memberSnap = await getDoc(doc(db, 'members', memberId));
        if (memberSnap.exists()) {
          setMember(memberSnap.data() as Member);
          setError(false);
        } else {
          // Fallback to initial members dataset (useful during offline or prototyping)
          const fallback = INITIAL_MEMBERS.find(
            (m) => m.memberId.toUpperCase() === memberId.toUpperCase()
          );
          if (fallback) {
            setMember(fallback);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.warn('Firestore fetch notice, using fallback:', err);
        const fallback = INITIAL_MEMBERS.find(
          (m) => m.memberId.toUpperCase() === memberId.toUpperCase()
        );
        if (fallback) {
          setMember(fallback);
          setError(false);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }

    if (memberId) {
      loadData();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [memberId]);

  const verificationUrl = getMemberVerificationUrl(memberId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-emerald-50/40 to-slate-100 py-6 px-3 sm:px-6 font-['Hind_Siliguri',sans-serif] print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto">
        {/* Navigation / Action Top Bar */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মূল ড্যাশবোর্ডে ফিরে যান</span>
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মূল পোর্টালে যান</span>
            </a>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট যাচাইপত্র</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-base font-bold text-slate-800">
              সদস্যের তথ্য যাচাই করা হচ্ছে...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              অনুগ্রহ করে অপেক্ষা করুন, ডাটাবেজ থেকে তথ্য অনুসন্ধান চলছে।
            </p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && (error || !member) && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border-2 border-red-200 shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-red-700">
              সদস্য প্রোফাইল পাওয়া যায়নি!
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              প্রদত্ত সদস্য আইডি (<span className="font-bold text-slate-800">{memberId}</span>)
              সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশনের অফিশিয়াল তালিকায় নিবন্ধিত নেই অথবা
              কিউআর কোডটি সঠিক নয়।
            </p>

            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-center gap-3">
              {onBackToApp ? (
                <button
                  onClick={onBackToApp}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
                >
                  মূল পোর্টালে ফিরে যান
                </button>
              ) : (
                <a
                  href="/"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
                >
                  মূল পোর্টালে ফিরে যান
                </a>
              )}
            </div>
          </div>
        )}

        {/* Verified Member Profile Card */}
        {!loading && member && (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden print:shadow-none print:border-none">
            {/* Top Security Banner with Official Logo */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/20 rounded-full blur-lg pointer-events-none"></div>

              <div className="flex flex-col items-center relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-amber-300 bg-white overflow-hidden shadow-md mb-2 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                    alt="SPWA Logo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="inline-flex items-center space-x-1.5 bg-amber-400/90 text-emerald-950 px-3 py-0.5 rounded-full text-xs font-black tracking-wide uppercase shadow-xs mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-900" />
                  <span>অফিসিয়াল ডিজিটাল ভেরিফিকেশন</span>
                </div>

                <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                  {settings.orgNameBn}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                  {settings.orgNameEn}
                </p>
                <p className="text-[11px] text-amber-200 font-semibold mt-0.5">
                  {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'}
                </p>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  {settings.address} | হেল্পলাইন: {toBengaliDigits(settings.phone)}
                </p>
              </div>
            </div>

            {/* Verification Status Ribbon */}
            <div
              className={`px-4 py-3 text-center flex items-center justify-center space-x-2 text-xs sm:text-sm font-bold border-b ${
                member.status === 'active'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : member.status === 'suspended'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 ${
                  member.status === 'active'
                    ? 'text-emerald-600'
                    : member.status === 'suspended'
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              />
              <span>
                {member.status === 'active'
                  ? 'যাচাইকৃত সক্রিয় সদস্য (VERIFIED ACTIVE MEMBER)'
                  : `সদস্য স্থিতি: ${STATUS_LABELS_BN[member.status]}`}
              </span>
            </div>

            {/* Member Details Body */}
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-200">
                {/* Photo & ID Badge */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-emerald-600 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.nameBn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-slate-400" />
                    )}
                  </div>
                  <div className="mt-2.5 px-3 py-1 bg-emerald-900 text-amber-300 rounded-lg text-xs font-bold tracking-wider">
                    {member.memberId}
                  </div>
                </div>

                {/* Name, Designation & Basic Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5 border border-emerald-300">
                    {member.position}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {member.nameBn}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশনের নিবন্ধিত সাধারণ সদস্য
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <Phone className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">
                          মোবাইল নম্বর
                        </span>
                        <span className="font-semibold text-slate-900">
                          {toBengaliDigits(member.phone)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <Calendar className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">
                          যোগদানের তারিখ
                        </span>
                        <span className="font-semibold text-slate-900">
                          {toBengaliDigits(member.joiningDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">
                          স্থায়ী ঠিকানা
                        </span>
                        <span className="font-semibold text-slate-900">
                          {member.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code and Official Verification Seal */}
              <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 rounded-2xl p-4 sm:p-6 mt-6 border border-slate-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                    <QRCodeSVG
                      id="verification-qr"
                      value={verificationUrl}
                      size={100}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      ডিজিটাল স্ক্যান কোড
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-[220px]">
                      স্মার্টফোনের ক্যামেরা দিয়ে কিউআর কোড স্ক্যান করে এই প্রোফাইলের
                      সত্যতা নিশ্চিত করা যাবে।
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      URL: {member.memberId}
                    </span>
                  </div>
                </div>

                {/* Verification Stamp */}
                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
                  <div className="inline-flex items-center space-x-1 text-emerald-800 font-bold text-xs bg-emerald-100/70 px-2.5 py-1 rounded-md mb-1">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>কর্তৃপক্ষ দ্বারা অনুমোদিত</span>
                  </div>
                  <p className="text-[11px] text-slate-500">যাচাইকরণের সময়:</p>
                  <p className="text-xs font-semibold text-slate-800">{verifiedTime}</p>
                  <div className="w-24 border-b border-emerald-600 mt-4 mb-1 mx-auto sm:ml-auto"></div>
                  <p className="text-[10px] font-bold text-slate-700">
                    সাধারণ সম্পাদক / সভাপতি
                  </p>
                  <p className="text-[9px] text-slate-400">{settings.orgNameBn}</p>
                </div>
              </div>

              {/* Legal / Authenticity Notice */}
              <div className="mt-5 text-center text-[11px] text-slate-500 leading-relaxed">
                এই অনলাইন যাচাইপত্রটি সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশনের অফিশিয়াল ক্লাউড
                ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে তৈরি। কোনো প্রকার অসংগতি বা তথ্যের পরিবর্তনের
                জন্য সরাসরি কার্যনির্বাহী কমিটির সাথে যোগাযোগ করুন।
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 print:hidden">
              <span className="text-xs text-slate-600 font-medium">
                ইমেইল: {settings.email}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
