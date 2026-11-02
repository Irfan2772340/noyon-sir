import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
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
  AdminUser,
} from '../types';
import {
  generateReceiptNumber,
  generateTransactionId,
  generateMonthlyDueId,
  generateAnnualDueId,
} from '../utils/calculations';
import { numberToBengaliWords, toBengaliDigits } from '../utils/bengali';

import { APP_ORG_CONFIG, SETTINGS_STORAGE_KEY, getInitialStoredSettings } from '../config/orgConfig';

export const BOOTSTRAP_ADMIN_EMAIL = 'irfanrahat277234@gmail.com';

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  ...APP_ORG_CONFIG,
};

// ================= AUDIT LOGGING =================
export async function logAuditAction(
  action: string,
  details: string,
  performedByUid = auth.currentUser?.uid || 'system',
  performedByEmail = auth.currentUser?.email || 'admin@sarkarpara.org'
) {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `audit_logs/${logId}`;
  if (!auth.currentUser) {
    console.log(`[Local Audit] ${action}: ${details}`);
    return;
  }
  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      action,
      details,
      performedBy: performedByUid,
      performedByEmail,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write notice:', err);
  }
}

// ================= SETTINGS =================
export async function getSettings(): Promise<OrgSettings> {
  const path = 'settings/general';
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return snap.data() as OrgSettings;
    }
    return getInitialStoredSettings();
  } catch (error) {
    console.warn('Settings get notice:', error);
    return getInitialStoredSettings();
  }
}

export async function saveSettings(settings: OrgSettings, userEmail: string): Promise<void> {
  const path = 'settings/general';

  // Always persist locally so any developer/admin edits take effect immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  if (!auth.currentUser) {
    console.log('[Local] Settings saved locally to storage and state');
    return;
  }
  try {
    await setDoc(doc(db, 'settings', 'general'), {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin',
    });
    await logAuditAction('SETTINGS_UPDATED', `সংগঠনের সেটিংস আপডেট করা হয়েছে (${settings.financialYear})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= MEMBERS =================
export async function addMember(member: Omit<Member, 'id'>): Promise<void> {
  const path = `members/${member.memberId}`;
  if (!auth.currentUser) {
    console.log('[Local] Member added:', member.nameBn);
    return;
  }
  try {
    await setDoc(doc(db, 'members', member.memberId), {
      ...member,
      id: member.memberId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      'MEMBER_ADDED',
      `নতুন সদস্য যোগ করা হয়েছে: ${member.nameBn} (${member.memberId}), পদবী: ${member.position}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addMultipleMembers(membersList: Omit<Member, 'id'>[]): Promise<void> {
  if (membersList.length === 0) return;
  if (!auth.currentUser) {
    console.log('[Local] Bulk members added:', membersList.length);
    return;
  }
  try {
    for (const member of membersList) {
      await setDoc(doc(db, 'members', member.memberId), {
        ...member,
        id: member.memberId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await logAuditAction(
      'MEMBERS_BULK_IMPORTED',
      `সিএসভি (CSV) ফাইল থেকে একযোগে ${membersList.length} জন নতুন সদস্য সফলভাবে ইমপোর্ট করা হয়েছে।`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'members');
  }
}

export async function updateMember(memberId: string, updates: Partial<Member>): Promise<void> {
  const path = `members/${memberId}`;
  if (!auth.currentUser) {
    console.log('[Local] Member updated:', memberId);
    return;
  }
  try {
    await updateDoc(doc(db, 'members', memberId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      'MEMBER_UPDATED',
      `সদস্যের তথ্য সংশোধন করা হয়েছে: ${memberId}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= MONTHLY DUES =================
export async function createMonthlyDueRecord(due: MonthlyDue): Promise<void> {
  const path = `monthly_dues/${due.id}`;
  if (!auth.currentUser) {
    return;
  }
  try {
    await setDoc(doc(db, 'monthly_dues', due.id), {
      ...due,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordMonthlyPayment(params: {
  dueId: string;
  memberId: string;
  memberNameBn: string;
  memberPhone?: string;
  monthNameBn: string;
  year: number;
  amountDue: number;
  existingPaid: number;
  newPaymentAmount: number;
  paymentMethod: string;
  recorderName: string;
  notes?: string;
}): Promise<Receipt> {
  const path = `monthly_dues/${params.dueId}`;
  const totalPaidNow = params.existingPaid + params.newPaymentAmount;
  let status: 'paid' | 'partial' | 'unpaid' = 'partial';
  if (totalPaidNow >= params.amountDue) {
    status = 'paid';
  }

  const receiptNumber = generateReceiptNumber('REC-M');
  const paymentDate = new Date().toISOString().split('T')[0];
  const amountInWords = numberToBengaliWords(params.newPaymentAmount);

  const receiptData: Receipt = {
    id: receiptNumber,
    receiptNumber,
    memberId: params.memberId,
    memberNameBn: params.memberNameBn,
    phone: params.memberPhone || '',
    paymentType: 'monthly',
    period: `${params.monthNameBn} ${toBengaliDigits(params.year)}`,
    amount: params.newPaymentAmount,
    amountInWords,
    date: paymentDate,
    paymentMethod: params.paymentMethod,
    recorderName: params.recorderName,
    notes: params.notes || 'মাসিক চাঁদা পরিশোধ',
    createdAt: new Date().toISOString(),
  };

  if (!auth.currentUser) {
    console.log('[Local] Monthly payment recorded for:', params.memberNameBn);
    return receiptData;
  }

  try {
    // 1. Create Receipt in Firestore
    await setDoc(doc(db, 'receipts', receiptNumber), receiptData);

    // 2. Update Due Record
    await updateDoc(doc(db, 'monthly_dues', params.dueId), {
      amountPaid: totalPaidNow,
      status,
      paymentDate,
      paymentMethod: params.paymentMethod,
      receiptNumber,
      recorderId: auth.currentUser?.uid || 'admin',
      recorderName: params.recorderName,
      notes: params.notes || '',
      updatedAt: new Date().toISOString(),
    });

    // 3. Create Cash Book Transaction
    const transactionId = generateTransactionId('income');
    await setDoc(doc(db, 'transactions', transactionId), {
      id: transactionId,
      transactionId,
      date: paymentDate,
      type: 'income',
      category: 'সদস্য মাসিক চাঁদা',
      amount: params.newPaymentAmount,
      description: `${params.memberNameBn} (${params.memberId}) - ${params.monthNameBn} ${toBengaliDigits(params.year)}-এর চাঁদা`,
      paymentMethod: params.paymentMethod,
      receiptNumber,
      memberId: params.memberId,
      recordedBy: auth.currentUser?.uid || 'admin',
      recordedByName: params.recorderName,
      createdAt: new Date().toISOString(),
    });

    // 4. Audit Log
    await logAuditAction(
      'MONTHLY_PAYMENT_RECORDED',
      `${params.memberNameBn} (${params.memberId}) এর মাসিক চাঁদা ৳ ${params.newPaymentAmount} আদায় করা হয়েছে। রশিদ: ${receiptNumber}`
    );

    return receiptData;
  } catch (error) {
    console.warn('Firestore write warning:', error);
    return receiptData;
  }
}

// ================= ANNUAL DUES =================
export async function createAnnualDueRecord(due: AnnualDue): Promise<void> {
  const path = `annual_dues/${due.id}`;
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'annual_dues', due.id), {
      ...due,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordAnnualPayment(params: {
  dueId: string;
  memberId: string;
  memberNameBn: string;
  memberPhone?: string;
  financialYear: string;
  year: number;
  amountDue: number;
  existingPaid: number;
  newPaymentAmount: number;
  paymentMethod: string;
  recorderName: string;
  notes?: string;
}): Promise<Receipt> {
  const path = `annual_dues/${params.dueId}`;
  const totalPaidNow = params.existingPaid + params.newPaymentAmount;
  let status: 'paid' | 'partial' | 'unpaid' = 'partial';
  if (totalPaidNow >= params.amountDue) {
    status = 'paid';
  }

  const receiptNumber = generateReceiptNumber('REC-A');
  const paymentDate = new Date().toISOString().split('T')[0];
  const amountInWords = numberToBengaliWords(params.newPaymentAmount);

  const receiptData: Receipt = {
    id: receiptNumber,
    receiptNumber,
    memberId: params.memberId,
    memberNameBn: params.memberNameBn,
    phone: params.memberPhone || '',
    paymentType: 'annual',
    period: `বার্ষিক চাঁদা (${params.financialYear})`,
    amount: params.newPaymentAmount,
    amountInWords,
    date: paymentDate,
    paymentMethod: params.paymentMethod,
    recorderName: params.recorderName,
    notes: params.notes || 'বার্ষিক চাঁদা পরিশোধ',
    createdAt: new Date().toISOString(),
  };

  if (!auth.currentUser) {
    console.log('[Local] Annual payment recorded:', params.memberNameBn);
    return receiptData;
  }

  try {
    await setDoc(doc(db, 'receipts', receiptNumber), receiptData);

    await updateDoc(doc(db, 'annual_dues', params.dueId), {
      amountPaid: totalPaidNow,
      status,
      paymentDate,
      paymentMethod: params.paymentMethod,
      receiptNumber,
      recorderId: auth.currentUser?.uid || 'admin',
      recorderName: params.recorderName,
      notes: params.notes || '',
      updatedAt: new Date().toISOString(),
    });

    const transactionId = generateTransactionId('income');
    await setDoc(doc(db, 'transactions', transactionId), {
      id: transactionId,
      transactionId,
      date: paymentDate,
      type: 'income',
      category: 'সদস্য বার্ষিক চাঁদা',
      amount: params.newPaymentAmount,
      description: `${params.memberNameBn} (${params.memberId}) - বার্ষিক চাঁদা (${params.financialYear})`,
      paymentMethod: params.paymentMethod,
      receiptNumber,
      memberId: params.memberId,
      recordedBy: auth.currentUser?.uid || 'admin',
      recordedByName: params.recorderName,
      createdAt: new Date().toISOString(),
    });

    await logAuditAction(
      'ANNUAL_PAYMENT_RECORDED',
      `${params.memberNameBn} (${params.memberId}) এর বার্ষিক চাঁদা ৳ ${params.newPaymentAmount} আদায় করা হয়েছে। রশিদ: ${receiptNumber}`
    );

    return receiptData;
  } catch (error) {
    console.warn('Firestore write warning:', error);
    return receiptData;
  }
}

// ================= TRANSACTIONS (INCOME & EXPENSE) =================
export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
  const path = `transactions/${transaction.transactionId}`;
  if (!auth.currentUser) {
    console.log('[Local] Transaction recorded:', transaction.description);
    return;
  }
  try {
    await setDoc(doc(db, 'transactions', transaction.transactionId), {
      ...transaction,
      id: transaction.transactionId,
      createdAt: new Date().toISOString(),
    });
    await logAuditAction(
      transaction.type === 'income' ? 'INCOME_RECORDED' : 'EXPENSE_RECORDED',
      `${transaction.type === 'income' ? 'আয়' : 'ব্যয়'} এন্ট্রি: ৳ ${transaction.amount} (${transaction.category}) - ${transaction.description}`
    );
  } catch (error) {
    console.warn('Firestore write warning:', error);
  }
}

// ================= ANNOUNCEMENTS =================
export async function addAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<void> {
  const id = `ann_${Date.now()}`;
  const path = `announcements/${id}`;
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'announcements', id), {
      ...announcement,
      id,
      createdAt: new Date().toISOString(),
    });
    await logAuditAction('ANNOUNCEMENT_PUBLISHED', `বিজ্ঞপ্তি প্রকাশ: ${announcement.title}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= PAYMENT REQUESTS =================
export async function submitPaymentRequest(request: Omit<PaymentRequest, 'id'>): Promise<void> {
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `payment_requests/${id}`;
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'payment_requests', id), {
      ...request,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function approvePaymentRequest(req: PaymentRequest, recorderName: string): Promise<void> {
  const path = `payment_requests/${req.id}`;
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'payment_requests', req.id), {
      status: 'approved',
      reviewedBy: auth.currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      'PAYMENT_REQUEST_APPROVED',
      `${req.memberName} (${req.memberId}) এর ৳ ${req.amount} টাকা জমা অনুরোধ অনুমোদিত হয়েছে (TrxID: ${req.trxId})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rejectPaymentRequest(reqId: string, reason: string): Promise<void> {
  const path = `payment_requests/${reqId}`;
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'payment_requests', reqId), {
      status: 'rejected',
      notes: reason,
      reviewedBy: auth.currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= ADMIN MANAGEMENT =================
export async function assignAdminRole(adminUser: AdminUser): Promise<void> {
  const path = `admins/${adminUser.uid}`;
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'admins', adminUser.uid), {
      ...adminUser,
      assignedBy: auth.currentUser?.uid || 'super_admin',
      createdAt: new Date().toISOString(),
    });
    await logAuditAction(
      'ADMIN_ROLE_ASSIGNED',
      `${adminUser.name} (${adminUser.email}) কে ${adminUser.role} পদে দায়িত্ব অর্পণ করা হয়েছে`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= MEMBER REGISTRATION & ACCOUNT LINKING =================
export async function registerMemberProfile(params: {
  memberId: string;
  nameBn: string;
  phone: string;
  address: string;
  emergencyContact?: string;
  email: string;
  uid: string;
  photoUrl?: string;
}): Promise<Member> {
  const path = `members/${params.memberId}`;
  const newMember: Member = {
    id: params.memberId,
    memberId: params.memberId,
    nameBn: params.nameBn,
    phone: params.phone,
    address: params.address || 'সরকারপাড়া',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    position: 'সাধারণ সদস্য',
    emergencyContact: params.emergencyContact || '',
    notes: 'অনলাইন নিবন্ধনকৃত সদস্য',
    linkedUserId: params.uid,
    linkedEmail: params.email,
    photoUrl: params.photoUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'members', params.memberId), newMember);
    await logAuditAction(
      'MEMBER_SELF_REGISTERED',
      `নতুন সদস্য অনলাইন নিবন্ধন: ${params.nameBn} (${params.memberId}), ইমেইল: ${params.email}`
    );
  } catch (error) {
    console.warn('Member registration in Firestore notice (continuing locally):', error);
  }

  return newMember;
}

export async function linkMemberProfile(memberId: string, uid: string, email?: string): Promise<void> {
  const path = `members/${memberId}`;
  try {
    await updateDoc(doc(db, 'members', memberId), {
      linkedUserId: uid,
      ...(email ? { linkedEmail: email } : {}),
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction('MEMBER_LINKED', `সদস্য আইডি ${memberId} এর সাথে অ্যাকাউন্ট লিংক করা হয়েছে`);
  } catch (error) {
    console.warn('Link member profile notice:', error);
  }
}

