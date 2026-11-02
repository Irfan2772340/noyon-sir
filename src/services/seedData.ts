import { doc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ORG_SETTINGS, BOOTSTRAP_ADMIN_EMAIL } from './db';
import { Member, MonthlyDue, AnnualDue, Transaction, Receipt, Announcement, AuditLog } from '../types';
import { generateMonthlyDueId, generateAnnualDueId } from '../utils/calculations';
import { numberToBengaliWords } from '../utils/bengali';

export async function checkAndSeedInitialData(): Promise<void> {
  try {
    const membersSnap = await getDocs(collection(db, 'members'));
    if (!membersSnap.empty) {
      return; // Already initialized
    }

    console.log('Seeding initial organizational data for Sarkarpara Welfare Association...');

    const batch = writeBatch(db);

    // 1. Settings
    batch.set(doc(db, 'settings', 'general'), {
      ...DEFAULT_ORG_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    });

    // 2. Members
    const initialMembers: Member[] = [
      {
        id: 'MEM-0001',
        memberId: 'MEM-0001',
        nameBn: 'হাজী মোঃ আকবর আলী',
        phone: '০১৭০১-১২২২৩৩',
        address: 'মধ্য সরকারপাড়া, বাড়ি নং ১২',
        joiningDate: '২০২০-০১-০১',
        status: 'active',
        position: 'সভাপতি',
        emergencyContact: '০১৮১২-০০১১২২ (ছেলে)',
        notes: 'সংগঠনের প্রতিষ্ঠাতা সভাপতি ও প্রধান উপদেষ্টা',
        createdAt: '2020-01-01T00:00:00.000Z',
      },
      {
        id: 'MEM-0002',
        memberId: 'MEM-0002',
        nameBn: 'মোঃ রফিকুল ইসলাম সরকার',
        phone: '০১৭০২-৩৩৪৪৫৫',
        address: 'দক্ষিণ সরকারপাড়া, মাস্টার বাড়ি',
        joiningDate: '২০২০-০১-০১',
        status: 'active',
        position: 'সাধারণ সম্পাদক',
        emergencyContact: '০১৯১২-৩৩৪৪৫৫',
        notes: 'কার্যকরী কমিটির সার্বিক সমন্বয়ক',
        createdAt: '2020-01-01T00:00:00.000Z',
      },
      {
        id: 'MEM-0003',
        memberId: 'MEM-0003',
        nameBn: 'মোঃ শফিকুল ইসলাম',
        phone: '০১৭০৩-৫৫৬৬৭৭',
        address: 'উত্তর সরকারপাড়া, সরকার ভবন',
        joiningDate: '২০২০-০১-১৫',
        status: 'active',
        position: 'কোষাধ্যক্ষ',
        emergencyContact: '০১৭০৩-১১২২৩৩',
        notes: 'তহবিল ও ব্যাংক হিসাবের দায়িত্বপ্রাপ্ত কোষাধ্যক্ষ',
        createdAt: '2020-01-15T00:00:00.000Z',
      },
      {
        id: 'MEM-0004',
        memberId: 'MEM-0004',
        nameBn: 'ইঞ্জিনিয়ার তানভীর আহমেদ',
        phone: '০১৭০৪-৭৭৮৮৯৯',
        address: 'পশ্চিম সরকারপাড়া',
        joiningDate: '২০২১-০৩-১০',
        status: 'active',
        position: 'সাংগঠনিক সম্পাদক',
        emergencyContact: '০১৮০৪-৭৭৮৮৯৯',
        notes: 'সদস্য অন্তর্ভুক্তি ও যুব কল্যাণ দায়িত্ব',
        createdAt: '2021-03-10T00:00:00.000Z',
      },
      {
        id: 'MEM-0005',
        memberId: 'MEM-0005',
        nameBn: 'মোঃ দেলোয়ার হোসেন',
        phone: '০১৭০৫-৯৯০০১১',
        address: 'পূর্ব সরকারপাড়া',
        joiningDate: '২০২২-০২-০১',
        status: 'active',
        position: 'সাধারণ সদস্য',
        emergencyContact: '০১৯০৫-৯৯০০১১',
        notes: 'নিয়মিত চাঁদা প্রদানকারী সদস্য',
        createdAt: '2022-02-01T00:00:00.000Z',
      },
      {
        id: 'MEM-0006',
        memberId: 'MEM-0006',
        nameBn: 'মোঃ কামরুল হাসান',
        phone: '০১৭০৬-১২৩৪৫৬',
        address: 'মধ্য সরকারপাড়া',
        joiningDate: '২০২২-০৫-১৫',
        status: 'active',
        position: 'সাধারণ সদস্য',
        emergencyContact: '০১৮০৬-১২৩৪৫৬',
        notes: 'সামাজিক কার্যক্রমে সক্রিয়',
        createdAt: '2022-05-15T00:00:00.000Z',
      },
      {
        id: 'MEM-0007',
        memberId: 'MEM-0007',
        nameBn: 'মোঃ ফরিদুল হক',
        phone: '০১৭০৭-৬৫৪৩২১',
        address: 'উত্তর সরকারপাড়া',
        joiningDate: '২০২৩-০১-০১',
        status: 'active',
        position: 'সাধারণ সদস্য',
        emergencyContact: '০১৯০৭-৬৫৪৩২১',
        notes: 'সমাজসেবা উপ-কমিটির সদস্য',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
      {
        id: 'MEM-0008',
        memberId: 'MEM-0008',
        nameBn: 'মোঃ জাহিদ হাসান',
        phone: '০১৭০৮-৯৮৭৬৫৪',
        address: 'দক্ষিণ সরকারপাড়া',
        joiningDate: '২০২৪-০১-১০',
        status: 'inactive',
        position: 'সাধারণ সদস্য',
        emergencyContact: '০১৮০৮-৯৮৭৬৫৪',
        notes: 'প্রবাসী - সাময়িক কর্মবিরতিতে',
        createdAt: '2024-01-10T00:00:00.000Z',
      },
    ];

    for (const m of initialMembers) {
      batch.set(doc(db, 'members', m.memberId), m);
    }

    // 3. Monthly Dues for current year
    const months = [
      { id: 1, name: 'জানুয়ারি' },
      { id: 2, name: 'ফেব্রুয়ারি' },
      { id: 3, name: 'মার্চ' },
      { id: 4, name: 'এপ্রিল' },
      { id: 5, name: 'মে' },
      { id: 6, name: 'জুন' },
    ];

    const currentYear = 2025;
    for (const m of initialMembers) {
      for (const mon of months) {
        const dueId = generateMonthlyDueId(m.memberId, currentYear, mon.id);
        const isPaid = (mon.id <= 3 && m.status === 'active') || (m.memberId === 'MEM-0001' && mon.id <= 4);
        const isPartial = mon.id === 4 && m.memberId === 'MEM-0002';

        const amountDue = 100;
        const amountPaid = isPaid ? 100 : isPartial ? 50 : 0;
        const status = isPaid ? 'paid' : isPartial ? 'partial' : 'unpaid';

        const dueRecord: MonthlyDue = {
          id: dueId,
          memberId: m.memberId,
          memberNameBn: m.nameBn,
          year: currentYear,
          month: mon.id,
          monthNameBn: mon.name,
          amountDue,
          amountPaid,
          status,
          paymentDate: isPaid || isPartial ? `2025-${mon.id.toString().padStart(2, '0')}-05` : undefined,
          paymentMethod: isPaid || isPartial ? 'নগদ (Cash)' : undefined,
          receiptNumber: isPaid ? `REC-M-20250${mon.id}-${m.memberId.replace('MEM-', '')}` : undefined,
          recorderName: isPaid || isPartial ? 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)' : undefined,
        };

        batch.set(doc(db, 'monthly_dues', dueId), dueRecord);
      }
    }

    // 4. Annual Dues (2025)
    for (const m of initialMembers) {
      const annualDueId = generateAnnualDueId(m.memberId, currentYear);
      const isPaid = m.memberId === 'MEM-0001' || m.memberId === 'MEM-0002' || m.memberId === 'MEM-0003';
      const dueRecord: AnnualDue = {
        id: annualDueId,
        memberId: m.memberId,
        memberNameBn: m.nameBn,
        year: currentYear,
        financialYear: '২০২৫-২০২৬',
        amountDue: 500,
        amountPaid: isPaid ? 500 : 0,
        status: isPaid ? 'paid' : 'unpaid',
        paymentDate: isPaid ? '2025-01-10' : undefined,
        paymentMethod: isPaid ? 'ব্যাংক ট্রান্সফার (Bank)' : undefined,
        receiptNumber: isPaid ? `REC-A-2025-${m.memberId.replace('MEM-', '')}` : undefined,
        recorderName: isPaid ? 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)' : undefined,
      };
      batch.set(doc(db, 'annual_dues', annualDueId), dueRecord);
    }

    // 5. Initial Transactions (Income & Expense)
    const initialTransactions: Transaction[] = [
      {
        id: 'TXN-INC-20250101-1001',
        transactionId: 'TXN-INC-20250101-1001',
        date: '2025-01-01',
        type: 'income',
        category: 'উদ্বৃত্ত তহবিল (প্রারম্ভিক স্থিতি)',
        amount: 25000,
        description: 'পূর্ববর্তী অর্থবছর থেকে স্থানান্তরিত নগদ ও ব্যাংক উদ্বৃত্ত তহবিল',
        paymentMethod: 'ব্যাংক ট্রান্সফার (Bank)',
        recordedBy: 'system',
        recordedByName: 'সুপার অ্যাডমিন',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'TXN-INC-20250110-1002',
        transactionId: 'TXN-INC-20250110-1002',
        date: '2025-01-10',
        type: 'income',
        category: 'বার্ষিক চাঁদা',
        amount: 1500,
        description: 'সদস্যদের বার্ষিক চাঁদা আদায় (MEM-0001, MEM-0002, MEM-0003)',
        paymentMethod: 'ব্যাংক ট্রান্সফার (Bank)',
        recordedBy: 'treasurer',
        recordedByName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        createdAt: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'TXN-INC-20250215-1003',
        transactionId: 'TXN-INC-20250215-1003',
        date: '2025-02-15',
        type: 'income',
        category: 'বিশেষ অনুদান',
        amount: 10000,
        description: 'গ্রামের দরিদ্র শিক্ষার্থীদের শিক্ষা তহবিল বাবদ বিশেষ অনুদান',
        paymentMethod: 'বিকাশ (bKash)',
        recordedBy: 'treasurer',
        recordedByName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        createdAt: '2025-02-15T14:30:00.000Z',
      },
      {
        id: 'TXN-EXP-20250220-2001',
        transactionId: 'TXN-EXP-20250220-2001',
        date: '2025-02-20',
        type: 'expense',
        category: 'শিক্ষা সহায়তা ও খাতা-কলম বিতরণ',
        amount: 6500,
        description: 'সরকারপাড়া প্রাথমিক বিদ্যালয়ের অস্বচ্ছল শিক্ষার্থীদের খাতা ও শিক্ষা সামগ্রী বিতরণ',
        paymentMethod: 'নগদ (Cash)',
        voucherRef: 'VOUCH-012',
        recordedBy: 'treasurer',
        recordedByName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        createdAt: '2025-02-20T11:00:00.000Z',
      },
      {
        id: 'TXN-EXP-20250305-2002',
        transactionId: 'TXN-EXP-20250305-2002',
        date: '2025-03-05',
        type: 'expense',
        category: 'দাপ্তরিক ও সভা পরিচালনা খরচ',
        amount: 1800,
        description: 'মাসিক সাধারণ সভার চা-নাশতা ও ফাইল-খাতা ক্রয়',
        paymentMethod: 'নগদ (Cash)',
        voucherRef: 'VOUCH-018',
        recordedBy: 'treasurer',
        recordedByName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        createdAt: '2025-03-05T17:00:00.000Z',
      },
    ];

    for (const t of initialTransactions) {
      batch.set(doc(db, 'transactions', t.transactionId), t);
    }

    // 6. Sample Receipts
    const sampleReceipts: Receipt[] = [
      {
        id: 'REC-M-202501-0001',
        receiptNumber: 'REC-M-202501-0001',
        memberId: 'MEM-0001',
        memberNameBn: 'হাজী মোঃ আকবর আলী',
        phone: '০১৭০১-১২২২৩৩',
        paymentType: 'monthly',
        period: 'জানুয়ারি ২০২৫',
        amount: 100,
        amountInWords: numberToBengaliWords(100),
        date: '2025-01-05',
        paymentMethod: 'নগদ (Cash)',
        recorderName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        notes: 'নিয়মিত মাসিক চাঁদা',
        createdAt: '2025-01-05T10:00:00.000Z',
      },
      {
        id: 'REC-A-2025-0001',
        receiptNumber: 'REC-A-2025-0001',
        memberId: 'MEM-0001',
        memberNameBn: 'হাজী মোঃ আকবর আলী',
        phone: '০১৭০১-১২২২৩৩',
        paymentType: 'annual',
        period: 'বার্ষিক চাঁদা (২০২৫-২০২৬)',
        amount: 500,
        amountInWords: numberToBengaliWords(500),
        date: '2025-01-10',
        paymentMethod: 'ব্যাংক ট্রান্সফার (Bank)',
        recorderName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        notes: 'বার্ষিক সদস্য ফি',
        createdAt: '2025-01-10T11:00:00.000Z',
      },
    ];

    for (const r of sampleReceipts) {
      batch.set(doc(db, 'receipts', r.receiptNumber), r);
    }

    // 7. Announcements
    const announcements: Announcement[] = [
      {
        id: 'ann_01',
        title: 'আসন্ন বার্ষিক সাধারণ সভা ও সদস্য সম্মিলন',
        content: 'সম্মানিত সদস্যবৃন্দ, আগামী মাসের প্রথম শুক্রবার সরকারপাড়া সমাজকল্যাণ ভবনে আমাদের বার্ষিক সাধারণ সভা ও সদস্য সম্মেলন অনুষ্ঠিত হবে। সকল সদস্যকে যথাসময়ে উপস্থিত থাকার অনুরোধ করা হচ্ছে।',
        category: 'সভা',
        publishedAt: '২০২৫-০৩-০১',
        publishedBy: 'system',
        authorName: 'মোঃ রফিকুল ইসলাম সরকার (সাধারণ সম্পাদক)',
        createdAt: '2025-03-01T08:00:00.000Z',
      },
      {
        id: 'ann_02',
        title: 'নিয়মিত মাসিক ও বার্ষিক চাঁদা পরিশোধের বিশেষ তাগিদ',
        content: 'অ্যাসোসিয়েশনের সমাজকল্যাণমূলক কর্মকাণ্ড সুষ্ঠুভাবে পরিচালনার জন্য সকল সদস্যকে তাঁদের বকেয়া মাসিক ও বার্ষিক চাঁদা পরিশোধ করার বিনীত আহ্বান জানানো হচ্ছে। আপনারা কোষাধ্যক্ষ মহোদয়ের কাছে সরাসরি অথবা বিকাশ/ব্যাংকের মাধ্যমে চাঁদা জমা দিয়ে রশিদ সংগ্রহ করুন।',
        category: 'চাঁদা তাগিদ',
        publishedAt: '২০২৫-০২-১৫',
        publishedBy: 'system',
        authorName: 'মোঃ শফিকুল ইসলাম (কোষাধ্যক্ষ)',
        createdAt: '2025-02-15T09:00:00.000Z',
      },
    ];

    for (const a of announcements) {
      batch.set(doc(db, 'announcements', a.id), a);
    }

    // 8. Audit log initial record
    batch.set(doc(db, 'audit_logs', 'log_init'), {
      id: 'log_init',
      action: 'SYSTEM_INITIALIZED',
      details: 'সরকারপাড়া ওয়েলফেয়ার অ্যাসোসিয়েশন ডাটাবেস ও প্রাথমিক রেকর্ড প্রস্তুত করা হয়েছে।',
      performedBy: 'system',
      performedByEmail: BOOTSTRAP_ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
    });

    await batch.commit();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during initial database seeding:', error);
  }
}
