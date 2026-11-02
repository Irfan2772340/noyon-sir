import React from 'react';
import { useAuth } from '../context/AuthContext';
import { OrgSettings, UserRole } from '../types';
import { ROLE_LABELS_BN } from '../utils/bengali';
import {
  Building2,
  Shield,
  User,
  LogIn,
  LogOut,
  Bell,
  Sparkles,
  UserPlus,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  settings: OrgSettings;
  onOpenAnnouncements: () => void;
  unreadCount?: number;
  onOpenAuthModal: (mode: 'admin' | 'member') => void;
  onOpenAddMember?: () => void;
  onNavigateToMyAccount?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenAnnouncements,
  unreadCount = 0,
  onOpenAuthModal,
  onOpenAddMember,
  onNavigateToMyAccount,
}) => {
  const { user, role, isAdmin, isMember, linkedMember, logout, simulateRole } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900 print:hidden font-['Hind_Siliguri',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-11 h-11 rounded-full bg-white border-2 border-amber-400 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
              alt="SPWA Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate leading-tight text-white tracking-wide">
              {settings.orgNameBn}
            </h1>
            <p className="text-[11px] text-emerald-200 truncate hidden sm:block">
              {settings.orgNameEn} • {settings.mottoBn || 'শিক্ষা, সেবা, একতা, উন্নয়ন'}
            </p>
          </div>
        </div>

        {/* Right side actions & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PWA App Install Button */}
          <PWAInstallButton />

          {/* Notice Bell Button with 10th Tarik active pulse */}
          <div className="relative">
            <button
              onClick={onOpenAnnouncements}
              title="বিজ্ঞপ্তি ও ১০ তারিখ চাঁদা তাগিদ"
              className="relative p-2 rounded-full hover:bg-emerald-700 text-emerald-100 transition focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-emerald-800 animate-pulse" />
            </button>
          </div>

          {/* Quick Add Member button for Admin */}
          {isAdmin && onOpenAddMember && (
            <button
              onClick={onOpenAddMember}
              className="hidden md:inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition"
              title="নতুন সদস্য যুক্ত করুন"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন সদস্য যোগ</span>
            </button>
          )}

          {/* If Logged in as Admin */}
          {isAdmin ? (
            <div className="flex items-center space-x-2 bg-emerald-900/80 pl-2.5 pr-1.5 py-1 rounded-full border border-amber-400/40 shadow-xs">
              <div className="text-right hidden sm:block pr-1">
                <div className="text-xs font-bold text-amber-300 leading-none flex items-center justify-end space-x-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ROLE_LABELS_BN[role] || 'অ্যাডমিন'}</span>
                </div>
                <div className="text-[10px] text-emerald-100 font-medium truncate max-w-[130px]">
                  {user?.displayName || user?.email || 'ইরফান রাহাত'}
                </div>
              </div>

              {/* Mode switch button */}
              <button
                onClick={() => onOpenAuthModal('member')}
                title="সদস্য অ্যাকাউন্টে পরিবর্তন"
                className="hidden lg:inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-600"
              >
                সদস্য লগইন
              </button>

              <button
                onClick={logout}
                title="লগআউট"
                className="p-1.5 rounded-full hover:bg-emerald-800 text-rose-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isMember && linkedMember ? (
            /* If Logged in as Member with Linked Profile */
            <div className="flex items-center space-x-2 bg-emerald-900/80 pl-2.5 pr-1.5 py-1 rounded-full border border-emerald-600 shadow-xs">
              <div className="text-right hidden sm:block pr-1">
                <div className="text-xs font-bold text-white leading-none flex items-center justify-end space-x-1">
                  <User className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="truncate max-w-[120px]">{linkedMember.nameBn}</span>
                </div>
                <div className="text-[10px] text-amber-300 font-mono font-semibold">
                  আইডি: {linkedMember.memberId}
                </div>
              </div>

              {onNavigateToMyAccount && (
                <button
                  onClick={onNavigateToMyAccount}
                  className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded text-[11px] shadow-xs"
                >
                  আমার প্রোফাইল
                </button>
              )}

              <button
                onClick={() => onOpenAuthModal('admin')}
                title="অ্যাডমিন প্যানেলে লগইন"
                className="hidden lg:inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-800 hover:bg-emerald-700 text-amber-300 border border-amber-400/30"
              >
                অ্যাডমিন লগইন
              </button>

              <button
                onClick={logout}
                title="লগআউট"
                className="p-1.5 rounded-full hover:bg-emerald-800 text-rose-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Logged Out / Guest state - Prominent Admin & Member options */
            <div className="flex items-center space-x-2">
              {/* Member Login / Register Button */}
              <button
                onClick={() => onOpenAuthModal('member')}
                className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition border border-emerald-600"
              >
                <User className="w-4 h-4 text-emerald-200" />
                <span>সদস্য লগইন / নিবন্ধন</span>
              </button>

              {/* Admin Login Button */}
              <button
                onClick={() => onOpenAuthModal('admin')}
                className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
              >
                <Shield className="w-4 h-4 text-emerald-950" />
                <span>অ্যাডমিন লগইন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

