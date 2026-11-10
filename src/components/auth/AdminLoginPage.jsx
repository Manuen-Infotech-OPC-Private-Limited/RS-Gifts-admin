import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import apiClient from '../../services/api';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated as admin, jump straight to admin dashboard
  useEffect(() => {
    const existingToken = localStorage.getItem('rs_admin_token');
    if (existingToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/admin/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      if (!token) {
        throw new Error('Authentication succeeded but no token was provided.');
      }

      // Store admin authentication
      localStorage.setItem('rs_admin_token', token);
      if (user) {
        localStorage.setItem('rs_admin_user', JSON.stringify(user));
      }

      // Navigate to admin dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Admin login failed:', err);
      const msg =
        err.response?.data?.message ||
        err.formattedMessage ||
        err.message ||
        'Unable to log in. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#FAF6F8] via-[#F4ECEF] to-[#EBDDE3] p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100/80 overflow-hidden backdrop-blur-sm p-8 space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="group space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-600 group-focus-within:text-[#821D38] tracking-wide transition-colors">
              Admin Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-[#821D38] transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rsgifts.com"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50/50 text-[#821D38] caret-[#821D38] placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-0 focus:border-[#821D38] focus:bg-white transition-all disabled:opacity-60"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="group space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-600 group-focus-within:text-[#821D38] tracking-wide transition-colors">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-[#821D38] transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50/50 text-[#821D38] caret-[#821D38] placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-0 focus:border-[#821D38] focus:bg-white transition-all disabled:opacity-60"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-[#821D38] transition-colors cursor-pointer"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember session */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-neutral-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 text-[#821D38] focus:ring-0 w-3.5 h-3.5 accent-[#821D38]"
              />
              <span>Remember session</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#821D38] hover:bg-[#6c162d] active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-[#821D38]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
