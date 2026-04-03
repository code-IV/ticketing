"use client"

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const ACCENT = "#FFD84D";

// ── BG images ────────────────────────────────────────────────────────────────
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1000&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
  "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=1000&q=80",
];

// ── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>) :
            (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>)}
  </svg>
);
const MailIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const LockIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const UserIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PhoneIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .93h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;

// ── Theme helpers ────────────────────────────────────────────────────────────
const tk = (isDark: boolean) => ({
  pageBg: isDark ? "#0A0A0A" : "#F5F5F0",
  formBg: isDark ? "#111111" : "#FFFFFF",
  cardBg: isDark ? "#111111" : "#FFFFFF",
  text: isDark ? "#FFFFFF" : "#111111",
  textMuted: isDark ? "rgba(255,255,255,0.42)" : "rgba(17,17,17,0.5)",
  textFaint: isDark ? "rgba(255,255,255,0.2)" : "rgba(17,17,17,0.28)",
  inputBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(17,17,17,0.04)",
  inputBgFocus: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
  inputBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(17,17,17,0.12)",
  inputBorderFocus: isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)",
  inputColor: isDark ? "#FFFFFF" : "#111111",
  labelColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(17,17,17,0.45)",
  placeholder: isDark ? "rgba(255,255,255,0.2)" : "rgba(17,17,17,0.3)",
  tabBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(17,17,17,0.06)",
  tabText: isDark ? "rgba(255,255,255,0.4)" : "rgba(17,17,17,0.38)",
  eyeColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(17,17,17,0.35)",
  rememberColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(17,17,17,0.5)",
  footerColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(17,17,17,0.28)",
  strengthEmpty: isDark ? "rgba(255,255,255,0.1)" : "rgba(17,17,17,0.1)",
  errorBg: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
  errorBorder: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.22)",
  errorText: isDark ? "#fca5a5" : "#dc2626",
  successBg: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.07)",
  successBorder: isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.22)",
  successText: isDark ? "#86efac" : "#16a34a",
  overlayGrad: isDark
    ? "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.28) 55%, transparent 100%)"
    : "linear-gradient(to top, rgba(245,245,240,0.92) 0%, rgba(245,245,240,0.25) 55%, transparent 100%)",
  statBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
  statBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
  statLabel: isDark ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)",
  dotInactive: isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
});

// ── Visual Panel Component (isolated with its own state) ────────────────────
const VisualPanel = ({ compact = false, isDark }: { compact?: boolean; isDark: boolean }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const t = tk(isDark);

  useEffect(() => {
    const id = setInterval(() => setImgIndex(i => (i + 1) % BG_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: compact ? 260 : "100%", overflow: "hidden", flexShrink: 0 }}>
      {/* Cycling images */}
      {BG_IMAGES.map((src, i) => (
        <motion.div key={i} animate={{ opacity: imgIndex === i ? 1 : 0 }} transition={{ duration: 1.2 }}
          style={{ position: "absolute", inset: 0 }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>
      ))}
      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, background: t.overlayGrad }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 100%)" }} />

      {/* Floating badge */}
      <motion.div
        animate={{ rotate: [12, 10, 12], y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: compact ? 16 : 48, right: compact ? 16 : 40, background: ACCENT, color: "#000", padding: compact ? "7px 14px" : "10px 20px", borderRadius: 999, fontWeight: 900, fontSize: compact ? 9 : 11, letterSpacing: "0.2em", textTransform: "uppercase", boxShadow: "0 8px 32px rgba(255,216,77,0.3)", zIndex: 10 }}>
        Open Today · 9:00–22:00
      </motion.div>

      {/* Decorative spinning ring */}
      <div style={{ position: "absolute", top: compact ? 12 : 40, left: compact ? 16 : 40, zIndex: 10 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ width: compact ? 36 : 56, height: compact ? 36 : 56, border: "2px dashed rgba(255,216,77,0.4)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: compact ? 7 : 10, height: compact ? 7 : 10, background: ACCENT, borderRadius: "50%" }} />
      </div>

      {/* Full-height bottom content */}
      {!compact && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "0 48px 56px" }}>
          {/* Stat pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
            {[["25+", "Rides"], ["4.9★", "Rating"], ["10k+", "Visitors"]].map(([n, l]) => (
              <div key={l} style={{ background: t.statBg, backdropFilter: "blur(12px)", border: `1px solid ${t.statBorder}`, borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 10, color: t.statLabel, letterSpacing: "0.15em", marginTop: 3, textTransform: "uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Hero copy */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.3em", color: ACCENT, textTransform: "uppercase", marginBottom: 12 }}>
            Ethiopia's Premier Amusement Park
          </p>
          <h2 style={{ fontSize: "clamp(42px, 5vw, 72px)", fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.02em", color: "#fff", marginBottom: 20 }}>
            UNLEASH<br /><span style={{ color: ACCENT }}>THE</span><br />THRILL
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 340 }}>
            Book rides, track your tickets, and plan your visit — all in one place.
          </p>
          {/* Image dots */}
          <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
            {BG_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setImgIndex(i)}
                style={{ width: i === imgIndex ? 24 : 8, height: 8, borderRadius: 999, background: i === imgIndex ? ACCENT : t.dotInactive, border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      )}

      {/* Compact bottom text (mobile / tablet header) */}
      {compact && (
        <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: ACCENT, textTransform: "uppercase", marginBottom: 4 }}>
            Ethiopia's Premier Park
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 0.9, letterSpacing: "-0.01em" }}>
            UNLEASH <span style={{ color: ACCENT }}>THE</span> THRILL
          </h2>
        </div>
      )}
    </div>
  );
};

// ── Password Field Component (isolated with its own toggle state) ───────────
const PasswordField = ({ label, name, placeholder, icon, isDark, showStrength = false }: { 
  label: string; 
  name: string; 
  placeholder?: string; 
  icon?: React.ReactNode; 
  isDark: boolean;
  showStrength?: boolean;
}) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const [password, setPassword] = useState(""); // Controlled state
  const t = tk(isDark);
  
  const strengthColors = ["", "#ef4444", "#f97316", ACCENT, "#22c55e"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  
  // Calculate password strength (only when showStrength is true)
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

  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: focused ? ACCENT : t.labelColor,
        marginBottom: 8, transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focused ? ACCENT : t.labelColor, transition: "color 0.2s", pointerEvents: "none" }}>
            {icon}
          </div>
        )}
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete={name}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (showStrength) {
              // Update strength indicator
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: icon ? "14px 16px 14px 46px" : "14px 16px",
            paddingRight: 46,
            fontSize: 14, color: t.inputColor,
            background: focused ? t.inputBgFocus : t.inputBg,
            border: `1px solid ${focused ? t.inputBorderFocus : t.inputBorder}`,
            borderRadius: 16, outline: "none", transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: t.eyeColor, padding: 0, display: "flex" }}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      
      {/* Password strength indicator - only for registration */}
      {showStrength && password && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4].map(l => (
                <motion.div key={l} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: l * 0.06 }}
                  style={{ flex: 1, height: 3, borderRadius: 2, background: l <= strength ? strengthColors[strength] : t.strengthEmpty, transition: "background 0.3s", transformOrigin: "left" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: strengthColors[strength], letterSpacing: "0.1em" }}>
              {strengthLabels[strength]}
            </span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ── Regular Input Field (uncontrolled with ref) ─────────────────────────────
const InputField = React.forwardRef<HTMLInputElement, {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  icon?: React.ReactNode;
  isDark: boolean;
}>(({ label, type = "text", name, placeholder, icon, isDark }, ref) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const t = tk(isDark);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: focused ? ACCENT : t.labelColor,
        marginBottom: 8, transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focused ? ACCENT : t.labelColor, transition: "color 0.2s", pointerEvents: "none" }}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          name={name}
          placeholder={placeholder}
          autoComplete={name}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: icon ? "14px 16px 14px 46px" : "14px 16px",
            fontSize: 14, color: t.inputColor,
            background: focused ? t.inputBgFocus : t.inputBg,
            border: `1px solid ${focused ? t.inputBorderFocus : t.inputBorder}`,
            borderRadius: 16, outline: "none", transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
        />
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

// ── Login Form Component ────────────────────────────────────────────────────
const LoginForm = ({ isDark, onSubmit, onSuccess }: { 
  isDark: boolean; 
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  onSuccess: (message: string) => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = tk(isDark);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log("Form values:", { email, password });
    
    if (!email || !password) {
      console.log("Validation failed:", { email, password });
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await onSubmit({ email, password });
      onSuccess("Welcome back! Redirecting...");
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      key="login" 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }} 
      transition={{ duration: 0.25 }}
      onSubmit={handleSubmit} 
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Email Address
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <MailIcon />
          </div>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Password
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <LockIcon />
          </div>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" style={{ accentColor: ACCENT, width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(17,17,17,0.5)", transition: "color 0.3s" }}>Remember me</span>
        </label>
        <button type="button" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: ACCENT, fontWeight: 700 }}>
          Forgot password?
        </button>
      </div>

      <SubmitBtn label="Sign In" loading={loading} />
      
      {error && (
        <div style={{ 
          background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)", 
          border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.22)"}`, 
          borderRadius: 12, 
          padding: "12px 16px", 
          display: "flex", 
          alignItems: "center", 
          gap: 10,
          fontSize: 13,
          color: isDark ? "#fca5a5" : "#dc2626"
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </motion.form>
  );
};

// ── Register Form Component ─────────────────────────────────────────────────
const RegisterForm = ({ isDark, onSubmit, onSuccess }: { 
  isDark: boolean; 
  onSubmit: (data: any) => Promise<void>;
  onSuccess: (message: string) => void;
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log("Registration form data:", formData);
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // Remove empty phone field before sending to backend
      const submitData = {
        ...formData,
        phone: formData.phone.trim() || undefined
      };
      await onSubmit(submitData);
      onSuccess("Account created! Redirecting...");
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      key="register" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      transition={{ duration: 0.25 }}
      onSubmit={handleSubmit} 
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{
            display: "block", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
          }}>
            First Name
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
              <UserIcon />
            </div>
            <input
              type="text"
              name="firstName"
              placeholder="John"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 46px",
                fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
                background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
                border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
                borderRadius: 16, outline: "none", transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
            />
          </div>
        </div>
        <div>
          <label style={{
            display: "block", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
          }}>
            Last Name
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
              <UserIcon />
            </div>
            <input
              type="text"
              name="lastName"
              placeholder="Doe"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 46px",
                fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
                background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
                border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
                borderRadius: 16, outline: "none", transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Email Address
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <MailIcon />
          </div>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Phone (Optional)
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <PhoneIcon />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="+251911000000"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Password
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <LockIcon />
          </div>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#FFD84D", marginBottom: 8, transition: "color 0.2s",
        }}>
          Confirm Password
        </label>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#FFD84D", transition: "color 0.2s", pointerEvents: "none" }}>
            <LockIcon />
          </div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 46px",
              fontSize: 14, color: isDark ? "#FFFFFF" : "#111111",
              background: isDark ? "rgba(255,216,77,0.06)" : "rgba(255,216,77,0.07)",
              border: `1px solid ${isDark ? "rgba(255,216,77,0.5)" : "rgba(200,150,0,0.55)"}`,
              borderRadius: 16, outline: "none", transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          />
        </div>
      </div>

      <SubmitBtn label="Create Account" loading={loading} />
      
      {error && (
        <div style={{ 
          background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)", 
          border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.22)"}`, 
          borderRadius: 12, 
          padding: "12px 16px", 
          display: "flex", 
          alignItems: "center", 
          gap: 10,
          fontSize: 13,
          color: isDark ? "#fca5a5" : "#dc2626"
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </motion.form>
  );
};

// ── Submit button ────────────────────────────────────────────────────────────
const SubmitBtn = ({ label, loading }: { label: string; loading: boolean }) => {
  return (
    <motion.button type="submit" disabled={loading}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", padding: "15px 0", background: ACCENT, border: "none",
        borderRadius: 16, cursor: loading ? "not-allowed" : "pointer",
        fontSize: 14, fontWeight: 900, letterSpacing: "0.1em", color: "#000",
        textTransform: "uppercase" as const, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8, marginTop: 6,
        opacity: loading ? 0.7 : 1, boxShadow: "0 8px 32px rgba(255,216,77,0.25)",
        transition: "opacity 0.2s",
      }}>
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%" }} />
        : <>{label} <span style={{ fontSize: 16 }}>→</span></>
      }
    </motion.button>
  );
};

// ── Form Content ─────────────────────────────────────────────────────────────
const FormContent = ({ isDark, tab, onTabChange, onLogin, onRegister }: { 
  isDark: boolean; 
  tab: string;
  onTabChange: (tab: string) => void;
  onLogin: (data: { email: string; password: string }) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
}) => {
  const t = tk(isDark);
  const [success, setSuccess] = useState("");
  const [globalError, setGlobalError] = useState("");

  const handleLoginSuccess = (message: string) => {
    setSuccess(message);
    setGlobalError("");
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccess(message);
    setGlobalError("");
  };

  const handleLoginError = (error: string) => {
    setGlobalError(error);
    setSuccess("");
  };

  const handleRegisterError = (error: string) => {
    setGlobalError(error);
    setSuccess("");
  };

  // viewport width for responsive layout
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const isMobile = vw < 768;
  const isDesktop = vw >= 1024;

  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", padding: isDesktop ? "0 44px" : "0" }}>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: ACCENT, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: t.text, letterSpacing: "-0.02em", transition: "color 0.3s" }}>
            Bora Park
          </span>
        </div>
      </motion.div>

      {/* Heading */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
          style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 28 : "clamp(28px, 4vw, 40px)", fontWeight: 900, color: t.text, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 8, transition: "color 0.3s" }}>
            {tab === "login" ? "Welcome back." : "Join us today."}
          </h1>
          <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.5, transition: "color 0.3s" }}>
            {tab === "login" ? "Sign in to access your tickets and bookings." : "Create your account and start the adventure."}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: t.tabBg, borderRadius: 16, padding: 4, marginBottom: 32, position: "relative", transition: "background 0.3s" }}>
        <motion.div layoutId="pill"
          style={{ position: "absolute", top: 4, bottom: 4, width: "calc(50% - 4px)", background: ACCENT, borderRadius: 12, left: tab === "login" ? 4 : "calc(50%)" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }} />
        {["login", "register"].map(v => (
          <button key={v} onClick={() => onTabChange(v)}
            style={{ flex: 1, padding: "11px 0", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: tab === v ? "#000" : t.tabText, position: "relative", zIndex: 1, transition: "color 0.2s", textTransform: "uppercase" }}>
            {v === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Global Alerts */}
      <AnimatePresence>
        {globalError && (
          <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: t.errorText }}>{globalError}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: t.successBg, border: `1px solid ${t.successBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: t.successText }}>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forms */}
      <AnimatePresence mode="wait">
        {tab === "login" ? (
          <LoginForm 
            key="login"
            isDark={isDark} 
            onSubmit={onLogin}
            onSuccess={handleLoginSuccess}
          />
        ) : (
          <RegisterForm 
            key="register"
            isDark={isDark} 
            onSubmit={onRegister}
            onSuccess={handleRegisterSuccess}
          />
        )}
      </AnimatePresence>

      <p style={{ textAlign: "center", fontSize: 11, color: t.footerColor, marginTop: 32, letterSpacing: "0.05em", transition: "color 0.3s" }}>
        © 2026 Bora Park · All rights reserved
      </p>
    </div>
  );
};

// ── Main AuthPage ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { isDarkTheme } = useTheme();
  const t = tk(isDarkTheme);

  const [tab, setTab] = useState("login");

  // viewport width for responsive layout
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const isMobile = vw < 768;
  const isTablet = vw >= 768 && vw < 1024;
  const isDesktop = vw >= 1024;

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch (error) {
      // Re-throw to let form handle the error
      throw error;
    }
  };

  const handleRegister = async (data: any) => {
    try {
      await register(data);
      router.push("/");
    } catch (error) {
      // Re-throw to let form handle the error
      throw error;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.pageBg, fontFamily: "var(--font-dm-sans)", transition: "background 0.3s" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: var(--font-dm-sans); }
        input::placeholder { color: ${t.placeholder}; opacity: 1; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${ACCENT}; border-radius: 2px; }
        body { overflow-x: hidden; }
      `}</style>

      {/* ── MOBILE: image banner → form card slides up ── */}
      {isMobile && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <VisualPanel compact={true} isDark={isDarkTheme} />
          <div style={{
            flex: 1, background: t.cardBg,
            borderRadius: "24px 24px 0 0", marginTop: -20,
            position: "relative", zIndex: 10,
            overflowY: "auto", transition: "background 0.3s",
          }}>
            <div style={{ padding: "28px 24px 48px" }}>
              <FormContent 
                isDark={isDarkTheme}
                tab={tab}
                onTabChange={setTab}
                onLogin={handleLogin}
                onRegister={handleRegister}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TABLET: centered card with compact image header ── */}
      {isTablet && (
        <div style={{
          minHeight: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", background: t.pageBg,
        }}>
          <div style={{
            width: "100%", maxWidth: 520,
            background: t.cardBg, borderRadius: 28, overflow: "hidden",
            boxShadow: isDarkTheme ? "0 32px 80px rgba(0,0,0,0.7)" : "0 32px 80px rgba(0,0,0,0.1)",
            transition: "background 0.3s, box-shadow 0.3s",
          }}>
            <VisualPanel compact={true} isDark={isDarkTheme} />
            <div style={{ padding: "36px 36px 44px" }}>
              <FormContent 
                isDark={isDarkTheme}
                tab={tab}
                onTabChange={setTab}
                onLogin={handleLogin}
                onRegister={handleRegister}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP: full-height 50/50 split ── */}
      {isDesktop && (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          {/* Left — visual */}
          <div style={{ flex: "0 0 50%", position: "relative" }}>
            <VisualPanel compact={false} isDark={isDarkTheme} />
          </div>
          {/* Right — form */}
          <div style={{
            flex: "0 0 50%", background: t.formBg,
            display: "flex", flexDirection: "column",
            justifyContent: "center", overflowY: "auto",
            position: "relative", transition: "background 0.3s",
          }}>
            {/* Subtle radial accent */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,216,77,0.04) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,216,77,0.03) 0%, transparent 50%)`,
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <FormContent 
                isDark={isDarkTheme}
                tab={tab}
                onTabChange={setTab}
                onLogin={handleLogin}
                onRegister={handleRegister}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}