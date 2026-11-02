import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType, testConnection } from './firebase';
import {
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Member,
  MonthlyDue,
  AnnualDue,
  Transaction,
  Receipt,
  Announcement,
  AuditLog,
  OrgSettings,
  PaymentRequest,
} from './types';
import {
  INITIAL_ORG_SETTINGS,
  INITIAL_MEMBERS,
  INITIAL_MONTHLY_DUES,
  INITIAL_ANNUAL_DUES,
  INITIAL_TRANSACTIONS,
  INITIAL_RECEIPTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
} from './services/initialData';
import { checkAndSeedInitialData } from './services/seedData';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MonthlyPaymentNotificationBanner } from './components/MonthlyPaymentNotificationBanner';
import { ReceiptModal } from './components/ReceiptModal';
import { MemberCardModal } from './components/MemberCardModal';
import { MemberQRModal } from './components/MemberQRModal';
import { MemberStatementModal } from './components/MemberStatementModal';
import { Footer } from './components/Footer';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { PublicVerificationView } from './views/PublicVerificationView';
import { DashboardView } from './views/DashboardView';
import { MembersView } from './views/MembersView';
import { MonthlyDuesView } from './views/MonthlyDuesView';
import { AnnualDuesView } from './views/AnnualDuesView';
import { PersonalMemberView } from './views/PersonalMemberView';
import { CashBookView } from './views/CashBookView';
import { ReceiptsView } from './views/ReceiptsView';
import { ReportsView } from './views/ReportsView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { SettingsView } from './views/SettingsView';
import { getInitialStoredSettings } from './config/orgConfig';

function AppContent() {
  const { user, isAdmin, role, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<OrgSettings>(() => getInitialStoredSettings());
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [monthlyDues, setMonthlyDues] = useState<MonthlyDue[]>(INITIAL_MONTHLY_DUES);
  const [annualDues, setAnnualDues] = useState<AnnualDue[]>(INITIAL_ANNUAL_DUES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [receipts, setReceipts] = useState<Receipt[]>(INITIAL_RECEIPTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'admin' | 'member'>('member');
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);

  // Active Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [selectedQRMember, setSelectedQRMember] = useState<Member | null>(null);
  const [selectedStatementMember, setSelectedStatementMember] = useState<Member | null>(null);
  const [selectedMemberForPay, setSelectedMemberForPay] = useState<Member | null>(null);
  const [openAddTransactionModal, setOpenAddTransactionModal] = useState(false);

  // Public Member QR Verification URL support (?verify=MEM-XXXX)
  const [verificationMemberId, setVerificationMemberId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('verify');
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setVerificationMemberId(params.get('verify'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial connection test
  useEffect(() => {
    testConnection().catch((err) => console.warn('Test connection notice:', err));
  }, []);

  // Public Real-time Listeners (Settings & Announcements)
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as OrgSettings);
        }
      },
      (err) => console.warn('Settings public sync notice:', err.message)
    );

    const unsubAnn = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        if (!snap.empty) {
          const list: Announcement[] = [];
          snap.forEach((d) => list.push(d.data() as Announcement));
          setAnnouncements(list);
        }
      },
      (err) => console.warn('Announcements public sync notice:', err.message)
    );

    return () => {
      unsubSettings();
      unsubAnn();
    };
  }, []);

  // Authenticated Real-time Listeners
  useEffect(() => {
    if (!user) {
      // User is not signed in; keep initialized state
      return;
    }

    // Seed initial data to Cloud Firestore if needed
    checkAndSeedInitialData().catch((e) => console.error(e));

    // Members listener
    const unsubMembers = onSnapshot(
      collection(db, 'members'),
      (snap) => {
        if (!snap.empty) {
          const list: Member[] = [];
          snap.forEach((d) => list.push(d.data() as Member));
          setMembers(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'members')
    );

    // Monthly Dues listener
    const unsubMonthly = onSnapshot(
      collection(db, 'monthly_dues'),
      (snap) => {
        if (!snap.empty) {
          const list: MonthlyDue[] = [];
          snap.forEach((d) => list.push(d.data() as MonthlyDue));
          setMonthlyDues(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'monthly_dues')
    );

    // Annual Dues listener
    const unsubAnnual = onSnapshot(
      collection(db, 'annual_dues'),
      (snap) => {
        if (!snap.empty) {
          const list: AnnualDue[] = [];
          snap.forEach((d) => list.push(d.data() as AnnualDue));
          setAnnualDues(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'annual_dues')
    );

    // Transactions listener
    const unsubTxns = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        if (!snap.empty) {
          const list: Transaction[] = [];
          snap.forEach((d) => list.push(d.data() as Transaction));
          setTransactions(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'transactions')
    );

    // Receipts listener
    const unsubReceipts = onSnapshot(
      collection(db, 'receipts'),
      (snap) => {
        if (!snap.empty) {
          const list: Receipt[] = [];
          snap.forEach((d) => list.push(d.data() as Receipt));
          setReceipts(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'receipts')
    );

    // Payment Requests listener
    const unsubReqs = onSnapshot(
      collection(db, 'payment_requests'),
      (snap) => {
        const list: PaymentRequest[] = [];
        snap.forEach((d) => list.push(d.data() as PaymentRequest));
        setPaymentRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'payment_requests')
    );

    // Audit logs listener
    const unsubAudit = onSnapshot(
      collection(db, 'audit_logs'),
      (snap) => {
        if (!snap.empty) {
          const list: AuditLog[] = [];
          snap.forEach((d) => list.push(d.data() as AuditLog));
          setAuditLogs(list);
        }
      },
      (err) => console.warn('Audit logs access:', err.message)
    );

    return () => {
      unsubMembers();
      unsubMonthly();
      unsubAnnual();
      unsubTxns();
      unsubReceipts();
      unsubReqs();
      unsubAudit();
    };
  }, [user]);

  const pendingRequestsCount = paymentRequests.filter((p) => p.status === 'pending').length;

  // Render Public Verification Page if ?verify=MEM-XXXX is active
  if (verificationMemberId) {
    return (
      <PublicVerificationView
        memberId={verificationMemberId}
        onBackToApp={() => {
          window.history.pushState({}, '', window.location.pathname);
          setVerificationMemberId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Hind_Siliguri',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onOpenAnnouncements={() => setActiveTab('announcements')}
        unreadCount={announcements.length}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenAddMember={() => setActiveTab('members')}
        onNavigateToMyAccount={() => setActiveTab('my_account')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop & Tablet Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24 md:pb-8 min-w-0">
          {/* Active 10th-date Monthly Dues Auto-Notification Alert */}
          <MonthlyPaymentNotificationBanner
            members={members}
            monthlyDues={monthlyDues}
            settings={settings}
            onNavigateToMonthlyDues={() => setActiveTab('monthly')}
            onNavigateToMyAccount={() => setActiveTab('my_account')}
          />

          {activeTab === 'dashboard' && (
            <DashboardView
              members={members}
              monthlyDues={monthlyDues}
              annualDues={annualDues}
              transactions={transactions}
              receipts={receipts}
              announcements={announcements}
              settings={settings}
              onNavigate={setActiveTab}
              onOpenQuickPayment={() => setActiveTab('monthly')}
              onOpenAddMember={() => setActiveTab('members')}
              onOpenAddTransaction={() => {
                setActiveTab('cashbook');
                setOpenAddTransactionModal(true);
              }}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              onSelectMemberCard={setSelectedCardMember}
              onSelectMemberQR={setSelectedQRMember}
              onSelectMemberStatement={setSelectedStatementMember}
              onSelectPayDues={(m) => {
                setSelectedMemberForPay(m);
                setActiveTab('monthly');
              }}
              onMembersChange={setMembers}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyDuesView
              members={members}
              monthlyDues={monthlyDues}
              settings={settings}
              onOpenReceipt={setSelectedReceipt}
              selectedMemberForPay={selectedMemberForPay}
              onClearSelectedMemberForPay={() => setSelectedMemberForPay(null)}
              onPaymentSuccess={(dueId, paidAmount, receipt) => {
                setMonthlyDues((prev) =>
                  prev.map((d) => {
                    if (d.id === dueId) {
                      const totalPaid = (d.amountPaid || 0) + paidAmount;
                      return {
                        ...d,
                        amountPaid: totalPaid,
                        status: totalPaid >= d.amountDue ? 'paid' : 'partial',
                        paymentDate: receipt.date,
                        receiptNumber: receipt.receiptNumber,
                      };
                    }
                    return d;
                  })
                );
                setReceipts((prev) => [receipt, ...prev]);
                const newTxn: Transaction = {
                  id: `TXN-INC-${Date.now()}`,
                  transactionId: `TXN-INC-${Date.now()}`,
                  date: receipt.date,
                  type: 'income',
                  category: 'সদস্য মাসিক চাঁদা',
                  amount: paidAmount,
                  description: `${receipt.memberNameBn} (${receipt.memberId}) - ${receipt.period}-এর চাঁদা`,
                  paymentMethod: receipt.paymentMethod,
                  receiptNumber: receipt.receiptNumber,
                  memberId: receipt.memberId,
                  recordedBy: 'admin',
                  recordedByName: receipt.recorderName,
                  createdAt: new Date().toISOString(),
                };
                setTransactions((prev) => [newTxn, ...prev]);
              }}
            />
          )}

          {activeTab === 'annual' && (
            <AnnualDuesView
              members={members}
              annualDues={annualDues}
              settings={settings}
              onOpenReceipt={setSelectedReceipt}
            />
          )}

          {activeTab === 'my_account' && (
            <PersonalMemberView
              members={members}
              monthlyDues={monthlyDues}
              annualDues={annualDues}
              receipts={receipts}
              paymentRequests={paymentRequests}
              settings={settings}
              onOpenReceipt={setSelectedReceipt}
              onOpenStatement={setSelectedStatementMember}
              onOpenCard={setSelectedCardMember}
              onOpenQR={setSelectedQRMember}
            />
          )}

          {activeTab === 'cashbook' && (
            <CashBookView
              transactions={transactions}
              onOpenAddTransactionModal={openAddTransactionModal}
              onCloseAddTransactionModal={() => setOpenAddTransactionModal(false)}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsView
              receipts={receipts}
              settings={settings}
              onOpenReceipt={setSelectedReceipt}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              members={members}
              monthlyDues={monthlyDues}
              annualDues={annualDues}
              transactions={transactions}
              receipts={receipts}
              settings={settings}
              onOpenStatement={setSelectedStatementMember}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsView announcements={announcements} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              auditLogs={auditLogs}
              onRefreshSettings={(updated) => {
                if (updated) {
                  setSettings(updated);
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Institutional Footer with Developer Credits, WhatsApp & Privacy Policy */}
      <Footer
        settings={settings}
        onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
      />

      {/* Mobile Bottom Navigation for Android & Handhelds */}
      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Reusable Print Modals */}
      <ReceiptModal
        receipt={selectedReceipt}
        settings={settings}
        onClose={() => setSelectedReceipt(null)}
      />

      <MemberCardModal
        member={selectedCardMember}
        settings={settings}
        onClose={() => setSelectedCardMember(null)}
        onOpenQRModal={(m) => {
          setSelectedCardMember(null);
          setSelectedQRMember(m);
        }}
      />

      <MemberQRModal
        member={selectedQRMember}
        settings={settings}
        onClose={() => setSelectedQRMember(null)}
        onOpenPublicVerification={(id) => {
          setSelectedQRMember(null);
          setVerificationMemberId(id);
          window.history.pushState({}, '', `?verify=${encodeURIComponent(id)}`);
        }}
      />

      <MemberStatementModal
        member={selectedStatementMember}
        monthlyDues={monthlyDues}
        annualDues={annualDues}
        receipts={receipts}
        settings={settings}
        onClose={() => setSelectedStatementMember(null)}
      />

      {/* Institutional Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={privacyPolicyOpen}
        onClose={() => setPrivacyPolicyOpen(false)}
        settings={settings}
      />

      {/* Admin vs Member Authentication & Registration Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        members={members}
        initialMode={authModalMode}
        onLoginSuccess={(loggedRole) => {
          if (loggedRole === 'member') {
            setActiveTab('my_account');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
