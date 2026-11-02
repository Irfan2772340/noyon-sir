import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installPWA } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      {isInstallable && (
        <button
          onClick={installPWA}
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition transform active:scale-95 animate-pulse"
          title="অ্যান্ড্রয়েড / ডেস্কটপ অ্যাপ ইনস্টল করুন"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>অ্যাপ ইনস্টল</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSModal(true)}
          className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-2.5 py-1 rounded-lg text-[11px] shadow-xs transition"
          title="আইফোন / আইপ্যাডে হোমস্ক্রিনে যোগ করুন"
        >
          <Download className="w-3.5 h-3.5" />
          <span>আইওএস অ্যাপ</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-800 shadow-xl space-y-3 font-['Hind_Siliguri',sans-serif]">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-emerald-900 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>আইফোনে অ্যাপ ইনস্টল করুন</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              সাফারি ব্রাউজারে নিচের নির্দেশিকা অনুসরণ করে সরাসরি হোমস্ক্রিনে অ্যাপ আইকন যোগ করতে পারেন:
            </p>
            <ol className="text-xs space-y-2 text-slate-700 list-decimal list-inside bg-slate-50 p-3 rounded-xl">
              <li>সাফারির নিচের মেনু থেকে <strong>Share বাটন (বর্গাকার তীর আইকন)</strong> চাপুন।</li>
              <li>স্ক্রোল করে <strong>"Add to Home Screen"</strong> নির্বাচন করুন।</li>
              <li>উপরে ডানপাশে <strong>"Add"</strong> বাটনে চাপ দিন।</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              বুঝেছি (ঠিক আছে)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
