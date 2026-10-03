import React, { useEffect } from 'react';
import { Settings, ArrowUpRight } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('rs_admin_token');

  useEffect(() => {
    if (!token) {
      window.location.href = 'http://localhost:5173/';
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF6F8] font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 text-center max-w-sm w-full space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-[#821D38] rounded-2xl flex items-center justify-center mx-auto">
            <Settings className="w-6 h-6 text-[#821D38] animate-spin" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Redirecting to RS Gifts...</h2>
          <p className="text-xs text-neutral-500">
            Please log in with administrator credentials on the main store portal.
          </p>
          <a
            href="http://localhost:5173/"
            className="inline-flex items-center gap-1 px-5 py-2 rounded-xl bg-[#821D38] text-white text-xs font-bold hover:bg-[#6e162e] transition-colors"
          >
            <span>Go to Storefront</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
