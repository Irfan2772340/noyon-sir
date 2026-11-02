import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateNextMemberId,
  generateMonthlyDueId,
  generateAnnualDueId,
  calculateFundSummary,
  calculateMemberBalance,
  prepareBatchMonthlyDues,
} from './calculations';
import { toBengaliDigits, formatBDT, numberToBengaliWords } from './bengali';
import { getMemberVerificationUrl } from './qr.ts';
import { Member, MonthlyDue, AnnualDue, Transaction } from '../types';

test('Bengali numeral conversion and formatting', () => {
  assert.equal(toBengaliDigits(12345), '১২৩৪৫');
  assert.equal(toBengaliDigits(0), '০');
  assert.equal(formatBDT(100), '৳ ১০০');
  assert.equal(formatBDT(1500), '৳ ১,৫০০');
  assert.equal(numberToBengaliWords(100), 'এক শত টাকা মাত্র');
  assert.equal(numberToBengaliWords(500), 'পাঁচ শত টাকা মাত্র');
});

test('Sequential Member ID generation', () => {
  assert.equal(generateNextMemberId([]), 'MEM-0001');
  assert.equal(generateNextMemberId(['MEM-0001', 'MEM-0002']), 'MEM-0003');
  assert.equal(generateNextMemberId(['MEM-0009', 'MEM-0010']), 'MEM-0011');
});

test('Composite Due ID generation for preventing duplicate obligations', () => {
  assert.equal(generateMonthlyDueId('MEM-0001', 2025, 1), 'due_MEM-0001_2025_01');
  assert.equal(generateMonthlyDueId('MEM-0002', 2025, 12), 'due_MEM-0002_2025_12');
  assert.equal(generateAnnualDueId('MEM-0001', 2025), 'annual_MEM-0001_2025');
});

test('Fund Summary calculations accurately separate cash and bank', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      transactionId: 'TXN-1',
      date: '2025-01-01',
      type: 'income',
      category: 'চাঁদা',
      amount: 1000,
      description: 'নগদ চাঁদা',
      paymentMethod: 'নগদ',
      recordedBy: 'admin',
      recordedByName: 'Admin',
    },
    {
      id: '2',
      transactionId: 'TXN-2',
      date: '2025-01-02',
      type: 'income',
      category: 'অনুদান',
      amount: 5000,
      description: 'ব্যাংক অনুদান',
      paymentMethod: 'ব্যাংক ট্রান্সফার',
      recordedBy: 'admin',
      recordedByName: 'Admin',
    },
    {
      id: '3',
      transactionId: 'TXN-3',
      date: '2025-01-03',
      type: 'expense',
      category: 'দাপ্তরিক',
      amount: 500,
      description: 'নগদ খরচ',
      paymentMethod: 'নগদ',
      recordedBy: 'admin',
      recordedByName: 'Admin',
    },
  ];

  const summary = calculateFundSummary(sampleTransactions);
  assert.equal(summary.totalIncome, 6000);
  assert.equal(summary.totalExpense, 500);
  assert.equal(summary.netBalance, 5500);
  assert.equal(summary.cashBalance, 500); // 1000 - 500
  assert.equal(summary.bankBalance, 5000);
});

test('Member Financial Balance calculation', () => {
  const monthlyDues: MonthlyDue[] = [
    {
      id: '1',
      memberId: 'MEM-0001',
      memberNameBn: 'সদস্য ১',
      year: 2025,
      month: 1,
      monthNameBn: 'জানুয়ারি',
      amountDue: 100,
      amountPaid: 100,
      status: 'paid',
    },
    {
      id: '2',
      memberId: 'MEM-0001',
      memberNameBn: 'সদস্য ১',
      year: 2025,
      month: 2,
      monthNameBn: 'ফেব্রুয়ারি',
      amountDue: 100,
      amountPaid: 50,
      status: 'partial',
    },
    {
      id: '3',
      memberId: 'MEM-0001',
      memberNameBn: 'সদস্য ১',
      year: 2025,
      month: 3,
      monthNameBn: 'মার্চ',
      amountDue: 100,
      amountPaid: 0,
      status: 'unpaid',
    },
  ];

  const annualDues: AnnualDue[] = [
    {
      id: '4',
      memberId: 'MEM-0001',
      memberNameBn: 'সদস্য ১',
      year: 2025,
      financialYear: '২০২৫-২০২৬',
      amountDue: 500,
      amountPaid: 500,
      status: 'paid',
    },
  ];

  const balance = calculateMemberBalance(monthlyDues, annualDues);
  assert.equal(balance.totalMonthlyDue, 300);
  assert.equal(balance.totalMonthlyPaid, 150);
  assert.equal(balance.monthlyOutstanding, 150);
  assert.equal(balance.monthlyPaidCount, 1);
  assert.equal(balance.monthlyPartialCount, 1);
  assert.equal(balance.monthlyUnpaidCount, 1);

  assert.equal(balance.totalAnnualDue, 500);
  assert.equal(balance.totalAnnualPaid, 500);
  assert.equal(balance.annualOutstanding, 0);

  assert.equal(balance.totalDue, 800);
  assert.equal(balance.totalPaid, 650);
  assert.equal(balance.netOutstanding, 150);
});

test('Batch Monthly Dues generation excludes inactive and already existing dues', () => {
  const members: Member[] = [
    {
      id: 'MEM-0001',
      memberId: 'MEM-0001',
      nameBn: 'রহিম উদ্দিন',
      phone: '01700000001',
      address: 'সরকারপাড়া',
      joiningDate: '2024-01-01',
      status: 'active',
      position: 'সাধারণ সদস্য',
      emergencyContact: '',
      notes: '',
    },
    {
      id: 'MEM-0002',
      memberId: 'MEM-0002',
      nameBn: 'করিম মিয়া',
      phone: '01700000002',
      address: 'সরকারপাড়া',
      joiningDate: '2024-02-01',
      status: 'inactive', // should be excluded
      position: 'সাধারণ সদস্য',
      emergencyContact: '',
      notes: '',
    },
    {
      id: 'MEM-0003',
      memberId: 'MEM-0003',
      nameBn: 'আবুল কালাম',
      phone: '01700000003',
      address: 'সরকারপাড়া',
      joiningDate: '2024-03-01',
      status: 'active',
      position: 'সাধারণ সদস্য',
      emergencyContact: '',
      notes: '',
    },
  ];

  const existingDueIds = new Set(['due_MEM-0001_2025_01']); // MEM-0001 already has due for Jan 2025

  const newDues = prepareBatchMonthlyDues(members, 2025, 1, 'জানুয়ারি', 100, existingDueIds);
  assert.equal(newDues.length, 1);
  assert.equal(newDues[0].memberId, 'MEM-0003');
  assert.equal(newDues[0].id, 'due_MEM-0003_2025_01');
  assert.equal(newDues[0].amountDue, 100);
});

test('QR verification URL generation links directly to public verification page', () => {
  const url = getMemberVerificationUrl('MEM-0001');
  assert.ok(url.includes('?verify=MEM-0001'), 'URL should contain ?verify=MEM-0001 query param');
});

