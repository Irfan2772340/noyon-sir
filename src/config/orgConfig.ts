/**
 * ==============================================================================================
 * সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA) - প্রধান কনফিগারেশন ফাইল (Developer Editable Config)
 * ==============================================================================================
 *
 * যে কোনো ডেভেলপার সহজেই নিচের মানগুলো পরিবর্তন বা সম্পাদনা করতে পারবেন।
 * এখানে সংগঠনের নাম, স্লোগান, ঠিকানা, স্থাপিত তারিখ, অর্থবছর, সামাজিক যোগাযোগ ও চাঁদার নিয়ম সংরক্ষিত আছে।
 */

import { OrgSettings } from '../types';

export interface DeveloperInfo {
  name: string;
  nameEn: string;
  degree: string;
  email: string;
  role: string;
}

export interface ExtendedOrgConfig extends OrgSettings {
  village: string;
  postcode: string;
  upazila: string;
  district: string;
  monthlyDuesDeadlineDay: number;
  whatsappLink: string;
  facebookPageLink: string;
  developer: DeveloperInfo;
}

export const APP_ORG_CONFIG: ExtendedOrgConfig = {
  // ১. সংগঠনের নাম ও স্লোগান
  orgNameBn: 'সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন',
  orgNameEn: 'SARKAR PARA WELFARE ASSOCIATION (SPWA)',
  mottoBn: 'শিক্ষা, সেবা, একতা, উন্নয়ন',

  // ২. স্থাপিত তারিখ ও বছর (User specified: 2026 সালের 5 মে 2026)
  establishedDateBn: '৫ ই মে ২০২৬ খ্রি.',
  establishedYear: '২০২৬',

  // ৩. অর্থবছর (User specified: 2026-2027)
  financialYear: '২০২৬-২০২৭',

  // ৪. পূর্ণাঙ্গ ঠিকানা (User specified: Village: Durgapur, Chandijan; Postcode: 5600; Upazila: Ulipur; District: Kurigram)
  village: 'দুর্গাপুর, চন্ডিজান',
  postcode: '৫৬০০',
  upazila: 'উলিপুর',
  district: 'কুড়িগ্রাম',
  address: 'গ্রাম: দুর্গাপুর, চন্ডিজান, পোস্টকোড: ৫৬০০, উপজেলা: উলিপুর, জেলা: কুড়িগ্রাম',

  // ৫. যোগাযোগের তথ্য
  phone: '০১৭১২-৩৪৫৬৭৮',
  email: 'sarkarpara.welfare@gmail.com',

  // ৬. লোগো ও প্রতীক পাথ
  logoUrl: '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg',

  // ৭. নির্ধারিত চাঁদার হার ও শেষ তারিখ (প্রতি মাসের ১০ তারিখ)
  defaultMonthlyFee: 100,
  defaultAnnualFee: 500,
  monthlyDuesDeadlineDay: 10,

  // ৮. হোয়াটসঅ্যাপ ও ফেসবুক পেজ লিংক (User specified: WhatsApp group & Facebook page)
  whatsappLink: 'https://chat.whatsapp.com/J9QIz8kS53m75G1bj4Lk7r',
  facebookPageLink: 'https://www.facebook.com/noyan.miah1',

  // ৯. ডেভেলপার পরিচিতি ও ক্রেডিট (User specified: Md Irfan Rahat Bachelor in AI & Software Engineering)
  developer: {
    name: 'মোঃ ইরফান রাহাত',
    nameEn: 'Md Irfan Rahat',
    degree: 'Bachelor in AI & Software Engineering',
    email: 'irfanrahat277234@gmail.com',
    role: 'Lead AI & Software Engineer',
  },
};

/**
 * Local storage key for persistent custom settings edited in the UI
 */
export const SETTINGS_STORAGE_KEY = 'spwa_org_settings_v2';

/**
 * Loads current settings with fallback to APP_ORG_CONFIG
 */
export function getInitialStoredSettings(): OrgSettings {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...APP_ORG_CONFIG,
          ...parsed,
          logoUrl: parsed.logoUrl || APP_ORG_CONFIG.logoUrl,
          whatsappLink: parsed.whatsappLink || APP_ORG_CONFIG.whatsappLink,
          facebookPageLink: parsed.facebookPageLink || APP_ORG_CONFIG.facebookPageLink,
        };
      }
    } catch (e) {
      console.warn('Could not read saved settings from localStorage', e);
    }
  }
  return APP_ORG_CONFIG;
}
