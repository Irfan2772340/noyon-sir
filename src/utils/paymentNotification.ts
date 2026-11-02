import { MonthlyDue, PaymentStatus } from '../types';
import { toBengaliDigits } from './bengali';

export type NotificationUrgency = 'info' | 'critical' | 'warning';
export type PaymentDeadlineState = 'upcoming' | 'due_today' | 'overdue';

export interface PaymentNotificationInfo {
  state: PaymentDeadlineState;
  dayOfMonth: number;
  deadlineDay: number;
  daysRemaining: number;
  daysPassed: number;
  titleBn: string;
  headlineBn: string;
  descriptionBn: string;
  badgeBn: string;
  urgency: NotificationUrgency;
  isToday10th: boolean;
}

/**
 * Calculates notification details for monthly dues based on the 10th-date payment deadline.
 * @param dayOfMonth Current day of month (1-31), defaults to today
 */
export function get10thTarikNotificationStatus(
  dayOfMonth: number = new Date().getDate()
): PaymentNotificationInfo {
  const deadlineDay = 10;
  const isToday10th = dayOfMonth === deadlineDay;

  if (dayOfMonth < deadlineDay) {
    const daysRemaining = deadlineDay - dayOfMonth;
    return {
      state: 'upcoming',
      dayOfMonth,
      deadlineDay,
      daysRemaining,
      daysPassed: 0,
      titleBn: 'চলতি মাসের চাঁদা আদায়ের সময় চলছে',
      headlineBn: 'প্রতি মাসের ১০ তারিখের মধ্যে চাঁদা পরিশোধ করুন',
      descriptionBn: `১০ তারিখের আর ${toBengaliDigits(daysRemaining)} দিন বাকি। বকেয়া এড়াতে নির্ধারিত সময়ের মধ্যে আপনার মাসিক চাঁদা জমা দিন।`,
      badgeBn: `${toBengaliDigits(daysRemaining)} দিন বাকি`,
      urgency: 'info',
      isToday10th: false,
    };
  }

  if (dayOfMonth === deadlineDay) {
    return {
      state: 'due_today',
      dayOfMonth,
      deadlineDay,
      daysRemaining: 0,
      daysPassed: 0,
      titleBn: 'আজ চাঁদা পরিশোধের শেষ দিন (১০ তারিখ)!',
      headlineBn: 'আজকের মধ্যেই চলতি মাসের মাসিক চাঁদা জমা দিন',
      descriptionBn: 'জরুরি নোটিফিকেশন: আজ চলতি মাসের ১০ তারিখ, চাঁদা পরিশোধের শেষ দিন। জরিমানা বা বকেয়া এড়াতে অনুগ্রহ করে আজকের মধ্যেই আপনার মাসিক চাঁদা পরিশোধ করুন।',
      badgeBn: 'আজ ১০ তারিখ (শেষ দিন)',
      urgency: 'critical',
      isToday10th: true,
    };
  }

  // dayOfMonth > 10
  const daysPassed = dayOfMonth - deadlineDay;
  return {
    state: 'overdue',
    dayOfMonth,
    deadlineDay,
    daysRemaining: 0,
    daysPassed,
    titleBn: 'মাসিক চাঁদা বকেয়া সতর্কবার্তা',
    headlineBn: '১০ তারিখের মধ্যে চাঁদা পরিশোধের সময়সীমা অতিক্রান্ত',
    descriptionBn: `চলতি মাসের ১০ তারিখ নির্ধারিত সময়সীমা পার হয়েছে (${toBengaliDigits(daysPassed)} দিন অতিক্রান্ত)। যাদের চাঁদা এখনও বাকি আছে, অতিসত্বর পরিশোধ করার অনুরোধ করা হচ্ছে।`,
    badgeBn: 'বকেয়া সতর্কতা (১০ তারিখ অতিক্রান্ত)',
    urgency: 'warning',
    isToday10th: false,
  };
}

export interface MemberDueStatus {
  isPaid: boolean;
  status: PaymentStatus;
  amountDue: number;
  amountPaid: number;
  remainingDue: number;
  dueRecord?: MonthlyDue;
}

/**
 * Checks if a specific member has cleared their monthly dues for the given year and month.
 */
export function getMemberMonthlyDueStatus(
  memberId: string,
  monthlyDues: MonthlyDue[],
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  defaultFee: number = 100
): MemberDueStatus {
  const record = monthlyDues.find(
    (d) => d.memberId === memberId && d.year === year && d.month === month
  );

  if (!record) {
    return {
      isPaid: false,
      status: 'unpaid',
      amountDue: defaultFee,
      amountPaid: 0,
      remainingDue: defaultFee,
    };
  }

  const remaining = Math.max(0, (record.amountDue || defaultFee) - (record.amountPaid || 0));
  const isPaid = record.status === 'paid' || remaining === 0;

  return {
    isPaid,
    status: isPaid ? 'paid' : record.status || 'unpaid',
    amountDue: record.amountDue || defaultFee,
    amountPaid: record.amountPaid || 0,
    remainingDue: remaining,
    dueRecord: record,
  };
}

/**
 * Generates official SMS reminder copy for a specific member.
 */
export function generateMemberReminderSMS(
  memberName: string,
  memberId: string,
  monthNameBn: string,
  dueAmount: number
): string {
  return `সম্মানিত সদস্য ${memberName} (${memberId}), সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন-এর নিয়ম মোতাবেক প্রতি মাসের ১০ তারিখের মধ্যে ${monthNameBn} মাসের চাঁদা ৳${dueAmount} পরিশোধ করার অনুরোধ রইল। বিকাশ/নগদ: ০১৭১২-৩৪৫৬৭৮। ধন্যবাদ।`;
}

/**
 * Generates official Bengali announcement text for the 10th-date deadline.
 */
export function generate10thTarikAnnouncement(
  monthNameBn: string,
  year: number,
  feeAmount: number
): { title: string; content: string; category: string } {
  return {
    title: `জরুরি নোটিশ: ${monthNameBn} মাসের চাঁদা পরিশোধের শেষ তারিখ ১০ই ${monthNameBn}`,
    content: `সকল সম্মানিত সদস্যদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA)-এর গঠনতন্ত্র ও কার্যপ্রণালী অনুযায়ী প্রতি মাসের ১০ তারিখের মধ্যে চলতি মাসের মাসিক চাঁদা (৳${toBengaliDigits(feeAmount)}) পরিশোধ করার বাধ্যবাধকতা রয়েছে।\n\nযাদের চলতি ${monthNameBn} মাসের চাঁদা এখনও অপরিশোধিত আছে, তারা আগামী ১০ তারিখের মধ্যে সরাসরি কোষাধ্যক্ষকে নগদ অথবা পোর্টালে বিকাশ/নগদের মাধ্যমে জমা দিয়ে ট্রানজেকশন আইডি এন্ট্রি করুন।\n\n- নির্বাহী পরিষদ, সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন`,
    category: 'জরুরি বিজ্ঞপ্তি',
  };
}
