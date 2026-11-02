import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  CalendarDays,
  UserCheck,
  WalletCards,
  ReceiptText,
  FileSpreadsheet,
  Megaphone,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'members'
  | 'monthly'
  | 'annual'
  | 'my_account'
  | 'cashbook'
  | 'receipts'
  | 'reports'
  | 'announcements'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingRequestsCount = 0,
}) => {
  const { isAdmin, role } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'ড্যাশবোর্ড', icon: LayoutDashboard, adminOnly: false },
    { id: 'my_account' as NavTab, label: 'আমার হিসাব', icon: UserCheck, adminOnly: false },
    { id: 'members' as NavTab, label: 'সদস্য ব্যবস্থাপনা', icon: Users, adminOnly: true },
    { id: 'monthly' as NavTab, label: 'মাসিক চাঁদা', icon: CalendarCheck2, adminOnly: true },
    { id: 'annual' as NavTab, label: 'বার্ষিক চাঁদা', icon: CalendarDays, adminOnly: true },
    { id: 'cashbook' as NavTab, label: 'আয়-ব্যয় খাতা', icon: WalletCards, adminOnly: true },
    { id: 'receipts' as NavTab, label: 'মানি রশিদ', icon: ReceiptText, adminOnly: false },
    { id: 'reports' as NavTab, label: 'রিপোর্ট ও বিবরণী', icon: FileSpreadsheet, adminOnly: false },
    { id: 'announcements' as NavTab, label: 'বিজ্ঞপ্তি ফলক', icon: Megaphone, adminOnly: false },
    { id: 'settings' as NavTab, label: 'সেটিংস ও অডিট', icon: Settings, adminOnly: true },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-[calc(100vh-4rem)] sticky top-16 shadow-sm print:hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isAdmin ? 'অফিসিয়াল অ্যাডমিন প্যানেল' : 'সদস্য সেবা পোর্টাল'}</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) {
            return null;
          }
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border-r-4 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.id === 'my_account' && pendingRequestsCount > 0 && isAdmin && (
                <span className="bg-amber-500 text-emerald-950 text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500 text-center bg-slate-50">
        সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন <br />
        <span className="text-emerald-700 font-semibold">নিরাপদ ও স্বচ্ছ হিসাবায়ন</span>
      </div>
    </aside>
  );
};
