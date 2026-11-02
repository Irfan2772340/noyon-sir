# সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA)
## পূর্ণাঙ্গ ডেভেলপার নির্দেশিকা ও APKPure APK আপলোড গাইড (Developer & APKPure Guide)

এই ডকুমেন্টটি নতুন বা অভিজ্ঞ যে কোনো সফটওয়্যার ইঞ্জিনিয়ারের জন্য প্রস্তুত করা হয়েছে, যাতে খুব সহজেই কোড পরিবর্তন, কাস্টমাইজেশন এবং অ্যান্ড্রয়েড **APK** তৈরি করে **APKPure** কিংবা অন্যান্য অ্যাপ স্টোরে আপলোড করা যায়।

---

## ১. প্রধান কনফিগারেশন ফাইল (যেখানে সবকিছু এডিট করবেন)

যেকোনো তথ্য (প্রতিষ্ঠার তারিখ, অর্থবছর, ঠিকানা, সোশ্যাল লিংক, লোগো, চাঁদা ইত্যাদি) এক জায়গা থেকে পরিবর্তন করার জন্য নির্ধারিত ফাইল:
📁 **`src/config/orgConfig.ts`**

```typescript
export const APP_ORG_CONFIG: ExtendedOrgConfig = {
  // ১. সংগঠনের নাম ও স্লোগান
  orgNameBn: 'সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন',
  orgNameEn: 'SARKAR PARA WELFARE ASSOCIATION (SPWA)',
  mottoBn: 'শিক্ষা, সেবা, একতা, উন্নয়ন',

  // ২. স্থাপিত তারিখ ও বছর
  establishedDateBn: '৫ ই মে ২০২৬ খ্রি.',
  establishedYear: '২০২৬',

  // ৩. অর্থবছর
  financialYear: '২০২৬-২০২৭',

  // ৪. পূর্ণাঙ্গ ঠিকানা
  village: 'দুর্গাপুর, চন্ডিজান',
  postcode: '৫৬০০',
  upazila: 'উলিপুর',
  district: 'কুড়িগ্রাম',
  address: 'গ্রাম: দুর্গাপুর, চন্ডিজান, পোস্টকোড: ৫৬০০, উপজেলা: উলিপুর, জেলা: কুড়িগ্রাম',

  // ৫. যোগাযোগের তথ্য
  phone: '০১৭১২-৩৪৫৬৭৮',
  email: 'sarkarpara.welfare@gmail.com',

  // ৬. লোগো ও ছবি
  logoUrl: '/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg',

  // ৭. চাঁদার হার ও ১০ তারিখের শেষ সময়
  defaultMonthlyFee: 100,
  defaultAnnualFee: 500,
  monthlyDuesDeadlineDay: 10,

  // ৮. হোয়াটসঅ্যাপ ও ফেসবুক পেজ লিংক
  whatsappLink: 'https://chat.whatsapp.com/J9QIz8kS53m75G1bj4Lk7r',
  facebookPageLink: '', // ফেসবুক পেজ তৈরি হলে এখানে লিংক বসিয়ে দিন

  // ৯. ডেভেলপার পরিচিতি
  developer: {
    name: 'মোঃ ইরফান রাহাত',
    nameEn: 'Md Irfan Rahat',
    degree: 'Bachelor in AI & Software Engineering',
    email: 'irfanrahat277234@gmail.com',
    role: 'Lead AI & Software Engineer',
  },
};
```

---

## ২. প্রজেক্ট সেটআপ ও লোকাল রান করার নিয়ম (Local Development)

### প্রয়োজনীয় সফটওয়্যার:
* **Node.js**: v18 অথবা তার বেশি
* **NPM**: v9 অথবা তার বেশি

### কমান্ডসমূহ:
```bash
# ১. ডিপেনডেন্সি ইনস্টল করুন
npm install

# ২. লোকাল ডেভেলপমেন্ট সার্ভার চালু করুন (Port 3000)
npm run dev

# ৩. প্রোডাকশন বিল্ড তৈরি করুন
npm run build

# ৪. টাইপস্ক্রিপ্ট লিন্ট চেক
npm run lint
```

---

## ৩. অ্যান্ড্রয়েড APK ফাইল তৈরি করার পদ্ধতি (Generating Android APK)

এই প্রজেক্টটি ইতিমধ্যে **PWA-Ready** এবং **Capacitor-Ready** হিসেবে কনফিগার করা আছে। নিচে APK তৈরির দুইটি সবচেয়ে সহজ পদ্ধতি দেওয়া হলো:

### পদ্ধতি ক: PWABuilder দিয়ে ২ মিনিটে রেডিমেড APK তৈরি (সবচেয়ে সহজ - কোনো সফটওয়্যার ইনস্টল ছাড়াই)
1. আপনার ব্রাউজারে **[https://www.pwabuilder.com](https://www.pwabuilder.com)** ওপেন করুন।
2. আপনার লাইভ ওয়েব অ্যাপের URL দিন:
   `https://sarkarpara-welfare-association.ai.studio`
   (অথবা প্রাকদর্শন লিংক: `https://ais-pre-nnuypkddswxpwbtatabwiu-45446003269.asia-east1.run.app`)
3. **"Start"** বাটনে ক্লিক করুন। PWABuilder স্বয়ংক্রিয়ভাবে আমাদের তৈরি করা `manifest.json` এবং `sw.js` ভেরিফাই করবে (সবুজ টিক দেখাবে)।
4. **"Package for Stores"** সেকশন থেকে **Android** নির্বাচন করুন।
5. **Package ID**: `org.sarkarpara.spwa`
   **App Name**: `SPWA - সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন`
6. **"Generate APK"** বাটনে ক্লিক করে সরাসরি রেডিমেড **`.apk`** ফাইল ডাউনলোড করে নিন।

---

### পদ্ধতি খ: Capacitor দিয়ে অ্যান্ড্রয়েড স্টুডিও থেকে সরাসরি APK তৈরি
প্রজেক্ট রুট ডিরেক্টরিতে ইতিমধ্যে `capacitor.config.json` ফাইল তৈরি করা আছে।

```bash
# ১. প্রোডাকশন বিল্ড তৈরি করুন
npm run build

# ২. Capacitor Android ডিপেনডেন্সি ইনস্টল করুন
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

# ৩. অ্যান্ড্রয়েড প্ল্যাটফর্ম যোগ করুন
npx cap add android

# ৪. কোড সিঙ্ক করুন
npx cap sync

# ৫. অ্যান্ড্রয়েড স্টুডিওতে ওপেন করুন
npx cap open android
```
অ্যান্ড্রয়েড স্টুডিও ওপেন হলে:
* মেনু থেকে **Build > Build Bundle(s) / APK(s) > Build APK(s)** নির্বাচন করুন।
* বিল্ড শেষ হলে আপনার **`app-debug.apk`** বা **`app-release.apk`** ফাইলটি পেয়ে যাবেন:
  `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## ৪. APKPure-এ APK আপলোড করার ধাপসমূহ (APKPure Upload Guide)

1. **APKPure ডেভেলপার পোর্টালে যান:**
   * ভিজিট করুন: **[https://developer.apkpure.com](https://developer.apkpure.com)**
   * আপনার ইমেইল (`irfanrahat277234@gmail.com`) দিয়ে একটি ফ্রি ডেভেলপার একাউন্ট তৈরি বা লগইন করুন।

2. **নতুন অ্যাপ যোগ করুন (Add New App):**
   * ড্যাশবোর্ড থেকে **"Publish New App"** অথবা **"Upload APK"** বাটনে ক্লিক করুন।
   * আপনার তৈরি করা `.apk` ফাইলটি ড্র্যাগ অ্যান্ড ড্রপ করে আপলোড করুন।

3. **অ্যাপের মৌলিক তথ্য পূরণ করুন:**
   * **App Name:** `সরকার পাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন (SPWA)`
   * **Package Name:** `org.sarkarpara.spwa`
   * **Category:** `Finance` অথবা `Social / Lifestyle`
   * **Language:** `Bengali / Bangla` & `English`
   * **Developer Name:** `Md Irfan Rahat`
   * **Support Email:** `irfanrahat277234@gmail.com`

4. **বিবরণ ও স্ক্রিনশট:**
   * **সংক্ষিপ্ত বিবরণ:** সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন-এর পূর্ণাঙ্গ ডিজিটাল চাঁদা ও সদস্য ব্যবস্থাপনা পোর্টাল।
   * **লোগো আইকন:** `public/assets/aistudio/founation_noyon_sir_7a7bd0d2.jpeg` (৫১২x৫১২ পিক্সেল) আপলোড করুন।
   * **স্ক্রিনশট:** ড্যাশবোর্ড, সদস্য তালিকা এবং আইডি কার্ডের ২-৩টি স্ক্রিনশট আপলোড করুন।

5. **প্রাইভেসি পলিসি লিংক (Privacy Policy URL):**
   * অ্যাপের প্রাইভেসি পলিসি লিংক অথবা আপনার ওয়েবসাইটের URL প্রদান করুন।

6. **সাবমিট ও প্রকাশ (Submit for Review):**
   * সব তথ্য যাচাই করে **"Submit"** চাপুন।
   * সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে APKPure টিম রিভিউ সম্পন্ন করে অ্যাপটি বিশ্বব্যাপী ডাউনলোডের জন্য উন্মুক্ত করে দেবে।

---

## ৫. ফোল্ডার ও কোড আর্কিটেকচার (Source Code Tree)

```text
├── capacitor.config.json    # Capacitor Android APK কনফিগারেশন
├── DEVELOPER_AND_APK_GUIDE.md # এই পূর্ণাঙ্গ নির্দেশিকা
├── index.html               # প্রধান HTML এন্ট্রি ও PWA মেটা ট্যাগ
├── package.json             # ডিপেনডেন্সি ও স্ক্রিপ্ট
├── public/
│   ├── assets/              # লোগো ও ছবি
│   ├── manifest.json        # Android PWA WebApp Manifest
│   └── sw.js                # অফলাইন সার্ভিস ওয়ার্কার
└── src/
    ├── App.tsx              # রুট কম্পোনেন্ট ও নেভিগেশন
    ├── config/
    │   └── orgConfig.ts     # ⭐ প্রধান এডিটেবল কনফিগারেশন ফাইল
    ├── components/
    │   ├── Footer.tsx       # ডেভেলপার ক্রেডিট ও সোশ্যাল লিংক
    │   ├── Navbar.tsx       # হেডার ও নোটিফিকেশন বার
    │   ├── Sidebar.tsx      # সাইডবার মেনু
    │   ├── AuthModal.tsx    # লগইন ও সদস্য সেলফ-রেজিস্ট্রেশন (ছবিসহ)
    │   ├── MemberCardModal.tsx # স্মার্ট মেম্বার আইডি কার্ড
    │   ├── MemberQRModal.tsx   # কিউআর কোড ব্যাজ
    │   └── PrivacyPolicyModal.tsx # প্রাইভেসি পলিসি মডাল
    ├── services/
    │   ├── db.ts            # ফায়ারস্টোর ও লোকাল ডেটা সার্ভিস
    │   └── initialData.ts   # প্রাথমিক ডেমো ডেটা
    ├── utils/
    │   ├── bengali.ts       # বাংলা সংখ্যা ও টাকার ফরম্যাটার
    │   ├── calculations.ts  # চাঁদা, বকেয়া ও তহবিল হিসাব
    │   └── imageUpload.ts   # ক্যানভাস ভিত্তিক ছবি রিসাইজিং ও অপ্টিমাইজেশন
    └── views/
        ├── DashboardView.tsx # মূল ড্যাশবোর্ড ও ফান্ড স্ট্যাটাস
        ├── MembersView.tsx   # সদস্য তালিকা ও ছবি আপলোড
        ├── MonthlyDuesView.tsx # মাসিক চাঁদা আদায় ও নোটিফিকেশন
        ├── AnnualDuesView.tsx  # বার্ষিক চাঁদা রেজিস্টার
        ├── PersonalMemberView.tsx # সদস্যের ব্যক্তিগত প্রোফাইল ও ফটো আপডেট
        ├── CashBookView.tsx  # ক্যাশ বুক ও ট্রানজেকশন
        ├── ReceiptsView.tsx  # ডিজিটাল মানি রশিদ
        ├── ReportsView.tsx   # আর্থিক রিপোর্ট ও স্টেটমেন্ট
        └── SettingsView.tsx  # সিস্টেম ও সোশ্যাল সেটিংস
```

---

## ৬. কোনো সমস্যা হলে যোগাযোগ
* **সফটওয়্যার ইঞ্জিনিয়ার:** মোঃ ইরফান রাহাত (Md Irfan Rahat)
* **ইমেইল:** `irfanrahat277234@gmail.com`
* **অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপ:** [https://chat.whatsapp.com/J9QIz8kS53m75G1bj4Lk7r](https://chat.whatsapp.com/J9QIz8kS53m75G1bj4Lk7r)
