import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member, MonthlyDue, OrgSettings } from '../types';
import {
  get10thTarikNotificationStatus,
  getMemberMonthlyDueStatus,
  generateMemberReminderSMS,
} from '../utils/paymentNotification';
import { toBengaliDigits, BENGALI_MONTHS } from '../utils/bengali';
import {
  Bell,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  X,
  CreditCard,
  Send,
  Sparkles,
} from 'lucide-react';

interface MonthlyPaymentNotificationBannerProps {
  members: Member[];
  monthlyDues: MonthlyDue[];
  settings: OrgSettings;
  onNavigateToMonthlyDues?: () => void;
  onNavigateToMyAccount?: () => void;
}

export const MonthlyPaymentNotificationBanner: React.FC<
  MonthlyPaymentNotificationBannerProps
> = ({
  members,
  monthlyDues,
  settings,
  onNavigateToMonthlyDues,
  onNavigateToMyAccount,
}) => {
  const { user, isAdmin, isMember, linkedMember } = useAuth();

  const realToday = new Date();
  const realDay = realToday.getDate();
  const currentMonth = realToday.getMonth() + 1;
  const currentYear = realToday.getFullYear();
  const currentMonthName =
    BENGALI_MONTHS.find((m) => m.id === currentMonth)?.name || 'চলতি মাস';

  // Simulated day state for instant previewing & testing on any day
  const [simulatedDay, setSimulatedDay] = useState<number>(realDay);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [copiedSMS, setCopiedSMS] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  const notif = get10thTarikNotificationStatus(simulatedDay);

  // Statistics for this month
  const thisMonthDues = monthlyDues.filter(
    (d) => d.year === currentYear && d.month === currentMonth
  );
  const paidCount = thisMonthDues.filter((d) => d.status === 'paid').length;
  const totalActive = members.filter((m) => m.status === 'active').length;
  const unpaidCount = Math.max(0, totalActive - paidCount);

  // Member-specific due check if logged in as a member
  const memberDueStatus = linkedMember
    ? getMemberMonthlyDueStatus(
        linkedMember.memberId,
        monthlyDues,
        currentYear,
        currentMonth,
        settings.defaultMonthlyFee || 100
      )
    : null;

  // Handle batch copy of SMS reminders for all unpaid members
  const handleCopyUnpaidReminders = () => {
    const unpaidMembers = members.filter((m) => {
      const status = getMemberMonthlyDueStatus(
        m.memberId,
        monthlyDues,
        currentYear,
        currentMonth,
        settings.defaultMonthlyFee || 100
      );
      return !status.isPaid && m.status === 'active';
    });

    const messages = unpaidMembers.map((m) =>
      generateMemberReminderSMS(
        m.nameBn,
        m.memberId,
        currentMonthName,
        settings.defaultMonthlyFee || 100
      )
    );

    const fullText = messages.join('\n---\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedSMS(true);
      setTimeout(() => setCopiedSMS(false), 3000);
    });
  };

  if (isDismissed) {
    return (
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1 rounded-full font-semibold inline-flex items-center space-x-1.5 transition"
        >
          <Bell className="w-3.5 h-3.5 text-emerald-700" />
          <span>১০ তারিখের মাসিক চাঁদা নোটিফিকেশন প্রদর্শন</span>
        </button>
      </div>
    );
  }

  // Theme styling based on urgency
  const themeClasses =
    notif.urgency === 'critical'
      ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-700 text-white border-amber-300 shadow-md ring-2 ring-amber-400/50'
      : notif.urgency === 'warning'
      ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-orange-900 text-white border-amber-500 shadow-sm'
      : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white border-emerald-600 shadow-sm';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 mb-5 border transition relative overflow-hidden font-['Hind_Siliguri',sans-serif] ${themeClasses}`}
    >
      {/* Background Accent Emblem Watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none w-48 h-48 rounded-full overflow-hidden">
        <img
          src="/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Info */}
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs shrink-0 mt-0.5 border border-white/20">
              {notif.urgency === 'critical' ? (
                <AlertTriangle className="w-6 h-6 text-amber-200 animate-bounce" />
              ) : notif.urgency === 'warning' ? (
                <Clock className="w-6 h-6 text-amber-300" />
              ) : (
                <Calendar className="w-6 h-6 text-emerald-200" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/30 text-amber-200">
                  {notif.badgeBn}
                </span>
                <span className="text-xs text-white/90 font-medium">
                  মাস: <strong className="text-amber-200">{currentMonthName} {toBengaliDigits(currentYear)}</strong>
                </span>
                <span className="text-xs text-white/75">• প্রতি মাসের ১০ তারিখের নিয়ম</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                {notif.titleBn}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
                {notif.descriptionBn}
              </p>

              {/* Logged in member's personalized status */}
              {isMember && linkedMember && memberDueStatus && (
                <div className="mt-2.5 inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-black/25 backdrop-blur-xs border border-white/20 text-xs">
                  {memberDueStatus.isPaid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span className="text-emerald-200 font-medium">
                        {linkedMember.nameBn}, আপনার চলতি {currentMonthName} মাসের চাঁদা পরিশোধিত হয়েছে। ধন্যবাদ!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="text-amber-200 font-medium">
                        {linkedMember.nameBn}, আপনার চলতি {currentMonthName} মাসের চাঁদা ৳{toBengaliDigits(memberDueStatus.remainingDue)} বকেয়া রয়েছে।
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Admin overview stats */}
              {isAdmin && (
                <div className="mt-2 text-xs text-white/85 flex flex-wrap items-center gap-3">
                  <span>
                    আদায় অগ্রগতি: <strong className="text-amber-300">{toBengaliDigits(paidCount)}/{toBengaliDigits(totalActive)}</strong> জন পরিশোধিত
                  </span>
                  <span>•</span>
                  <span>
                    বকেয়া সদস্য: <strong className="text-rose-200 font-bold">{toBengaliDigits(unpaidCount)} জন</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 md:pt-0 shrink-0">
            {/* If Member and due is pending, show pay button */}
            {isMember && (!memberDueStatus || !memberDueStatus.isPaid) && onNavigateToMyAccount && (
              <button
                onClick={onNavigateToMyAccount}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition transform active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>এখনই চাঁদা জমা দিন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* If Admin, show Quick Copy SMS & View Dues */}
            {isAdmin && (
              <>
                <button
                  onClick={handleCopyUnpaidReminders}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 transition shadow-xs"
                  title="বকেয়া সকল সদস্যদের জন্য ১০ তারিখ তাগিদপত্র SMS কপি করুন"
                >
                  {copiedSMS ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSMS ? 'SMS কপি হয়েছে!' : 'বকেয়া SMS কপি'}</span>
                </button>

                {onNavigateToMonthlyDues && (
                  <button
                    onClick={onNavigateToMonthlyDues}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs transition shadow-xs"
                  >
                    <span>চাঁদা রেজিস্টার</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            {/* Date Simulator Toggle Button */}
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="px-2.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white/90 text-xs font-medium border border-white/20 transition"
              title="১০ তারিখ নোটিফিকেশন টেস্ট ও সিমুলেটর"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-300" />
              <span>তারিখ টেস্ট</span>
            </button>

            {/* Dismiss Button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-xl hover:bg-black/20 text-white/80 hover:text-white transition"
              title="লুকান"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Simulator Bar (Instant Testing for 10th Date behavior) */}
        {showSimulator && (
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-amber-200">সিমুলেটর টেস্ট:</span>
              <span className="text-white/80">যেকোনো তারিখ নির্বাচন করে নোটিফিকেশন পরখ করুন:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSimulatedDay(realDay)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  simulatedDay === realDay
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                আজকের দিন ({toBengaliDigits(realDay)} তারিখ)
              </button>
              <button
                onClick={() => setSimulatedDay(10)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  simulatedDay === 10
                    ? 'bg-amber-400 text-emerald-950 shadow-md ring-2 ring-white'
                    : 'bg-white/10 hover:bg-white/20 text-amber-200'
                }`}
              >
                🔥 ১০ তারিখ (শেষ দিন!)
              </button>
              <button
                onClick={() => setSimulatedDay(5)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  simulatedDay === 5
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                ৫ তারিখ (৫ দিন বাকি)
              </button>
              <button
                onClick={() => setSimulatedDay(15)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  simulatedDay === 15
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                ১৫ তারিখ (বকেয়া ৫ দিন)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
