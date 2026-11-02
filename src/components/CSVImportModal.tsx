import React, { useState, useRef } from 'react';
import { Member } from '../types';
import {
  parseAndValidateMembersCSV,
  downloadSampleMembersCSV,
  CSVValidationResult,
} from '../utils/csv';
import { toBengaliDigits, STATUS_LABELS_BN } from '../utils/bengali';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  RefreshCw,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportSuccess: (importedMembers: Omit<Member, 'id'>[]) => Promise<void>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importCompletedCount, setImportCompletedCount] = useState<number | null>(null);
  const [importError, setImportError] = useState('');
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFileName('');
    setValidationResult(null);
    setIsProcessingFile(false);
    setIsImporting(false);
    setImportCompletedCount(null);
    setImportError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('অনুগ্রহ করে শুধুমাত্র .csv ফরম্যাটের ফাইল নির্বাচন করুন।');
      return;
    }

    setIsProcessingFile(true);
    setSelectedFileName(file.name);
    setImportError('');
    setImportCompletedCount(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseAndValidateMembersCSV(text, existingMembers);
        setValidationResult(result);
        if (result.errors.length > 0 && result.validMembers.length === 0) {
          setActiveTab('errors');
        } else {
          setActiveTab('valid');
        }
      } catch (err: any) {
        setImportError(err.message || 'সিএসভি ফাইলটি প্রক্রিয়া করতে ত্রুটি হয়েছে।');
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      setImportError('ফাইলটি পড়তে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setIsProcessingFile(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validMembers.length === 0) return;

    try {
      setIsImporting(true);
      setImportError('');
      const membersToImport = validationResult.validMembers.map((v) => v.member);
      await onImportSuccess(membersToImport);
      setImportCompletedCount(membersToImport.length);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'সদস্য তথ্য ইমপোর্টে ত্রুটি হয়েছে।');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-['Hind_Siliguri',sans-serif]">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center space-x-2">
                <span>সিএসভি (CSV) ফাইল থেকে সদস্য ইমপোর্ট</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                একসাথে একাধিক সদস্যের নাম, ফোন, ঠিকানা ও যোগদানের তারিখ দ্রুত অন্তর্ভুক্ত করুন
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Success Banner if Completed */}
          {importCompletedCount !== null ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">
                অভিনন্দন! {toBengaliDigits(importCompletedCount)} জন সদস্য সফলভাবে অন্তর্ভুক্ত হয়েছে
              </h4>
              <p className="text-xs text-emerald-700">
                সদস্য তালিকা ও ডেটাবেজে নতুন তথ্য সংযুক্ত করা হয়েছে।
              </p>
            </div>
          ) : (
            <>
              {/* Sample Template Download Bar */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    সঠিক কলাম ফরম্যাটের জন্য আমাদের তৈরি <strong>নমুনা CSV টেমপ্লেট</strong> ব্যবহার করুন।
                  </span>
                </div>
                <button
                  onClick={downloadSampleMembersCSV}
                  className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>নমুনা CSV টেমপ্লেট ডাউনলোড</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!validationResult ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/60'
                      : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
                      {isProcessingFile ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {isProcessingFile
                          ? 'ফাইলটি যাচাই করা হচ্ছে...'
                          : 'সিএসভি ফাইল ড্রপ করুন অথবা নির্বাচন করতে ক্লিক করুন'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        সাপোর্টেড ফরম্যাট: .csv (Microsoft Excel বা Google Sheets থেকে Export কৃত)
                      </p>
                    </div>
                    <span className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>ফাইল ব্রাউজ করুন</span>
                    </span>
                  </label>
                </div>
              ) : (
                /* Validation & Preview Section */
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="text-[11px] text-slate-500 font-medium">ফাইলের নাম</div>
                      <div className="text-xs font-bold text-slate-800 truncate mt-0.5" title={selectedFileName}>
                        {selectedFileName}
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>সঠিক রেকর্ড</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-900 mt-0.5">
                        {toBengaliDigits(validationResult.validMembers.length)} জন
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      validationResult.errors.length > 0
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`text-[11px] font-medium flex items-center justify-center space-x-1 ${
                        validationResult.errors.length > 0 ? 'text-rose-700' : 'text-slate-500'
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ত্রুটিযুক্ত সারি</span>
                      </div>
                      <div className={`text-lg font-bold mt-0.5 ${
                        validationResult.errors.length > 0 ? 'text-rose-900' : 'text-slate-800'
                      }`}>
                        {toBengaliDigits(validationResult.errors.length)} টি
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      validationResult.warnings.length > 0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`text-[11px] font-medium flex items-center justify-center space-x-1 ${
                        validationResult.warnings.length > 0 ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>সতর্কতা</span>
                      </div>
                      <div className={`text-lg font-bold mt-0.5 ${
                        validationResult.warnings.length > 0 ? 'text-amber-900' : 'text-slate-800'
                      }`}>
                        {toBengaliDigits(validationResult.warnings.length)} টি
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center justify-between border-b border-slate-200 pt-1">
                    <div className="flex space-x-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setActiveTab('valid')}
                        className={`pb-2 px-1 border-b-2 transition ${
                          activeTab === 'valid'
                            ? 'border-emerald-600 text-emerald-800'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        ইমপোর্টযোগ্য সদস্য ({toBengaliDigits(validationResult.validMembers.length)})
                      </button>

                      {validationResult.errors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('errors')}
                          className={`pb-2 px-1 border-b-2 transition flex items-center space-x-1 ${
                            activeTab === 'errors'
                              ? 'border-rose-600 text-rose-800'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>ত্রুটি বিবরণী ({toBengaliDigits(validationResult.errors.length)})</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-slate-500 hover:text-emerald-700 pb-2 flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>অন্য ফাইল নির্বাচন</span>
                    </button>
                  </div>

                  {/* Tab Content 1: Valid Members Table */}
                  {activeTab === 'valid' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {validationResult.validMembers.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          ইমপোর্ট করার মত কোন সঠিক রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে ত্রুটি ট্যাব দেখুন।
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-50 text-slate-700 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold">সদস্য আইডি</th>
                              <th className="px-3 py-2 text-left font-bold">নাম</th>
                              <th className="px-3 py-2 text-left font-bold">মোবাইল নম্বর</th>
                              <th className="px-3 py-2 text-left font-bold">ঠিকানা</th>
                              <th className="px-3 py-2 text-left font-bold">পদবী</th>
                              <th className="px-3 py-2 text-center font-bold">স্থিতি</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {validationResult.validMembers.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono font-bold text-emerald-800">
                                  {item.member.memberId}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {item.member.nameBn}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                  {toBengaliDigits(item.member.phone)}
                                  {item.isDuplicatePhoneWarning && (
                                    <span
                                      className="ml-1 inline-block text-[10px] text-amber-700 bg-amber-100 px-1 rounded"
                                      title={item.warningMessage}
                                    >
                                      সিস্টেমে বিদ্যমান
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-slate-600 truncate max-w-[140px]">
                                  {item.member.address}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                  {item.member.position}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                                    {STATUS_LABELS_BN[item.member.status] || item.member.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Tab Content 2: Errors List */}
                  {activeTab === 'errors' && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {validationResult.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold text-rose-950">
                              {err.rowNumber > 0 ? `সারি ${toBengaliDigits(err.rowNumber)}:` : 'ফাইল সমস্যা:'}
                            </span>{' '}
                            <span>{err.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings Notice if any */}
                  {validationResult.warnings.length > 0 && activeTab === 'valid' && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>সতর্কতা:</strong> কিছু মোবাইল নম্বর ইতিমধ্যে সিস্টেমে থাকা সদস্যদের সাথে মিল রয়েছে। তবে এগুলো কোনো বাধাদানকারী ত্রুটি নয়, আপনি চাইলে ইমপোর্ট সম্পন্ন করতে পারবেন।
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Import Error if any */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-slate-500">
            {validationResult && validationResult.validMembers.length > 0 && (
              <span>
                ইমপোর্টের জন্য প্রস্তুত: <strong>{toBengaliDigits(validationResult.validMembers.length)} জন</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              বন্ধ করুন
            </button>

            {validationResult && validationResult.validMembers.length > 0 && importCompletedCount === null && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ইমপোর্ট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {validationResult.errors.length > 0
                        ? `শুধু সঠিক ${toBengaliDigits(validationResult.validMembers.length)} জন ইমপোর্ট করুন`
                        : `সকল ${toBengaliDigits(validationResult.validMembers.length)} জন ইমপোর্ট সম্পন্ন করুন`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
