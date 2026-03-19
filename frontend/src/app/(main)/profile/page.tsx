'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const ACCENT = "#FFD84D";

// ── Icons as components ─────────────────────────────────────────────────────
const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6.09-6.09 19.79 19.79 0 01-3.07-8.68A2 2 0 012 .93h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5.34" />
    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const LogOutIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TicketIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a2 2 0 00-2-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 000 4v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 002-2z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

// ── Password strength indicator ─────────────────────────────────────────────
const PasswordStrength = ({ password }: { password: string }) => {
  const { isDarkTheme } = useTheme();
  
  const getStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  
  const strength = getStrength(password);
  const strengthColors = ["", "#ef4444", "#f97316", ACCENT, "#22c55e"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  
  if (!password) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2 overflow-hidden"
    >
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(l => (
          <motion.div
            key={l}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: l * 0.06 }}
            className="h-1 rounded-full flex-1 origin-left"
            style={{ 
              background: l <= strength ? strengthColors[strength] : (isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,17,0.1)')
            }}
          />
        ))}
      </div>
      <span className="text-xs font-bold tracking-wider" style={{ color: strengthColors[strength] }}>
        {strengthLabels[strength]}
      </span>
    </motion.div>
  );
};

// ── Stat Card Component ─────────────────────────────────────────────────────
const StatCard = ({ number, label }: { number: string; label: string }) => {
  const { isDarkTheme } = useTheme();
  
  return (
    <div className={`px-4 py-3 rounded-xl text-center backdrop-blur-sm ${
      isDarkTheme ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <div className="text-xl font-black leading-none" style={{ color: ACCENT }}>{number}</div>
      <div className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${
        isDarkTheme ? 'text-white/50' : 'text-black/50'
      }`}>{label}</div>
    </div>
  );
};

// ── Input Field Component ───────────────────────────────────────────────────
const InputField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  icon: Icon,
  placeholder,
  required = false,
  autoComplete,
  disabled = false
}: { 
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ElementType;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) => {
  const { isDarkTheme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      <label className={`block text-xs font-bold tracking-widest uppercase mb-2 transition-colors duration-200 ${
        focused ? 'text-[#FFD84D]' : isDarkTheme ? 'text-white/35' : 'text-black/45'
      }`}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            focused ? 'text-[#FFD84D]' : isDarkTheme ? 'text-white/35' : 'text-black/45'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm tracking-wide rounded-2xl outline-none transition-all duration-200 ${
            Icon ? 'pl-12' : ''
          } ${
            isDarkTheme 
              ? 'text-white bg-white/4 border' 
              : 'text-black bg-black/4 border'
          } ${
            focused
              ? isDarkTheme 
                ? 'border-[#FFD84D]/50 bg-[#FFD84D]/6' 
                : 'border-[#FFD84D]/55 bg-[#FFD84D]/7'
              : isDarkTheme 
                ? 'border-white/10' 
                : 'border-black/12'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
};

// ── Password Field Component ─────────────────────────────────────────────────
const PasswordField = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  showStrength = false
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showStrength?: boolean;
}) => {
  const { isDarkTheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      <label className={`block text-xs font-bold tracking-widest uppercase mb-2 transition-colors duration-200 ${
        focused ? 'text-[#FFD84D]' : isDarkTheme ? 'text-white/35' : 'text-black/45'
      }`}>
        {label}
      </label>
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
          focused ? 'text-[#FFD84D]' : isDarkTheme ? 'text-white/35' : 'text-black/45'
        }`}>
          <LockIcon className="w-4 h-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pl-12 text-sm tracking-wide rounded-2xl outline-none transition-all duration-200 ${
            isDarkTheme 
              ? 'text-white bg-white/4 border' 
              : 'text-black bg-black/4 border'
          } ${
            focused
              ? isDarkTheme 
                ? 'border-[#FFD84D]/50 bg-[#FFD84D]/6' 
                : 'border-[#FFD84D]/55 bg-[#FFD84D]/7'
              : isDarkTheme 
                ? 'border-white/10' 
                : 'border-black/12'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 ${
            isDarkTheme ? 'text-white/30' : 'text-black/35'
          } hover:opacity-70 transition-opacity`}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {showStrength && <PasswordStrength password={value} />}
    </div>
  );
};

// ── Submit Button ───────────────────────────────────────────────────────────
const SubmitButton = ({ label, loading }: { label: string; loading: boolean }) => {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
      style={{ 
        backgroundColor: ACCENT,
        color: '#000',
        boxShadow: '0 8px 32px rgba(255,216,77,0.25)'
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
        />
      ) : (
        <>{label} <span className="text-lg">→</span></>
      )}
    </motion.button>
  );
};

// ── Main Profile Page ───────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { isDarkTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Convert empty phone string to undefined to match backend COALESCE behavior
      const profileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || undefined,
      };
      
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        await refreshUser();
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (response.success) {
        setIsChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'Password changed successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F0]'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <p className={`mb-6 ${isDarkTheme ? 'text-white/40' : 'text-black/50'}`}>
            Please log in to view your profile
          </p>
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase"
              style={{ backgroundColor: ACCENT, color: '#000' }}
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F0]'
    }`}>
      {/* Background decorative elements */}
      <div className="fixed inset-0 flex justify-between items-start pointer-events-none">
        <div className="w-64 h-64 rounded-full opacity-5 ml-10 mt-20"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
        />
        <div className="w-96 h-96 rounded-full opacity-5 mr-10 mb-20 self-end"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: ACCENT }}
            >
              <Heart className="w-6 h-6 text-black" />
            </div>
            <div className="flex flex-col">
              <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${
                isDarkTheme ? 'text-white' : 'text-black'
              }`}>
                My Profile
              </h1>
              <p className={`text-sm mt-1 ${
                isDarkTheme ? 'text-white/40' : 'text-black/50'
              }`}>
                Manage your account information and settings
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alert Message */}
        <div className="flex flex-col w-full mb-8">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`w-full p-4 rounded-xl border ${
                  message.type === 'success'
                    ? isDarkTheme
                      ? 'bg-green-900/20 border-green-500/30 text-green-400'
                      : 'bg-green-50 border-green-200 text-green-700'
                    : isDarkTheme
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Information - Left Column */}
          <div className="flex-1 lg:flex-2 flex flex-col space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-3xl border overflow-hidden ${
                isDarkTheme 
                  ? 'bg-[#111111] border-white/10' 
                  : 'bg-white border-black/10'
              }`}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-xl font-black tracking-tight ${
                    isDarkTheme ? 'text-white' : 'text-black'
                  }`}>
                    Profile Information
                  </h2>
                  {!isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-wider transition-colors"
                      style={{ 
                        backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDarkTheme ? 'white' : 'black'
                      }}
                    >
                      <EditIcon className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="flex flex-col space-y-8">
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${ACCENT}20` }}
                      >
                        <UserIcon className="w-10 h-10 text-accent" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className={`text-2xl font-black ${
                          isDarkTheme ? 'text-white' : 'text-black'
                        }`}>
                          {user.first_name} {user.last_name}
                        </h3>
                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase w-fit"
                          style={{ 
                            backgroundColor: `${ACCENT}20`,
                            color: ACCENT
                          }}
                        >
                          {user.role || user.roles?.[0] || 'Member'}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t"
                      style={{ borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                          <MailIcon className="w-5 h-5 text-accent"/>
                        </div>
                        <div className="flex flex-col">
                          <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${
                            isDarkTheme ? 'text-white/40' : 'text-black/40'
                          }`}>
                            Email
                Admin          </p>
                          <p className={`text-sm font-medium ${
                            isDarkTheme ? 'text-white' : 'text-black'
                          }`}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                          <PhoneIcon className="w-5 h-5 text-accent"/>
                        </div>
                        <div className="flex flex-col">
                          <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${
                            isDarkTheme ? 'text-white/40' : 'text-black/40'
                          }`}>
                            Phone
                          </p>
                          <p className={`text-sm font-medium ${
                            isDarkTheme ? 'text-white' : 'text-black'
                          }`}>
                            {user.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                          <CalendarIcon className="w-5 h-5 text-accent"  />
                        </div>
                        <div className="flex flex-col">
                          <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${
                            isDarkTheme ? 'text-white/40' : 'text-black/40'
                          }`}>
                            Member Since
                          </p>
                          <p className={`text-sm font-medium ${
                            isDarkTheme ? 'text-white' : 'text-black'
                          }`}>
                            {new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                          <ShieldIcon className="w-5 h-5 text-accent"/>
                        </div>
                        <div className="flex flex-col">
                          <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${
                            isDarkTheme ? 'text-white/40' : 'text-black/40'
                          }`}>
                            Status
                          </p>
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full w-fit ${
                            user.is_active
                              ? isDarkTheme
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-green-50 text-green-700'
                              : isDarkTheme
                                ? 'bg-red-900/30 text-red-400'
                                : 'bg-red-50 text-red-600'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="flex flex-col space-y-5">
                    <InputField
                      label="First Name"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      icon={UserIcon}
                      placeholder="John"
                      required
                    />
                    
                    <InputField
                      label="Last Name"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      icon={UserIcon}
                      placeholder="Doe"
                      required
                    />
                    
                    <InputField
                      label="Phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      icon={PhoneIcon}
                      placeholder="+251 91 123 4567"
                    />
                    
                    <InputField
                      label="Email"
                      value={user.email}
                      onChange={() => {}}
                      icon={MailIcon}
                      disabled
                    />

                    <div className="flex gap-4 pt-4">
                      <SubmitButton label="Save Changes" loading={loading} />
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            firstName: user.first_name,
                            lastName: user.last_name,
                            phone: user.phone || '',
                          });
                        }}
                        className="px-8 py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors"
                        style={{ 
                          backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: isDarkTheme ? 'white' : 'black'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>


          </div>

          {/* Right Column - Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1 flex flex-col space-y-6"
          >
            {/* Quick Actions */}
            <div className={`rounded-3xl border overflow-hidden ${
              isDarkTheme 
                ? 'bg-[#111111] border-white/10' 
                : 'bg-white border-black/10'
            }`}>
              <div className="p-8">
                <h2 className={`text-xl font-black tracking-tight mb-6 ${
                  isDarkTheme ? 'text-white' : 'text-black'
                }`}>
                  Quick Actions
                </h2>
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <div className={`p-3 rounded-xl ${
                      isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      <LockIcon className="w-5 h-5 text-accent"/>
                    </div>
                    <span className={`flex-1 text-left font-bold ${
                      isDarkTheme ? 'text-white' : 'text-black'
                    }`}>
                      Change Password
                    </span>
                    <span className="text-lg" style={{ color: ACCENT }}>→</span>
                  </button>

                  <Link href="/my-bookings" className="w-full">
                    <button
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:scale-[1.02]"
                      style={{ 
                        backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className={`p-3 rounded-xl ${
                        isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                      }`}>
                        <TicketIcon className="w-5 h-5 text-accent"/>
                      </div>
                      <span className={`flex-1 text-left font-bold ${
                        isDarkTheme ? 'text-white' : 'text-black'
                      }`}>
                        My Bookings
                      </span>
                      <span className="text-lg" style={{ color: ACCENT }}>→</span>
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:scale-[1.02] group"
                    style={{ 
                      backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <div className={`p-3 rounded-xl ${
                      isDarkTheme ? 'bg-white/5' : 'bg-black/5'
                    } group-hover:bg-red-500/10 transition-colors`}>
                      <LogOutIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="flex-1 text-left font-bold text-red-500">
                      Logout
                    </span>
                    <span className="text-lg text-red-500">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className={`rounded-3xl border overflow-hidden ${
              isDarkTheme 
                ? 'bg-[#111111] border-white/10' 
                : 'bg-white border-black/10'
            }`}>
              <div className="p-8">
                <h2 className={`text-xl font-black tracking-tight mb-6 ${
                  isDarkTheme ? 'text-white' : 'text-black'
                }`}>
                  Account Summary
                </h2>
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center py-3 border-b"
                    style={{ borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  >
                    <span className={`text-sm ${
                      isDarkTheme ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Account Type
                    </span>
                    <span className={`text-sm font-black capitalize ${
                      isDarkTheme ? 'text-white' : 'text-black'
                    }`}>
                      {user.role || user.roles?.[0] || 'Member'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b"
                    style={{ borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  >
                    <span className={`text-sm ${
                      isDarkTheme ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Member ID
                    </span>
                    <span className={`text-sm font-mono font-bold ${
                      isDarkTheme ? 'text-white' : 'text-black'
                    }`}>
                      #{user.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className={`text-sm ${
                      isDarkTheme ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Joined
                    </span>
                    <span className={`text-sm font-bold ${
                      isDarkTheme ? 'text-white' : 'text-black'
                    }`}>
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangingPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsChangingPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className={`max-w-md w-full rounded-3xl border overflow-hidden ${
                isDarkTheme 
                  ? 'bg-[#111111] border-white/10' 
                  : 'bg-white border-black/10'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-xl font-black tracking-tight ${
                    isDarkTheme ? 'text-white' : 'text-black'
                  }`}>
                    Change Password
                  </h2>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className={`p-2 rounded-xl transition-colors ${
                      isDarkTheme 
                        ? 'hover:bg-white/10 text-white/60' 
                        : 'hover:bg-black/10 text-black/60'
                    }`}
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="flex flex-col space-y-5">
                  <PasswordField
                    label="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                  />

                  <PasswordField
                    label="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    showStrength
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />

                  <div className="flex gap-4 pt-4">
                    <SubmitButton label="Update Password" loading={loading} />
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-8 py-4 rounded-2xl text-sm font-bold tracking-wider transition-colors"
                      style={{ 
                        backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDarkTheme ? 'white' : 'black'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}