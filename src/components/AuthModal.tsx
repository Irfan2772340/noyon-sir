import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member } from '../types';
import {
  Shield,
  User,
  KeyRound,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { processImageFileToDataUrl } from '../utils/imageUpload';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialMode?: 'admin' | 'member';
  onLoginSuccess?: (role: 'admin' | 'member') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  members,
  initialMode = 'member',
  onLoginSuccess,
}) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerMemberAccount,
    loginAsDemoAdmin,
    loginAsDemoMember,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'member'>(initialMode);
  const [memberSubTab, setMemberSubTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('সরকারপাড়া');
  const [regEmergency, setRegEmergency] = useState('');
  const [regPhotoUrl, setRegPhotoUrl] = useState<string>('');
  const [photoProcessing, setPhotoProcessing] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoProcessing(true);
      setErrorMsg('');
      const dataUrl = await processImageFileToDataUrl(file, 400, 0.85);
      setRegPhotoUrl(dataUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে। অন্য ছবি চেষ্টা করুন।');
    } finally {
      setPhotoProcessing(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }
    try {
      setLoading(true);
      await loginWithEmail(email, password, 'admin');
      setSuccessMsg('অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে!');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('admin');
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message?.includes('auth/invalid-credential') || err.message?.includes('user-not-found')
          ? 'ভুল ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'লগইন ব্যর্থ হয়েছে। ডেমো অ্যাডমিন বাটন দিয়ে সহজে প্রবেশ করতে পারেন।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMemberEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }
    try {
      setLoading(true);
      await loginWithEmail(email, password, 'member');
      setSuccessMsg('সদস্য হিসেবে সফলভাবে লগইন হয়েছে!');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('member');
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message?.includes('auth/invalid-credential') || err.message?.includes('user-not-found')
          ? 'ভুল ইমেইল অথবা পাসওয়ার্ড। আপনার অ্যাকাউন্ট না থাকলে নিবন্ধন করুন।'
          : 'লগইন করতে সমস্যা হচ্ছে। নিচে বিদ্যমান সদস্যদের তালিকায় ক্লিক করে সরাসরি প্রোফাইলে প্রবেশ করতে পারেন।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMemberRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('অনুগ্রহ করে নাম, মোবাইল নম্বর, ইমেইল এবং পাসওয়ার্ড পূরণ করুন।');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    try {
      setLoading(true);
      const newMember = await registerMemberAccount({
        nameBn: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        address: regAddress,
        emergencyContact: regEmergency,
        photoUrl: regPhotoUrl || undefined,
        existingMemberIds: members.map((m) => m.memberId),
      });

      setSuccessMsg(`অভিনন্দন! আপনার নতুন সদস্য আইডি: ${newMember.memberId}। আপনার প্রোফাইলে নিয়ে যাওয়া হচ্ছে...`);
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess('member');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('email-already-in-use')) {
        setErrorMsg('এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে লগইন করুন।');
      } else {
        setErrorMsg('নিবন্ধন সম্পন্ন করতে সমস্যা হয়েছে: ' + (err.message || 'অনুগ্রহ করে আবার চেষ্টা করুন'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (roleType: 'admin' | 'member') => {
    setErrorMsg('');
    try {
      setLoading(true);
      await loginWithGoogle(roleType);
      setSuccessMsg('গুগল দিয়ে সফলভাবে লগইন হয়েছে!');
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess(roleType);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    loginAsDemoAdmin('super_admin');
    onClose();
    if (onLoginSuccess) onLoginSuccess('admin');
  };

  const handleQuickDemoMember = (member: Member) => {
    loginAsDemoMember(member);
    onClose();
    if (onLoginSuccess) onLoginSuccess('member');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto font-['Hind_Siliguri',sans-serif]">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('member');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition border-b-2 ${
              activeTab === 'member'
                ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>সদস্য লগইন / নিবন্ধন</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition border-b-2 ${
              activeTab === 'admin'
                ? 'border-amber-500 bg-white text-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>অ্যাডমিন লগইন</span>
          </button>

          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 transition"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {/* Official Emblem & Branding */}
          <div className="flex items-center space-x-3 pb-3 mb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
                alt="SPWA Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA)
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium">
                শিক্ষা, সেবা, একতা, উন্নয়ন • উলিপুর, কুড়িগ্রাম
              </p>
            </div>
          </div>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= ADMIN TAB ================= */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                <div className="font-bold flex items-center space-x-1.5 text-amber-950 mb-1">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>অ্যাডমিন ব্যবস্থাপনা ক্ষমতা:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900/90 pl-1">
                  <li>নতুন সদস্য যোগ (Add Member) ও তথ্য সম্পাদনা (Edit Member)</li>
                  <li>মাসিক ও বার্ষিক চাঁদা আদায় এবং মানি রশিদ ইস্যু</li>
                  <li>আয়-ব্যয় ক্যাশবুক ও ব্যাংকিং হিসাব নিয়ন্ত্রণ</li>
                  <li>বিজ্ঞপ্তি ফলক প্রকাশ ও সংগঠনের সেটিংস পরিবর্তন</li>
                </ul>
              </div>

              {/* Admin Email/Password Form */}
              <form onSubmit={handleAdminEmailLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অ্যাডমিন ইমেইল</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="admin@sarkarpara.org বা আপনার ইমেইল"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পাসওয়ার্ড</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'লগইন হচ্ছে...' : 'অ্যাডমিন হিসেবে প্রবেশ করুন'}</span>
                </button>
              </form>

              <div className="relative my-3 flex items-center justify-center">
                <hr className="w-full border-slate-200" />
                <span className="absolute bg-white px-2 text-[11px] text-slate-400">অথবা দ্রুত প্রবেশ</span>
              </div>

              {/* Instant One-Click Demo Admin Button */}
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-emerald-950" />
                <span>সুপার অ্যাডমিন ডেমো প্রবেশ (ইরফান রাহাত - পূর্ণ নিয়ন্ত্রণ)</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('admin')}
                disabled={loading}
                className="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-2"
              >
                <span>গুগল অ্যাকাউন্ট দিয়ে অ্যাডমিন লগইন</span>
              </button>
            </div>
          )}

          {/* ================= MEMBER TAB ================= */}
          {activeTab === 'member' && (
            <div className="space-y-4">
              {/* Member Sub-tabs: Login vs Register */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMemberSubTab('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                    memberSubTab === 'login'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সদস্য লগইন (Member Login)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberSubTab('register');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                    memberSubTab === 'register'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  নতুন সদস্য নিবন্ধন (Register)
                </button>
              </div>

              {/* MEMBER LOGIN FORM */}
              {memberSubTab === 'login' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                    <p className="font-semibold text-emerald-950">
                      সদস্য হিসেবে লগইন করে আপনি যা দেখতে পারবেন:
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      আপনার ব্যক্তিগত প্রোফাইল, স্মার্ট আইডি কার্ড, কিউআর ভেরিফিকেশন, চাঁদার বকেয়া ও পরিশোধের হিসাব, মানি রশিদ এবং জমা রিকোয়েস্ট।
                    </p>
                  </div>

                  <form onSubmit={handleMemberEmailLogin} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          placeholder="আপনার ইমেইল"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">পাসওয়ার্ড</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{loading ? 'লগইন হচ্ছে...' : 'লগইন করুন ও প্রোফাইল দেখুন'}</span>
                    </button>
                  </form>

                  <div className="relative my-3 flex items-center justify-center">
                    <hr className="w-full border-slate-200" />
                    <span className="absolute bg-white px-2 text-[11px] text-slate-400">
                      অথবা বিদ্যমান সদস্য হিসেবে দ্রুত প্রবেশ
                    </span>
                  </div>

                  {/* Quick Member Switcher Cards for instantaneous inspection */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      সদস্য বাছাই করে তাৎক্ষণিক প্রোফাইল দেখুন:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                      {members.slice(0, 6).map((m) => (
                        <button
                          key={m.memberId}
                          type="button"
                          onClick={() => handleQuickDemoMember(m)}
                          className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                              {m.nameBn}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              আইডি: <span className="font-mono">{m.memberId}</span> • {m.position}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('member')}
                    disabled={loading}
                    className="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-2"
                  >
                    <span>গুগল অ্যাকাউন্ট দিয়ে সদস্য লগইন</span>
                  </button>
                </div>
              )}

              {/* MEMBER SELF REGISTRATION FORM */}
              {memberSubTab === 'register' && (
                <form onSubmit={handleMemberRegistration} className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                    সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশনে যোগ দিতে নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন। নিবন্ধন সম্পন্ন হলে আপনি সরাসরি আপনার ব্যক্তিগত সদস্য প্রোফাইলে যেতে পারবেন।
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        পুরো নাম (বাংলায়) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: মোহাম্মদ শফিকুল ইসলাম"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="০১৭১২-৩৪৫৬৭৮"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ইমেইল ঠিকানা *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        গোপন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ঠিকানা / পাড়া
                      </label>
                      <input
                        type="text"
                        placeholder="সরকারপাড়া, সদর"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        জরুরি যোগাযোগ নম্বর (ঐচ্ছিক)
                      </label>
                      <input
                        type="tel"
                        placeholder="পিতা/ভাই/অভিভাবক"
                        value={regEmergency}
                        onChange={(e) => setRegEmergency(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Member Photo Upload */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
                    <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                      সদস্যের ছবি (ঐচ্ছিক - আইডি কার্ড ও প্রোফাইলের জন্য)
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="relative w-14 h-14 rounded-xl border-2 border-dashed border-emerald-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {regPhotoUrl ? (
                          <img
                            src={regPhotoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-6 h-6 text-emerald-400" />
                        )}
                        {photoProcessing && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-emerald-700 animate-pulse">প্রসেস...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold shadow-2xs transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{regPhotoUrl ? 'ছবি পরিবর্তন' : 'ছবি নির্বাচন করুন'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handlePhotoUpload}
                              disabled={photoProcessing}
                            />
                          </label>

                          {regPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setRegPhotoUrl('')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>মুছুন</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          জেপিজি বা পিএনজি ছবি দিন (স্বয়ংক্রিয়ভাবে রিসাইজ ও অপ্টিমাইজ হবে)
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || photoProcessing}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {loading ? 'নিবন্ধন করা হচ্ছে...' : 'সদস্য হিসেবে নিবন্ধন সম্পন্ন করুন'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন • ডিজিটাল ব্যবস্থাপনা ও নিরাপত্তা
        </div>
      </div>
    </div>
  );
};
