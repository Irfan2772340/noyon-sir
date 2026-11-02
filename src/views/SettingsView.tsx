import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrgSettings, AuditLog, AdminUser, UserRole } from '../types';
import { toBengaliDigits, formatBDT, ROLE_LABELS_BN } from '../utils/bengali';
import { saveSettings, assignAdminRole, BOOTSTRAP_ADMIN_EMAIL } from '../services/db';
import { APP_ORG_CONFIG } from '../config/orgConfig';
import {
  Settings,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle,
  Save,
  Search,
  Lock,
  UserCheck,
  History,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Info,
  MessageCircle,
} from 'lucide-react';

interface SettingsViewProps {
  settings: OrgSettings;
  auditLogs: AuditLog[];
  onRefreshSettings: (updated?: OrgSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  onRefreshSettings,
}) => {
  const { user, isSuperAdmin, adminProfile } = useAuth();

  // Settings form states
  const [orgNameBn, setOrgNameBn] = useState(settings.orgNameBn || APP_ORG_CONFIG.orgNameBn);
  const [orgNameEn, setOrgNameEn] = useState(settings.orgNameEn || APP_ORG_CONFIG.orgNameEn);
  const [mottoBn, setMottoBn] = useState(settings.mottoBn || APP_ORG_CONFIG.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন');

  // Established date & year
  const [establishedDateBn, setEstablishedDateBn] = useState(
    settings.establishedDateBn || APP_ORG_CONFIG.establishedDateBn || '৫ ই মে ২০২৬ খ্রি.'
  );
  const [establishedYear, setEstablishedYear] = useState(
    settings.establishedYear || APP_ORG_CONFIG.establishedYear || '২০২৬'
  );

  // Financial Year
  const [financialYear, setFinancialYear] = useState(
    settings.financialYear || APP_ORG_CONFIG.financialYear || '২০২৬-২০২৭'
  );

  // Address parts
  const [village, setVillage] = useState(settings.village || APP_ORG_CONFIG.village || 'দুর্গাপুর, চন্ডিজান');
  const [postcode, setPostcode] = useState(settings.postcode || APP_ORG_CONFIG.postcode || '৫৬০০');
  const [upazila, setUpazila] = useState(settings.upazila || APP_ORG_CONFIG.upazila || 'উলিপুর');
  const [district, setDistrict] = useState(settings.district || APP_ORG_CONFIG.district || 'কুড়িগ্রাম');
  const [address, setAddress] = useState(
    settings.address || APP_ORG_CONFIG.address || 'গ্রাম: দুর্গাপুর, চন্ডিজান, পোস্টকোড: ৫৬০০, উপজেলা: উলিপুর, জেলা: কুড়িগ্রাম'
  );

  // Contact info
  const [phone, setPhone] = useState(settings.phone || APP_ORG_CONFIG.phone);
  const [email, setEmail] = useState(settings.email || APP_ORG_CONFIG.email);
  const [whatsappLink, setWhatsappLink] = useState(settings.whatsappLink || APP_ORG_CONFIG.whatsappLink || '');
  const [facebookPageLink, setFacebookPageLink] = useState(settings.facebookPageLink || APP_ORG_CONFIG.facebookPageLink || '');

  // Fees & Deadlines
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState(settings.defaultMonthlyFee || 100);
  const [defaultAnnualFee, setDefaultAnnualFee] = useState(settings.defaultAnnualFee || 500);
  const [monthlyDuesDeadlineDay, setMonthlyDuesDeadlineDay] = useState(
    settings.monthlyDuesDeadlineDay || APP_ORG_CONFIG.monthlyDuesDeadlineDay || 10
  );

  // Logo URL
  const [logoUrl, setLogoUrl] = useState(
    settings.logoUrl || APP_ORG_CONFIG.logoUrl || '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Role Assignment state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('officer');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Audit search
  const [auditSearch, setAuditSearch] = useState('');

  // Auto-compose full address when sub-fields change
  const handleComposeAddress = (v = village, p = postcode, u = upazila, d = district) => {
    const full = `গ্রাম: ${v.trim()}, পোস্টকোড: ${p.trim()}, উপজেলা: ${u.trim()}, জেলা: ${d.trim()}`;
    setAddress(full);
  };

  const handleResetToDefaults = () => {
    setOrgNameBn(APP_ORG_CONFIG.orgNameBn);
    setOrgNameEn(APP_ORG_CONFIG.orgNameEn);
    setMottoBn(APP_ORG_CONFIG.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন');
    setEstablishedDateBn(APP_ORG_CONFIG.establishedDateBn || '৫ ই মে ২০২৬ খ্রি.');
    setEstablishedYear(APP_ORG_CONFIG.establishedYear || '২০২৬');
    setFinancialYear(APP_ORG_CONFIG.financialYear || '২০২৬-২০২৭');
    setVillage(APP_ORG_CONFIG.village);
    setPostcode(APP_ORG_CONFIG.postcode);
    setUpazila(APP_ORG_CONFIG.upazila);
    setDistrict(APP_ORG_CONFIG.district);
    setAddress(APP_ORG_CONFIG.address);
    setPhone(APP_ORG_CONFIG.phone);
    setEmail(APP_ORG_CONFIG.email);
    setWhatsappLink(APP_ORG_CONFIG.whatsappLink);
    setFacebookPageLink(APP_ORG_CONFIG.facebookPageLink);
    setDefaultMonthlyFee(APP_ORG_CONFIG.defaultMonthlyFee);
    setDefaultAnnualFee(APP_ORG_CONFIG.defaultAnnualFee);
    setMonthlyDuesDeadlineDay(APP_ORG_CONFIG.monthlyDuesDeadlineDay);
    setLogoUrl(APP_ORG_CONFIG.logoUrl || '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveError('');

      const updatedSettings: OrgSettings = {
        orgNameBn: orgNameBn.trim(),
        orgNameEn: orgNameEn.trim(),
        mottoBn: mottoBn.trim(),
        address: address.trim(),
        village: village.trim(),
        postcode: postcode.trim(),
        upazila: upazila.trim(),
        district: district.trim(),
        phone: phone.trim(),
        email: email.trim(),
        whatsappLink: whatsappLink.trim(),
        facebookPageLink: facebookPageLink.trim(),
        financialYear: financialYear.trim(),
        defaultMonthlyFee: Number(defaultMonthlyFee),
        defaultAnnualFee: Number(defaultAnnualFee),
        establishedYear: establishedYear.trim(),
        establishedDateBn: establishedDateBn.trim(),
        monthlyDuesDeadlineDay: Number(monthlyDuesDeadlineDay),
        logoUrl: logoUrl.trim(),
      };

      await saveSettings(updatedSettings, user?.email || 'admin');
      setSaveSuccess(true);
      onRefreshSettings(updatedSettings);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      setSaveError('সেটিংস সংরক্ষণে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim() || !targetName.trim()) {
      setAssignError('ইমেইল এবং নাম প্রদান করুন।');
      return;
    }

    try {
      setIsAssigning(true);
      setAssignError('');
      const fakeUid = `user_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await assignAdminRole({
        uid: fakeUid,
        email: targetEmail.trim().toLowerCase(),
        name: targetName.trim(),
        role: targetRole,
      });
      setAssignSuccess(true);
      setTargetEmail('');
      setTargetName('');
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setAssignError('দায়িত্ব অর্পণে ত্রুটি হয়েছে।');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredLogs = auditLogs
    .filter((log) => {
      return (
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.performedByEmail.toLowerCase().includes(auditSearch.toLowerCase())
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6 font-['Hind_Siliguri',sans-serif]">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            <span>সংগঠন সেটিংস ও প্রশাসনিক অডিট লগ (Settings & Audit)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            সংগঠনের নাম, স্লোগান, স্থাপিত তারিখ, অর্থবছর, ঠিকানা ও চাঁদার হার নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={handleResetToDefaults}
          className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition shrink-0"
          title="ডিফল্ট তথ্যে ফিরে যান"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>ডিফল্ট কনফিগ রিস্টোর</span>
        </button>
      </div>

      {/* Organization Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>সংগঠনের সাধারণ সেটিংস ও ঠিকানা সম্পাদনা</span>
          </h3>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full">
            সক্রিয় অর্থবছর: {financialYear}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>সংগঠনের সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে! পুরো অ্যাপ জুড়ে এই তথ্য প্রদর্শিত হচ্ছে।</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
          {/* Logo & Name Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src={logoUrl || '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg'}
                  alt="Organization Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-800">অফিসিয়াল গোল প্রতীক ও লোগো প্রিভিউ</h4>
                <p className="text-[11px] text-slate-500">
                  লোগো ফাইল পাথ: <code className="font-mono text-emerald-800 bg-white px-1 py-0.5 rounded border border-slate-200">{logoUrl}</code>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংগঠনের নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={orgNameBn}
                  onChange={(e) => setOrgNameBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংগঠনের নাম (ইংরেজিতে) *
                </label>
                <input
                  type="text"
                  required
                  value={orgNameEn}
                  onChange={(e) => setOrgNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মূলনীতি / স্লোগান (Motto)
                </label>
                <input
                  type="text"
                  value={mottoBn}
                  onChange={(e) => setMottoBn(e.target.value)}
                  placeholder="শিক্ষা, সেবা, একতা, উন্নয়ন"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  লোগো ইমেজ পাথ / URL
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Established Date, Year & Financial Year Section */}
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>প্রতিষ্ঠা ও অর্থবছর নির্ধারণ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  স্থাপিত পূর্ণাঙ্গ তারিখ (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={establishedDateBn}
                  onChange={(e) => setEstablishedDateBn(e.target.value)}
                  placeholder="৫ ই মে ২০২৬ খ্রি."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  স্থাপিত সাল (বছর) *
                </label>
                <input
                  type="text"
                  required
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="২০২৬"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  চলতি অর্থবছর *
                </label>
                <input
                  type="text"
                  required
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="২০২৬-২০২৭"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Structured Address Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>সংগঠনের ঠিকানা কাঠামো (Address Breakdown)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  গ্রাম (Village) *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => {
                    setVillage(e.target.value);
                    handleComposeAddress(e.target.value, postcode, upazila, district);
                  }}
                  placeholder="দুর্গাপুর, চন্ডিজান"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পোস্টকোড (Postcode) *
                </label>
                <input
                  type="text"
                  required
                  value={postcode}
                  onChange={(e) => {
                    setPostcode(e.target.value);
                    handleComposeAddress(village, e.target.value, upazila, district);
                  }}
                  placeholder="৫৬০০"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  উপজেলা (Upazila) *
                </label>
                <input
                  type="text"
                  required
                  value={upazila}
                  onChange={(e) => {
                    setUpazila(e.target.value);
                    handleComposeAddress(village, postcode, e.target.value, district);
                  }}
                  placeholder="উলিপুর"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  জেলা (District) *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    handleComposeAddress(village, postcode, upazila, e.target.value);
                  }}
                  placeholder="কুড়িগ্রাম"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                রশিদ ও আইডিকার্ডে মুদ্রিত পূর্ণাঙ্গ ঠিকানা
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Fees & Deadline Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ডিফল্ট মাসিক চাঁদা (৳) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={defaultMonthlyFee}
                onChange={(e) => setDefaultMonthlyFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ডিফল্ট বার্ষিক চাঁদা (৳) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={defaultAnnualFee}
                onChange={(e) => setDefaultAnnualFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                চাঁদা পরিশোধের শেষ দিন (তারিখ) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={28}
                value={monthlyDuesDeadlineDay}
                onChange={(e) => setMonthlyDuesDeadlineDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50/50 font-bold text-amber-900"
              />
              <span className="text-[10px] text-slate-500">প্রতি মাসের {toBengaliDigits(monthlyDuesDeadlineDay)} তারিখ নোটিফিকেশন শেষ দিন</span>
            </div>
          </div>

          {/* Phone & Email Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">যোগাযোগ মোবাইল নম্বর</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">অফিসিয়াল ইমেইল</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* WhatsApp & Facebook Community Links Section */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>সামাজিক যোগাযোগ ও অনলাইন কমিউনিটি লিংক</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  হোয়াটসঅ্যাপ গ্রুপ ইনভাইট লিংক (WhatsApp Group Link)
                </label>
                <input
                  type="url"
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500">ফুটার ও নোটিফিকেশনে সরাসরি লিংক প্রদর্শিত হবে</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ফেসবুক পেজ লিংক (Facebook Page Link)
                </label>
                <input
                  type="url"
                  value={facebookPageLink}
                  onChange={(e) => setFacebookPageLink(e.target.value)}
                  placeholder="https://facebook.com/... (তৈরি হলে এখানে দিন)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500">তৈরি না থাকলে ফাঁকা রাখুন, 'শীঘ্রই আসছে' দেখাবে</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন (Save Settings)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Role Assignment Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>নতুন কর্মকর্তা / অ্যাডমিন দায়িত্ব অর্পণ (Role Assignment)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          নির্বাহী কমিটির সদস্যদের পোর্টালে দায়িত্ব অর্পণ করুন (যেমন: সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ)
        </p>

        {assignSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>দায়িত্ব সফলভাবে অর্পণ করা হয়েছে!</span>
          </div>
        )}

        {assignError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
            {assignError}
          </div>
        )}

        <form onSubmit={handleAssignRole} className="space-y-3 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">কর্মকর্তার নাম *</label>
              <input
                type="text"
                required
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="নাম লিখুন"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
              <input
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="officer@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">দায়িত্ব / পদবী *</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              >
                <option value="president">সভাপতি (President)</option>
                <option value="general_secretary">সাধারণ সম্পাদক (General Secretary)</option>
                <option value="treasurer">কোষাধ্যক্ষ (Treasurer)</option>
                <option value="officer">কার্যনির্বাহী সদস্য / অফিসার</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isAssigning}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-xs transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isAssigning ? 'অর্পণ হচ্ছে...' : 'দায়িত্ব নিশ্চিত করুন'}</span>
            </button>
          </div>
        </form>
      </div>



      {/* Audit Log Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-700" />
              <span>প্রশাসনিক অডিট ট্রেইল (Immutable Audit Logs)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              সকল পেমেন্ট অনুমোদন, সেটিংস পরিবর্তন এবং সদস্য অন্তর্ভুক্তির স্বয়ংক্রিয় রেকর্ড
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="অডিট সার্চ..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-700">তারিখ ও সময়</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">অ্যাকশন</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">বিবরণ</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">সম্পাদনাকারী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('bn-BD', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2 font-semibold text-emerald-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{log.details}</td>
                  <td className="px-3 py-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.performedByEmail}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    কোন অডিট রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
