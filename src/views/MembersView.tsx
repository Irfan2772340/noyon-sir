import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Member, MemberStatus } from '../types';
import { toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import { generateNextMemberId } from '../utils/calculations';
import { addMember, updateMember, addMultipleMembers } from '../services/db';
import {
  Users,
  Search,
  Plus,
  Filter,
  UserCheck,
  CreditCard,
  FileText,
  Edit2,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  X,
  Check,
  UserX,
  Shield,
  QrCode,
  Camera,
  Trash2,
  User,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { processImageFileToDataUrl } from '../utils/imageUpload';
import { exportMembersToCSV } from '../utils/csv';
import { CSVImportModal } from '../components/CSVImportModal';

interface MembersViewProps {
  members: Member[];
  onSelectMemberCard: (member: Member) => void;
  onSelectMemberStatement: (member: Member) => void;
  onSelectPayDues: (member: Member) => void;
  onSelectMemberQR: (member: Member) => void;
  onMembersChange?: (members: Member[]) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onSelectMemberCard,
  onSelectMemberStatement,
  onSelectPayDues,
  onSelectMemberQR,
  onMembersChange,
}) => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'date'>('id');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states for Add / Edit
  const [formMemberId, setFormMemberId] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<MemberStatus>('active');
  const [formPosition, setFormPosition] = useState('সাধারণ সদস্য');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLinkedEmail, setFormLinkedEmail] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const dataUrl = await processImageFileToDataUrl(file, 400, 0.85);
      setFormPhotoUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'ছবি আপলোডে সমস্যা হয়েছে।');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const openAddModal = () => {
    const nextId = generateNextMemberId(members.map((m) => m.memberId));
    setFormMemberId(nextId);
    setFormNameBn('');
    setFormPhone('');
    setFormAddress('সরকারপাড়া');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormStatus('active');
    setFormPosition('সাধারণ সদস্য');
    setFormEmergencyContact('');
    setFormNotes('');
    setFormLinkedEmail('');
    setFormPhotoUrl('');
    setPhoneWarning(null);
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormMemberId(member.memberId);
    setFormNameBn(member.nameBn);
    setFormPhone(member.phone);
    setFormAddress(member.address);
    setFormJoiningDate(member.joiningDate);
    setFormStatus(member.status);
    setFormPosition(member.position);
    setFormEmergencyContact(member.emergencyContact || '');
    setFormNotes(member.notes || '');
    setFormLinkedEmail(member.linkedEmail || '');
    setFormPhotoUrl(member.photoUrl || '');
    setPhoneWarning(null);
    setErrorMessage('');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formMemberId.trim() || !formNameBn.trim() || !formPhone.trim()) {
      setErrorMessage('সদস্য আইডি, নাম এবং মোবাইল নম্বর আবশ্যক।');
      return;
    }

    // 1. Duplicate ID validation for new member
    if (!editingMember) {
      const existsId = members.some(
        (m) => m.memberId.toLowerCase() === formMemberId.trim().toLowerCase()
      );
      if (existsId) {
        setErrorMessage('এই সদস্য আইডি (Member ID) ইতিমধ্যে ব্যবহৃত হয়েছে! অনুগ্রহ করে অন্য আইডি দিন।');
        return;
      }
    }

    // 2. Duplicate phone validation & confirmation
    const duplicatePhoneMember = members.find(
      (m) =>
        m.phone.replace(/[^0-9]/g, '') === formPhone.replace(/[^0-9]/g, '') &&
        (!editingMember || m.memberId !== editingMember.memberId)
    );

    if (duplicatePhoneMember && !phoneWarning) {
      setPhoneWarning(
        `সতর্কতা: এই মোবাইল নম্বরটি ইতিমধ্যে ${duplicatePhoneMember.nameBn} (${duplicatePhoneMember.memberId})-এর প্রোফাইলে বিদ্যমান। আপনি কি নিশ্চিত যে এটি সংরক্ষণ করবেন?`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingMember) {
        await updateMember(editingMember.memberId, {
          nameBn: formNameBn.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
          joiningDate: formJoiningDate,
          status: formStatus,
          position: formPosition.trim(),
          emergencyContact: formEmergencyContact.trim(),
          notes: formNotes.trim(),
          linkedEmail: formLinkedEmail.trim() || undefined,
          photoUrl: formPhotoUrl.trim() || undefined,
        });
        setEditingMember(null);
      } else {
        await addMember({
          memberId: formMemberId.trim(),
          nameBn: formNameBn.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
          joiningDate: formJoiningDate,
          status: formStatus,
          position: formPosition.trim(),
          emergencyContact: formEmergencyContact.trim(),
          notes: formNotes.trim(),
          linkedEmail: formLinkedEmail.trim() || undefined,
          photoUrl: formPhotoUrl.trim() || undefined,
        });
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('সদস্য তথ্য সংরক্ষণে ত্রুটি দেখা দিয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
      setPhoneWarning(null);
    }
  };

  // Export CSV respecting current filter and search
  const handleExportCSV = () => {
    exportMembersToCSV(
      sortedMembers,
      searchQuery || statusFilter !== 'all' ? 'SPWA_Filtered_Members' : 'SPWA_All_Members'
    );
  };

  // CSV Import Success Handler
  const handleCSVImportSuccess = async (importedList: Omit<Member, 'id'>[]) => {
    await addMultipleMembers(importedList);
    const newMembersList = [
      ...members,
      ...importedList.map((m) => ({ ...m, id: m.memberId })),
    ];
    onMembersChange?.(newMembersList);
    setToastMessage(
      `সিএসভি থেকে ${toBengaliDigits(importedList.length)} জন সদস্য সফলভাবে অন্তর্ভুক্ত করা হয়েছে!`
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filter & Sort
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      m.nameBn.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.address.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'id') return a.memberId.localeCompare(b.memberId);
    if (sortBy === 'name') return a.nameBn.localeCompare(b.nameBn);
    if (sortBy === 'date') return b.joiningDate.localeCompare(a.joiningDate);
    return 0;
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-lg border border-emerald-700 animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>সদস্য ব্যবস্থাপনা (Member Management)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট সদস্য: {toBengaliDigits(members.length)} জন (সক্রিয়:{' '}
            {toBengaliDigits(members.filter((m) => m.status === 'active').length)} জন)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            title="বর্তমান ফিল্টারকৃত তালিকা CSV ফাইল হিসেবে ডাউনলোড করুন"
            className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>CSV এক্সপোর্ট ({toBengaliDigits(sortedMembers.length)})</span>
          </button>

          {isAdmin ? (
            <>
              {/* CSV Import Button */}
              <button
                onClick={() => setIsCSVImportOpen(true)}
                className="inline-flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-2xs transition"
                title="সিএসভি ফাইল থেকে একযোগে একাধিক সদস্য ইমপোর্ট করুন"
              >
                <Upload className="w-4 h-4" />
                <span>CSV ইমপোর্ট</span>
              </button>

              {/* Add New Member Button */}
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যোগ</span>
              </button>
            </>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>যোগ ও সম্পাদনা অ্যাডমিনের জন্য সংরক্ষিত</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Real-time Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Real-time Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="নাম বা আইডি দিয়ে খুঁজুন (যেমন: আকবর, MEM-0001, মোবাইল)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                title="অনুসন্ধান মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল স্থিতি (All Status)</option>
              <option value="active">সক্রিয় সদস্য (Active)</option>
              <option value="inactive">নিষ্ক্রিয় সদস্য (Inactive)</option>
              <option value="suspended">সাময়িক বরখাস্ত (Suspended)</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="sm:col-span-3 flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">সাজান:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="id">সদস্য নম্বর অনুযায়ী (ID)</option>
              <option value="name">নামের বর্ণানুক্রমে (Name)</option>
              <option value="date">যোগদানের তারিখ (Date)</option>
            </select>
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span>ফিল্টার ফলাফল:</span>
                <span>{toBengaliDigits(sortedMembers.length)} জন সদস্য পাওয়া গেছে</span>
              </span>
              {searchQuery && (
                <span className="text-slate-500 text-[11px]">
                  (কীওয়ার্ড: &ldquo;{searchQuery}&rdquo;)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>সকল ফিল্টার মুছুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">সদস্য পরিচিতি</th>
                <th className="px-4 py-3 text-left font-semibold">মোবাইল ও ঠিকানা</th>
                <th className="px-4 py-3 text-center font-semibold">পদবী ও স্থিতি</th>
                <th className="px-4 py-3 text-left font-semibold">যোগদান</th>
                <th className="px-4 py-3 text-right font-semibold">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Search className="w-8 h-8 text-slate-300" />
                      <div className="text-sm font-semibold text-slate-600">
                        {searchQuery ? `"${searchQuery}" দিয়ে কোনো সদস্য পাওয়া যায়নি` : 'কোন সদস্যের তথ্য খুঁজে পাওয়া যায়নি'}
                      </div>
                      <p className="text-xs text-slate-400">
                        সদস্যের নাম বা আইডির সঠিক বানান অথবা ফিল্টার পরিবর্তন করে চেষ্টা করুন।
                      </p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          ফিল্টার মুছুন
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedMembers.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 border border-emerald-300">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.nameBn}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.nameBn.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {member.nameBn}
                          </div>
                          <div className="font-mono text-emerald-800 text-xs font-semibold">
                            {member.memberId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center space-x-1 font-medium text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{toBengaliDigits(member.phone)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-xs mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{member.address}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="font-semibold text-slate-800">{member.position}</div>
                      <span
                        className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          member.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.status === 'suspended'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {STATUS_LABELS_BN[member.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {toBengaliDigits(member.joiningDate)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* QR Code & Verification */}
                        <button
                          onClick={() => onSelectMemberQR(member)}
                          title="কিউআর কোড ও অনলাইন যাচাইকরণ"
                          className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100/70 transition border border-emerald-300 bg-emerald-50/60"
                        >
                          <QrCode className="w-4 h-4 text-emerald-700" />
                        </button>

                        {/* ID Card */}
                        <button
                          onClick={() => onSelectMemberCard(member)}
                          title="সদস্য পরিচয়পত্র প্রিন্ট"
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition border border-emerald-200"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Statement */}
                        <button
                          onClick={() => onSelectMemberStatement(member)}
                          title="হিসাব বিবরণী দেখুন"
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition border border-blue-200"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Pay Dues */}
                        {isAdmin && (
                          <button
                            onClick={() => onSelectPayDues(member)}
                            title="চাঁদা গ্রহণ করুন"
                            className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs transition"
                          >
                            চাঁদা আদায়
                          </button>
                        )}

                        {/* Edit */}
                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(member)}
                            title="সংশোধন করুন"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition border border-slate-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {(isAddModalOpen || editingMember) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>
                  {editingMember ? 'সদস্য তথ্য সংশোধন' : 'নতুন সদস্য নিবন্ধন'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-5 space-y-3.5 text-xs sm:text-sm">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {phoneWarning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-bold">সতর্কবার্তা:</p>
                    <p className="mt-0.5">{phoneWarning}</p>
                    <button
                      type="submit"
                      className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-md"
                    >
                      হ্যাঁ, সংরক্ষণ নিশ্চিত করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Member Photo Upload Field */}
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-600 bg-white overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                  {formPhotoUrl ? (
                    <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-800 text-xs mb-1">
                    সদস্যের ছবি (Member Photo)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'প্রসেস হচ্ছে...' : formPhotoUrl ? 'ছবি পরিবর্তন' : 'ছবি আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                      />
                    </label>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs border border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    আইডি কার্ড ও ডিজিটাল কিউআর ভেরিফিকেশনে প্রদর্শিত হবে
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    সদস্য নম্বর (Member ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMember}
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(e.target.value)}
                    placeholder="MEM-0001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      setPhoneWarning(null);
                    }}
                    placeholder="০১৭১২-৩৪৫৬৭৮"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পূর্ণ নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={formNameBn}
                  onChange={(e) => setFormNameBn(e.target.value)}
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পদবী
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="সাধারণ সদস্য">সাধারণ সদস্য</option>
                    <option value="সভাপতি">সভাপতি</option>
                    <option value="সহ-সভাপতি">সহ-সভাপতি</option>
                    <option value="সাধারণ সম্পাদক">সাধারণ সম্পাদক</option>
                    <option value="যুগ্ম সাধারণ সম্পাদক">যুগ্ম সাধারণ সম্পাদক</option>
                    <option value="কোষাধ্যক্ষ">কোষাধ্যক্ষ</option>
                    <option value="সাংগঠনিক সম্পাদক">সাংগঠনিক সম্পাদক</option>
                    <option value="উপদেষ্টা">উপদেষ্টা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    সদস্য স্থিতি (Status)
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                    <option value="suspended">সাময়িক বরখাস্ত (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="গ্রাম / পাড়া / ওয়ার্ড"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    যোগদানের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    জরুরি যোগাযোগ (নম্বর/সম্পর্ক)
                  </label>
                  <input
                    type="text"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    placeholder="০১৮১২-৩৪৫৬৭৮ (ভাই)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  লিঙ্কযুক্ত ইমেইল (সদস্যের নিজস্ব অ্যাকাউন্টে লগইনের জন্য ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  value={formLinkedEmail}
                  onChange={(e) => setFormLinkedEmail(e.target.value)}
                  placeholder="member@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  প্রশাসনিক নোট / মন্তব্য
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="সদস্য সম্পর্কিত বিশেষ তথ্য বা মন্তব্য..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportOpen}
        onClose={() => setIsCSVImportOpen(false)}
        existingMembers={members}
        onImportSuccess={handleCSVImportSuccess}
      />
    </div>
  );
};
