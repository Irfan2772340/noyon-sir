/**
 * Bengali numeral and localization utilities
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const BENGALI_MONTHS = [
  { id: 1, name: 'জানুয়ারি', en: 'January' },
  { id: 2, name: 'ফেব্রুয়ারি', en: 'February' },
  { id: 3, name: 'মার্চ', en: 'March' },
  { id: 4, name: 'এপ্রিল', en: 'April' },
  { id: 5, name: 'মে', en: 'May' },
  { id: 6, name: 'জুন', en: 'June' },
  { id: 7, name: 'জুলাই', en: 'July' },
  { id: 8, name: 'আগস্ট', en: 'August' },
  { id: 9, name: 'সেপ্টেম্বর', en: 'September' },
  { id: 10, name: 'অক্টোবর', en: 'October' },
  { id: 11, name: 'নভেম্বর', en: 'November' },
  { id: 12, name: 'ডিসেম্বর', en: 'December' },
];

export function toBengaliDigits(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  return str.replace(/\d/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

export function toEnglishDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (bengaliDigit) => ENGLISH_DIGITS_MAP[bengaliDigit] || bengaliDigit);
}

export function formatBDT(amount: number | undefined | null): string {
  const num = Number(amount) || 0;
  const parts = Math.round(num).toString().split('.');
  // Add comma separators in Indian/Bengali grouping system (3, then groups of 2)
  let intPart = parts[0];
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return `৳ ${toBengaliDigits(intPart)}`;
}

export const ROLE_LABELS_BN: Record<string, string> = {
  super_admin: 'সুপার অ্যাডমিন',
  president: 'সভাপতি',
  general_secretary: 'সাধারণ সম্পাদক',
  treasurer: 'কোষাধ্যক্ষ',
  officer: 'অনুমোদিত কর্মকর্তা',
  member: 'সাধারণ সদস্য',
};

export const STATUS_LABELS_BN: Record<string, string> = {
  active: 'সক্রিয়',
  inactive: 'নিষ্ক্রিয়',
  suspended: 'সাময়িক বরখাস্ত',
  paid: 'পরিশোধিত',
  partial: 'আংশিক',
  unpaid: 'বকেয়া',
  waived: 'মওকুফ',
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

export const PAYMENT_METHODS = [
  'নগদ (Cash)',
  'বিকাশ (bKash)',
  'নগদ (Nagad)',
  'রকেট (Rocket)',
  'ব্যাংক ট্রান্সফার (Bank)',
  'অন্যান্য',
];

const ONES_BN: Record<number, string> = {
  0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়',
  10: 'দশ', 11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ',
  20: 'বিশ', 21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ',
  30: 'ত্রিশ', 31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ',
  40: 'চল্লিশ', 41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ',
  50: 'পঞ্চাশ', 51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট',
  60: 'ষাট', 61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর',
  70: 'সত্তর', 71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনাশি',
  80: 'আশি', 81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টায়শি', 89: 'নব্বই',
  90: 'নব্বই', 91: 'একানব্বই', 92: 'বানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
};

export function numberToBengaliWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'শূন্য টাকা মাত্র';

  function convertBelowHundred(val: number): string {
    return ONES_BN[val] || '';
  }

  let result = '';

  const crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = Math.floor(remainder / 100);
  const tens = remainder % 100;

  if (crore > 0) {
    result += `${convertBelowHundred(crore)} কোটি `;
  }
  if (lakh > 0) {
    result += `${convertBelowHundred(lakh)} লক্ষ `;
  }
  if (thousand > 0) {
    result += `${convertBelowHundred(thousand)} হাজার `;
  }
  if (hundred > 0) {
    result += `${convertBelowHundred(hundred)} শত `;
  }
  if (tens > 0) {
    result += `${convertBelowHundred(tens)} `;
  }

  return `${result.trim()} টাকা মাত্র`;
}
