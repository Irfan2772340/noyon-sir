import { MonthlyDue, AnnualDue, Transaction, Member } from '../types';

/**
 * Generates the next sequential Member ID like MEM-0001, MEM-0002
 */
export function generateNextMemberId(existingIds: string[]): string {
  let maxNum = 0;
  for (const id of existingIds) {
    const match = id.match(/^MEM-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `MEM-${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Generates a unique Money Receipt number: REC-YYYYMM-XXXX
 */
export function generateReceiptNumber(typePrefix = 'REC'): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${typePrefix}-${yearMonth}-${random}`;
}

/**
 * Generates a unique Transaction ID: TXN-INC-XXXX / TXN-EXP-XXXX
 */
export function generateTransactionId(type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? 'TXN-INC' : 'TXN-EXP';
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Standard composite key for monthly due to prevent duplicate monthly obligations
 */
export function generateMonthlyDueId(memberId: string, year: number, month: number): string {
  const formattedMonth = month.toString().padStart(2, '0');
  return `due_${memberId}_${year}_${formattedMonth}`;
}

/**
 * Standard composite key for annual due to prevent duplicate annual obligations
 */
export function generateAnnualDueId(memberId: string, year: number): string {
  return `annual_${memberId}_${year}`;
}

export interface FundSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  cashIncome: number;
  cashExpense: number;
  cashBalance: number;
  bankIncome: number;
  bankExpense: number;
  bankBalance: number;
}

/**
 * Calculates complete cash and bank fund position from verified transactions
 */
export function calculateFundSummary(
  transactions: Transaction[],
  openingCash = 0,
  openingBank = 0
): FundSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let cashIncome = openingCash;
  let cashExpense = 0;
  let bankIncome = openingBank;
  let bankExpense = 0;

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const isCash = t.paymentMethod?.toLowerCase().includes('নগদ') || t.paymentMethod?.toLowerCase().includes('cash');

    if (t.type === 'income') {
      totalIncome += amount;
      if (isCash) {
        cashIncome += amount;
      } else {
        bankIncome += amount;
      }
    } else if (t.type === 'expense') {
      totalExpense += amount;
      if (isCash) {
        cashExpense += amount;
      } else {
        bankExpense += amount;
      }
    }
  }

  const cashBalance = cashIncome - cashExpense;
  const bankBalance = bankIncome - bankExpense;
  const netBalance = cashBalance + bankBalance;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    cashIncome,
    cashExpense,
    cashBalance,
    bankIncome,
    bankExpense,
    bankBalance,
  };
}

export interface MemberFinancialBalance {
  totalMonthlyDue: number;
  totalMonthlyPaid: number;
  monthlyOutstanding: number;
  monthlyPaidCount: number;
  monthlyUnpaidCount: number;
  monthlyPartialCount: number;

  totalAnnualDue: number;
  totalAnnualPaid: number;
  annualOutstanding: number;
  annualPaidCount: number;
  annualUnpaidCount: number;

  totalDue: number;
  totalPaid: number;
  netOutstanding: number;
}

/**
 * Calculates member-specific dues, payments, and balances
 */
export function calculateMemberBalance(
  monthlyDues: MonthlyDue[],
  annualDues: AnnualDue[]
): MemberFinancialBalance {
  let totalMonthlyDue = 0;
  let totalMonthlyPaid = 0;
  let monthlyPaidCount = 0;
  let monthlyUnpaidCount = 0;
  let monthlyPartialCount = 0;

  for (const m of monthlyDues) {
    const due = Number(m.amountDue) || 0;
    const paid = Number(m.amountPaid) || 0;
    totalMonthlyDue += due;
    totalMonthlyPaid += paid;

    if (m.status === 'paid') monthlyPaidCount++;
    else if (m.status === 'partial') monthlyPartialCount++;
    else if (m.status === 'unpaid') monthlyUnpaidCount++;
  }

  const monthlyOutstanding = Math.max(0, totalMonthlyDue - totalMonthlyPaid);

  let totalAnnualDue = 0;
  let totalAnnualPaid = 0;
  let annualPaidCount = 0;
  let annualUnpaidCount = 0;

  for (const a of annualDues) {
    const due = Number(a.amountDue) || 0;
    const paid = Number(a.amountPaid) || 0;
    totalAnnualDue += due;
    totalAnnualPaid += paid;

    if (a.status === 'paid') annualPaidCount++;
    else if (a.status === 'unpaid' || a.status === 'partial') annualUnpaidCount++;
  }

  const annualOutstanding = Math.max(0, totalAnnualDue - totalAnnualPaid);
  const totalDue = totalMonthlyDue + totalAnnualDue;
  const totalPaid = totalMonthlyPaid + totalAnnualPaid;
  const netOutstanding = monthlyOutstanding + annualOutstanding;

  return {
    totalMonthlyDue,
    totalMonthlyPaid,
    monthlyOutstanding,
    monthlyPaidCount,
    monthlyUnpaidCount,
    monthlyPartialCount,

    totalAnnualDue,
    totalAnnualPaid,
    annualOutstanding,
    annualPaidCount,
    annualUnpaidCount,

    totalDue,
    totalPaid,
    netOutstanding,
  };
}

/**
 * Generates batch monthly dues for active members while ignoring members who already have a due for that month
 */
export function prepareBatchMonthlyDues(
  members: Member[],
  year: number,
  month: number,
  monthNameBn: string,
  amountDue: number,
  existingDueIds: Set<string>
): MonthlyDue[] {
  const newDues: MonthlyDue[] = [];

  for (const member of members) {
    if (member.status !== 'active') continue;
    const dueId = generateMonthlyDueId(member.memberId, year, month);
    if (!existingDueIds.has(dueId)) {
      newDues.push({
        id: dueId,
        memberId: member.memberId,
        memberNameBn: member.nameBn,
        year,
        month,
        monthNameBn,
        amountDue,
        amountPaid: 0,
        status: 'unpaid',
      });
    }
  }

  return newDues;
}
