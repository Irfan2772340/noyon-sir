/**
 * CSV Import, Export, and Validation Utilities for Member Management
 * Handles RFC 4180 parsing, Unicode/Bengali text encoding (UTF-8 BOM),
 * multi-language column header detection, and duplicate/format validations.
 */

import { Member, MemberStatus } from '../types';
import { toBengaliDigits, toEnglishDigits, STATUS_LABELS_BN } from './bengali';
import { generateNextMemberId } from './calculations';

export interface CSVRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface CSVValidatedMember {
  rowNumber: number;
  member: Omit<Member, 'id'>;
  isDuplicatePhoneWarning?: boolean;
  warningMessage?: string;
}

export interface CSVValidationResult {
  totalRows: number;
  validMembers: CSVValidatedMember[];
  errors: CSVRowError[];
  warnings: CSVRowError[];
}

/**
 * Standard CSV Parser supporting quoted fields, escaped quotes (""), and multiline entries.
 */
export function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM if present
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Carriage return: handle CRLF or bare CR
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.length > 0 && r.some((cell) => cell.length > 0));
}

/**
 * Column header synonym mapper to support English & Bengali headers
 */
function normalizeHeaderName(header: string): string {
  const h = header.toLowerCase().replace(/[\s\-_()]/g, '');
  if (['memberid', 'id', 'সদস্যআইডি', 'সদস্যনম্বর', 'আইডি'].includes(h)) return 'memberId';
  if (['name', 'namebn', 'fullname', 'membername', 'নাম', 'পূর্ণনাম', 'সদস্যেরনাম'].includes(h)) return 'nameBn';
  if (['phone', 'mobile', 'cell', 'contact', 'মোবাইল', 'ফোন', 'মোবাইলনম্বর', 'যোগাযোগনম্বর'].includes(h)) return 'phone';
  if (['address', 'village', 'ঠিকানা', 'গ্রাম'].includes(h)) return 'address';
  if (['joiningdate', 'joindate', 'date', 'যোগদানেরতারিখ', 'যোগদানতারিখ', 'তারিখ'].includes(h)) return 'joiningDate';
  if (['status', 'স্থিতি', 'অবস্থা', 'সদস্যস্থিতি'].includes(h)) return 'status';
  if (['position', 'designation', 'role', 'পদবী', 'পদ'].includes(h)) return 'position';
  if (['emergencycontact', 'emergency', 'জরুরিজোগাযোগ', 'জরুরিযোগাযোগ', 'জরুরিনম্বর'].includes(h)) return 'emergencyContact';
  if (['linkedemail', 'email', 'ইমেইল', 'ইমেল'].includes(h)) return 'linkedEmail';
  if (['notes', 'note', 'comment', 'মন্তব্য', 'নোট'].includes(h)) return 'notes';
  return header;
}

/**
 * Cleans phone numbers (handles Bengali digits, dashes, spaces, country codes).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const english = toEnglishDigits(rawPhone);
  // remove non-numeric chars except leading +
  const digits = english.replace(/[^\d]/g, '');
  if (digits.startsWith('880')) {
    return '0' + digits.slice(3);
  }
  return digits;
}

/**
 * Formats a valid YYYY-MM-DD date from various common formats.
 */
export function normalizeDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const english = toEnglishDigits(rawDate.trim());

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(english)) {
    return english;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = english.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // MM/DD/YYYY
  const mdyMatch = english.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
  if (mdyMatch) {
    const year = mdyMatch[1];
    const month = mdyMatch[2].padStart(2, '0');
    const day = mdyMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes member status.
 */
export function normalizeStatus(rawStatus: string): MemberStatus {
  if (!rawStatus) return 'active';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'inactive' || s === 'নিষ্ক্রিয়') return 'inactive';
  if (s === 'suspended' || s === 'সাময়িক বরখাস্ত' || s === 'স্থগিত') return 'suspended';
  return 'active';
}

/**
 * Parses and validates CSV data for bulk importing members.
 */
export function parseAndValidateMembersCSV(
  csvText: string,
  existingMembers: Member[]
): CSVValidationResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      totalRows: 0,
      validMembers: [],
      errors: [{ rowNumber: 0, field: 'file', message: 'সিএসভি ফাইলটি খালি অথবা সঠিক ফরম্যাটে নেই।' }],
      warnings: [],
    };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeaderName);

  // Check required columns: name and phone
  const nameColIdx = normalizedHeaders.indexOf('nameBn');
  const phoneColIdx = normalizedHeaders.indexOf('phone');

  if (nameColIdx === -1 && phoneColIdx === -1) {
    return {
      totalRows: 0,
      validMembers: [],
      errors: [
        {
          rowNumber: 1,
          field: 'headers',
          message: 'সিএসভি ফাইলে আবশ্যক কলাম "নাম (Name)" ও "মোবাইল (Phone)" পাওয়া যায়নি। অনুগ্রহ করে নমুনা টেমপ্লেট ব্যবহার করুন।',
        },
      ],
      warnings: [],
    };
  }

  const idColIdx = normalizedHeaders.indexOf('memberId');
  const addressColIdx = normalizedHeaders.indexOf('address');
  const dateColIdx = normalizedHeaders.indexOf('joiningDate');
  const statusColIdx = normalizedHeaders.indexOf('status');
  const positionColIdx = normalizedHeaders.indexOf('position');
  const emergencyColIdx = normalizedHeaders.indexOf('emergencyContact');
  const emailColIdx = normalizedHeaders.indexOf('linkedEmail');
  const notesColIdx = normalizedHeaders.indexOf('notes');

  const validMembers: CSVValidatedMember[] = [];
  const errors: CSVRowError[] = [];
  const warnings: CSVRowError[] = [];

  // Track existing IDs & phones to check duplicates
  const existingIds = new Set(existingMembers.map((m) => m.memberId.toUpperCase()));
  const existingPhoneDigits = new Set(
    existingMembers.map((m) => normalizePhoneNumber(m.phone)).filter(Boolean)
  );

  // Track seen in current CSV to avoid internal duplicates
  const seenIdsInCSV = new Set<string>();
  const seenPhonesInCSV = new Set<string>();

  // Collect all IDs to calculate next sequence numbers if auto-generating
  const allCurrentIds = [...existingMembers.map((m) => m.memberId)];

  const dataRows = rows.slice(1);

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-indexed including header row

    // Skip completely empty rows
    if (row.every((cell) => !cell || cell.trim() === '')) {
      return;
    }

    const rawName = nameColIdx !== -1 ? row[nameColIdx] : '';
    const rawPhone = phoneColIdx !== -1 ? row[phoneColIdx] : '';
    const rawId = idColIdx !== -1 ? row[idColIdx] : '';
    const rawAddress = addressColIdx !== -1 ? row[addressColIdx] : '';
    const rawDate = dateColIdx !== -1 ? row[dateColIdx] : '';
    const rawStatus = statusColIdx !== -1 ? row[statusColIdx] : '';
    const rawPosition = positionColIdx !== -1 ? row[positionColIdx] : '';
    const rawEmergency = emergencyColIdx !== -1 ? row[emergencyColIdx] : '';
    const rawEmail = emailColIdx !== -1 ? row[emailColIdx] : '';
    const rawNotes = notesColIdx !== -1 ? row[notesColIdx] : '';

    let rowHasError = false;

    // 1. Name validation
    if (!rawName || rawName.trim().length === 0) {
      errors.push({
        rowNumber,
        field: 'nameBn',
        message: 'সদস্যের নাম খালি থাকতে পারে না।',
      });
      rowHasError = true;
    }

    // 2. Phone validation
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      errors.push({
        rowNumber,
        field: 'phone',
        message: 'মোবাইল নম্বর প্রদান করা আবশ্যক।',
      });
      rowHasError = true;
    } else if (normalizedPhone.length < 10 || normalizedPhone.length > 14) {
      errors.push({
        rowNumber,
        field: 'phone',
        message: `মোবাইল নম্বর "${rawPhone}" সঠিক নয় (১০ থেকে ১৪ ডিজিট হতে হবে)।`,
      });
      rowHasError = true;
    } else if (seenPhonesInCSV.has(normalizedPhone)) {
      errors.push({
        rowNumber,
        field: 'phone',
        message: `মোবাইল নম্বর "${rawPhone}" এই সিএসভি ফাইলের অন্য একটি সারিতে ইতিমধ্যে রয়েছে (অভ্যন্তরীণ ডুপ্লিকেট)।`,
      });
      rowHasError = true;
    }

    // 3. Member ID validation / Auto-generation
    let finalMemberId = rawId ? rawId.trim().toUpperCase() : '';
    if (finalMemberId) {
      if (existingIds.has(finalMemberId)) {
        errors.push({
          rowNumber,
          field: 'memberId',
          message: `সদস্য আইডি "${finalMemberId}" ইতিমধ্যে সিস্টেমে বিদ্যমান।`,
        });
        rowHasError = true;
      } else if (seenIdsInCSV.has(finalMemberId)) {
        errors.push({
          rowNumber,
          field: 'memberId',
          message: `সদস্য আইডি "${finalMemberId}" এই ফাইলেই ডুপ্লিকেট রয়েছে।`,
        });
        rowHasError = true;
      }
    } else {
      // Auto-generate sequential ID
      finalMemberId = generateNextMemberId(allCurrentIds);
      allCurrentIds.push(finalMemberId);
    }

    // 4. Duplicate phone against existing database (warning or confirmation)
    let isDuplicatePhoneWarning = false;
    let warningMessage: string | undefined;
    if (!rowHasError && normalizedPhone && existingPhoneDigits.has(normalizedPhone)) {
      const existingMember = existingMembers.find(
        (m) => normalizePhoneNumber(m.phone) === normalizedPhone
      );
      warningMessage = `এই নম্বরটি সিস্টেমে ${existingMember?.nameBn || 'অন্য সদস্য'} (${existingMember?.memberId})-এর সাথে মিল রয়েছে।`;
      warnings.push({
        rowNumber,
        field: 'phone',
        message: warningMessage,
      });
      isDuplicatePhoneWarning = true;
    }

    if (!rowHasError) {
      seenIdsInCSV.add(finalMemberId);
      seenPhonesInCSV.add(normalizedPhone);

      validMembers.push({
        rowNumber,
        member: {
          memberId: finalMemberId,
          nameBn: rawName.trim(),
          phone: rawPhone.trim(),
          address: rawAddress.trim() || 'সরকারপাড়া',
          joiningDate: normalizeDate(rawDate),
          status: normalizeStatus(rawStatus),
          position: rawPosition.trim() || 'সাধারণ সদস্য',
          emergencyContact: rawEmergency.trim() || '',
          linkedEmail: rawEmail.trim() || undefined,
          notes: rawNotes.trim() || '',
        },
        isDuplicatePhoneWarning,
        warningMessage,
      });
    }
  });

  return {
    totalRows: dataRows.length,
    validMembers,
    errors,
    warnings,
  };
}

/**
 * Generates and downloads a clean UTF-8 CSV containing members data.
 * Prepends UTF-8 BOM (\uFEFF) so Bengali characters display properly in Excel.
 */
export function exportMembersToCSV(
  membersToExport: Member[],
  filenamePrefix = 'SPWA_Members'
): void {
  const headers = [
    'সদস্য আইডি (Member ID)',
    'পূর্ণ নাম (Name)',
    'মোবাইল নম্বর (Phone)',
    'ঠিকানা (Address)',
    'পদবী (Position)',
    'স্থিতি (Status)',
    'যোগদানের তারিখ (Joining Date)',
    'জরুরি যোগাযোগ (Emergency Contact)',
    'ইমেইল (Email)',
    'মন্তব্য (Notes)',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = membersToExport.map((m) => [
    escapeCSV(m.memberId),
    escapeCSV(m.nameBn),
    escapeCSV(m.phone),
    escapeCSV(m.address),
    escapeCSV(m.position),
    escapeCSV(STATUS_LABELS_BN[m.status] || m.status),
    escapeCSV(m.joiningDate),
    escapeCSV(m.emergencyContact || ''),
    escapeCSV(m.linkedEmail || ''),
    escapeCSV(m.notes || ''),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel Bengali support
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample blank/template CSV file that admins can fill up.
 */
export function downloadSampleMembersCSV(): void {
  const headers = [
    'সদস্য নম্বর (Member ID)',
    'পূর্ণ নাম (Name)',
    'মোবাইল নম্বর (Phone)',
    'ঠিকানা (Address)',
    'পদবী (Position)',
    'স্থিতি (Status)',
    'যোগদানের তারিখ (Joining Date)',
    'জরুরি যোগাযোগ (Emergency Contact)',
    'ইমেইল (Email)',
    'মন্তব্য (Notes)',
  ];

  const sampleRows = [
    [
      'MEM-0010',
      'মোঃ রফিকুল ইসলাম',
      '01712-345678',
      'সরকারপাড়া, দুর্গাপুর, উলিপুর',
      'সাধারণ সদস্য',
      'সক্রিয়',
      '2026-05-05',
      '01700-112233 (ভাই)',
      'rafiq@example.com',
      'সমাজকল্যাণ কর্মী',
    ],
    [
      '', // Auto-assigned if blank
      'মোঃ তারেক রহমান',
      '01812-987654',
      'মধ্য সরকারপাড়া',
      'সাধারণ সদস্য',
      'সক্রিয়',
      '2026-05-10',
      '',
      '',
      '',
    ],
  ];

  const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const csvContent =
    '\uFEFF' +
    [
      headers.join(','),
      ...sampleRows.map((r) => r.map(escapeCSV).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', 'SPWA_Member_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
