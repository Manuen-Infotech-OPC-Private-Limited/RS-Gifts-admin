import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export const AdminLoginPage = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:5173/';
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF6F8] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-100 p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-[#821D38] rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-[#821D38]" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Redirecting to RS Gifts...</h2>
        <p className="text-xs text-neutral-500">
          All administrator and customer accounts log in securely via the RS Gifts Storefront.
        </p>
        <a
          href="http://localhost:5173/"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#821D38] text-white text-xs font-bold hover:bg-[#6e162e] transition-colors"
        >
          Go to Storefront ↗
        </a>
      </div>
    </div>
  );
};

export default AdminLoginPage;
