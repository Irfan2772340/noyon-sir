import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Announcement } from '../types';
import { toBengaliDigits } from '../utils/bengali';
import { addAnnouncement } from '../services/db';
import { Megaphone, Plus, Search, Calendar, User, Tag, X, AlertCircle } from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements }) => {
  const { user, isAdmin, adminProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('সাধারণ');
  const [authorName, setAuthorName] = useState(
    adminProfile?.name || user?.displayName || 'সাধারণ সম্পাদক'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredAnnouncements = announcements.filter((a) => {
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('শিরোনাম এবং নোটিশের বিষয়বস্তু আবশ্যক।');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category,
        publishedAt: new Date().toISOString().split('T')[0],
        publishedBy: user?.uid || 'admin',
        authorName: authorName.trim(),
      });
      setIsAddOpen(false);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
      setErrorMsg('বিজ্ঞপ্তি প্রকাশে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-amber-600" />
            <span>অফিসিয়াল বিজ্ঞপ্তি ফলক (Notice Board)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            সংগঠনের সাধারণ সভা, সিদ্ধান্ত ও চাঁদা সংক্রান্ত প্রাতিষ্ঠানিক নোটিশ
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিজ্ঞপ্তি প্রকাশ করুন</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="বিজ্ঞপ্তি খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">ক্যাটাগরি:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">সকল বিজ্ঞপ্তি</option>
            <option value="সভা">সাধারণ সভা (Meeting)</option>
            <option value="চাঁদা তাগিদ">চাঁদা তাগিদ (Reminder)</option>
            <option value="জরুরি">জরুরি নোটিশ (Urgent)</option>
            <option value="সাধারণ">সাধারণ নোটিশ (General)</option>
          </select>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            কোন নোটিশ পাওয়া যায়নি।
          </div>
        ) : (
          filteredAnnouncements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{toBengaliDigits(a.publishedAt)}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{a.authorName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {a.category}
                </span>
              </div>

              <div className="mt-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {a.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Notice Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-emerald-700" />
                <span>নতুন বিজ্ঞপ্তি প্রকাশ করুন</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs sm:text-sm">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিজ্ঞপ্তির শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাসিক চাঁদা পরিশোধ ও সাধারণ সভা প্রসঙ্গে..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ধরণ / ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="সাধারণ">সাধারণ নোটিশ</option>
                    <option value="সভা">কার্যকরী সাধারণ সভা</option>
                    <option value="চাঁদা তাগিদ">চাঁদা তাগিদ</option>
                    <option value="জরুরি">জরুরি ঘোষণা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রকাশকের নাম/পদবী</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিজ্ঞপ্তির বিস্তারিত বিষয়বস্তু *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="বিজ্ঞপ্তির পূর্ণ বিবরণ লিখুন..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'প্রকাশ হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
