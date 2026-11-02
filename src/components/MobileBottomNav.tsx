import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Sidebar';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  WalletCards,
  Menu,
  X,
  CalendarDays,
  ReceiptText,
  FileSpreadsheet,
  Megaphone,
  Settings,
  UserCheck,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { isAdmin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'হোম', icon: LayoutDashboard },
    { id: 'my_account', label: 'আমার হিসাব', icon: UserCheck },
    ...(isAdmin
      ? ([
          { id: 'members', label: 'সদস্য', icon: Users },
          { id: 'monthly', label: 'চাঁদা', icon: CalendarCheck2 },
          { id: 'cashbook', label: 'ক্যাশ বুক', icon: WalletCards },
        ] as const)
      : ([
          { id: 'receipts', label: 'রশিদ', icon: ReceiptText },
          { id: 'announcements', label: 'বিজ্ঞপ্তি', icon: Megaphone },
        ] as const)),
  ];

  const moreTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly: boolean }[] = [
    { id: 'annual', label: 'বার্ষিক চাঁদা', icon: CalendarDays, adminOnly: true },
    { id: 'receipts', label: 'মানি রশিদ', icon: ReceiptText, adminOnly: false },
    { id: 'reports', label: 'রিপোর্ট ও বিবরণী', icon: FileSpreadsheet, adminOnly: false },
    { id: 'announcements', label: 'বিজ্ঞপ্তি ফলক', icon: Megaphone, adminOnly: false },
    { id: 'settings', label: 'সেটিংস ও অডিট লগ', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Drawer Modal for "More" */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 shadow-xl border-t border-slate-200 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">সকল অপশন ও মেনু</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 py-4">
              {moreTabs.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-sm font-medium transition ${
                      activeTab === item.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-700" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar for Android and Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around print:hidden">
        {primaryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                setDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs transition ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs transition ${
            drawerOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-1 rounded-full">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 leading-none">মেনু</span>
        </button>
      </nav>
    </>
  );
};
