export type UserRole =
  | 'super_admin'
  | 'president'
  | 'general_secretary'
  | 'treasurer'
  | 'officer'
  | 'member';

export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  assignedBy?: string;
  createdAt?: string;
}

export type MemberStatus = 'active' | 'inactive' | 'suspended';

export interface Member {
  id: string; // Document ID (usually same as memberId)
  memberId: string; // e.g. MEM-0001
  nameBn: string;
  phone: string;
  address: string;
  joiningDate: string;
  status: MemberStatus;
  position: string;
  emergencyContact: string;
  notes: string;
  photoUrl?: string;
  linkedUserId?: string;
  linkedEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'waived';

export interface MonthlyDue {
  id: string; // due_MEM-0001_2025_1
  memberId: string;
  memberNameBn: string;
  year: number;
  month: number;
  monthNameBn: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  recorderId?: string;
  recorderName?: string;
  notes?: string;
  updatedAt?: string;
}

export interface AnnualDue {
  id: string; // annual_MEM-0001_2025
  memberId: string;
  memberNameBn: string;
  year: number;
  financialYear: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  recorderId?: string;
  recorderName?: string;
  notes?: string;
  updatedAt?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  voucherRef?: string;
  receiptNumber?: string;
  memberId?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  memberId: string;
  memberNameBn: string;
  phone: string;
  paymentType: 'monthly' | 'annual' | 'donation' | 'other';
  period: string;
  amount: number;
  amountInWords: string;
  date: string;
  paymentMethod: string;
  recorderName: string;
  notes?: string;
  createdAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  publishedBy: string;
  authorName: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performedByEmail: string;
  timestamp: string;
}

export interface OrgSettings {
  orgNameBn: string;
  orgNameEn: string;
  mottoBn?: string;
  address: string;
  village?: string;
  postcode?: string;
  upazila?: string;
  district?: string;
  phone: string;
  email: string;
  financialYear: string;
  defaultMonthlyFee: number;
  defaultAnnualFee: number;
  logoUrl?: string;
  establishedYear?: string;
  establishedDateBn?: string;
  monthlyDuesDeadlineDay?: number;
  whatsappLink?: string;
  facebookPageLink?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PaymentRequest {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: 'monthly' | 'annual' | 'donation';
  period: string;
  method: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  reviewedBy?: string;
  notes?: string;
  createdAt?: string;
}
