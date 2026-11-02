import test from 'node:test';
import assert from 'node:assert/strict';
import {
  get10thTarikNotificationStatus,
  getMemberMonthlyDueStatus,
  generateMemberReminderSMS,
} from './paymentNotification';
import { MonthlyDue } from '../types';

test('10th-date payment notification status for upcoming dates (before 10th)', () => {
  const status5th = get10thTarikNotificationStatus(5);
  assert.equal(status5th.state, 'upcoming');
  assert.equal(status5th.daysRemaining, 5);
  assert.equal(status5th.isToday10th, false);
  assert.equal(status5th.urgency, 'info');

  const status9th = get10thTarikNotificationStatus(9);
  assert.equal(status9th.state, 'upcoming');
  assert.equal(status9th.daysRemaining, 1);
});

test('10th-date payment notification status on the exact 10th (আজ ১০ তারিখ)', () => {
  const status10th = get10thTarikNotificationStatus(10);
  assert.equal(status10th.state, 'due_today');
  assert.equal(status10th.daysRemaining, 0);
  assert.equal(status10th.isToday10th, true);
  assert.equal(status10th.urgency, 'critical');
  assert.ok(status10th.titleBn.includes('১০ তারিখ'));
});

test('10th-date payment notification status after the 10th (overdue warning)', () => {
  const status15th = get10thTarikNotificationStatus(15);
  assert.equal(status15th.state, 'overdue');
  assert.equal(status15th.daysPassed, 5);
  assert.equal(status15th.isToday10th, false);
  assert.equal(status15th.urgency, 'warning');
});

test('Member monthly dues status checking', () => {
  const mockDues: MonthlyDue[] = [
    {
      id: 'due_MEM-0001_2026_05',
      memberId: 'MEM-0001',
      memberNameBn: 'আকবর আলী',
      year: 2026,
      month: 5,
      monthNameBn: 'মে',
      amountDue: 100,
      amountPaid: 100,
      status: 'paid',
    },
    {
      id: 'due_MEM-0002_2026_05',
      memberId: 'MEM-0002',
      memberNameBn: 'রফিকুল ইসলাম',
      year: 2026,
      month: 5,
      monthNameBn: 'মে',
      amountDue: 100,
      amountPaid: 50,
      status: 'partial',
    },
  ];

  // Paid member
  const statusPaid = getMemberMonthlyDueStatus('MEM-0001', mockDues, 2026, 5, 100);
  assert.equal(statusPaid.isPaid, true);
  assert.equal(statusPaid.status, 'paid');
  assert.equal(statusPaid.remainingDue, 0);

  // Partial member
  const statusPartial = getMemberMonthlyDueStatus('MEM-0002', mockDues, 2026, 5, 100);
  assert.equal(statusPartial.isPaid, false);
  assert.equal(statusPartial.status, 'partial');
  assert.equal(statusPartial.remainingDue, 50);

  // Unpaid member not in records yet
  const statusUnpaid = getMemberMonthlyDueStatus('MEM-0003', mockDues, 2026, 5, 100);
  assert.equal(statusUnpaid.isPaid, false);
  assert.equal(statusUnpaid.status, 'unpaid');
  assert.equal(statusUnpaid.remainingDue, 100);
});

test('SMS reminder copy generation', () => {
  const sms = generateMemberReminderSMS('মোঃ দেলোয়ার', 'MEM-0005', 'মে', 100);
  assert.ok(sms.includes('MEM-0005'));
  assert.ok(sms.includes('১০ তারিখ'));
  assert.ok(sms.includes('৳100'));
});
