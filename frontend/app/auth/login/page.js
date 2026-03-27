'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Key, User, Smartphone, Lock,
  Fingerprint, ArrowRight, ArrowLeft, Camera,
  ShieldCheck, AlertCircle, RefreshCw, Smartphone as PhoneIcon
} from 'lucide-react';
import { useRef, useEffect } from 'react';
import GhanaCardInput from '../../../components/GhanaCardInput';

import { API_BASE } from '../../../utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('password'); // password | otp | biometric
  const [loginStep, setLoginStep] = useState('credentials'); // credentials | face_verify | otp_input | biometric_scan
  const [scanning, setScanning] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userName, setUserName] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const [form, setForm] = useState({ ghana_card_number: 'GHA-', password: '', otp: '' });

  const completeLogin = (data) => {
    stopCamera();
    localStorage.setItem('gp_token', data.tokens.accessToken);
    localStorage.setItem('gp_user', JSON.stringify(data.user));
    if (data.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  // Step 1: Password login → get temp token
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghana_card_number: form.ghana_card_number, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.requires_face_verify) {
        setTempToken(data.temp_token);
        setUserName(data.user.full_name);
        setLoginStep('face_verify');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    console.log("Attempting to start camera...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser/context.");
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      console.log("Camera stream obtained:", s.id);
      setStream(s);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera: " + (err.message || "Unknown error"));
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log("Stopping camera stream...");
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    console.log("Current loginStep:", loginStep);
    if (loginStep === 'face_verify') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [loginStep]);

  useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Attaching stream to video element...");
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Face verification step
  const startFaceVerify = () => {
    setScanning(true);
    setError('');
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp_token: tempToken })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        completeLogin(data);
      } catch (err) {
        setScanning(false);
        setError(err.message);
      }
    }, 2500);
  };

  // OTP: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghana_card_number: form.ghana_card_number })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpHint(data.otp_hint);
      setMaskedPhone(data.masked_phone);
      setLoginStep('otp_input');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghana_card_number: form.ghana_card_number, code: form.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.requires_face_verify) {
        setTempToken(data.temp_token);
        setUserName(data.user.full_name);
        setLoginStep('face_verify');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Biometric login
  const handleBiometricStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginStep('biometric_scan');
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/biometric`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ghana_card_number: form.ghana_card_number })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.requires_face_verify) {
          setTempToken(data.temp_token);
          setUserName(data.user.full_name);
          setLoginStep('face_verify');
        }
      } catch (err) {
        setError(err.message);
        setLoginStep('credentials');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const resetFlow = () => {
    setLoginStep('credentials');
    setScanning(false);
    setTempToken('');
    setError('');
    setOtpHint('');
    setForm(f => ({ ...f, otp: '' }));
  };

  const tabStyle = (t) => ({
    flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-md)',
    background: tab === t ? 'rgba(212,168,67,0.15)' : 'transparent',
    color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
    fontWeight: tab === t ? 700 : 500,
    cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s ease',
    border: tab === t ? '1px solid rgba(212,168,67,0.3)' : '1px solid transparent'
  });

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div className="auth-logo">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div>
            <h2>Sign in to Ghana<span style={{ color: 'var(--gold)' }}>Pass</span></h2>
          </Link>
          <p>Access your digital identity</p>
        </div>

        {error && (
          <div style={{ padding: '10px 16px', background: 'rgba(206,17,38,0.1)', border: '1px solid rgba(206,17,38,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--red-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Face Verification Step (shared across all methods) */}
        {loginStep === 'face_verify' && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 2 of 2</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>Facial Verification</h3>
              {userName && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Welcome back, <strong>{userName}</strong></p>}
            </div>

            <div className="face-capture">
              <div className={`face-frame ${scanning ? 'scanning' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Scanner Overlay */}
                {scanning && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', marginBottom: '12px', borderWidth: '3px', borderColor: 'var(--gold) transparent var(--gold) transparent' }}></div>
                    <div style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>VERIFYING...</div>
                  </div>
                )}

                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    display: stream ? 'block' : 'none'
                  }}
                />

                {/* Initial Placeholder (Shown until stream connects) */}
                {!stream && (
                  <div className="placeholder-icon">
                    <User size={80} color="rgba(255,255,255,0.15)" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="face-instructions">
                <p><strong>Look at the camera to verify your identity</strong></p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>This confirms you are the account holder</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn btn-secondary" onClick={resetFlow} disabled={scanning}>← Back</button>
                {!scanning && (
                  <button className="btn btn-green btn-full btn-lg" onClick={startFaceVerify} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Camera size={20} /> Verify & Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Biometric Scan Animation */}
        {loginStep === 'biometric_scan' && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div className="face-capture">
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Fingerprint size={64} color="var(--gold)" /></div>
                <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px', borderWidth: '3px' }}></div>
                <div style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600 }}>Scanning Biometrics...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Fingerprint + Iris verification</div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials / OTP / Biometric Input */}
        {loginStep === 'credentials' && (
          <div className="animate-fade-in">
            {/* Auth method tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', background: 'var(--bg-glass)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button style={tabStyle('password')} onClick={() => { setTab('password'); setError(''); }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Key size={14} /> Password</div>
              </button>
              <button style={tabStyle('otp')} onClick={() => { setTab('otp'); setError(''); }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Smartphone size={14} /> OTP</div>
              </button>
              <button style={tabStyle('biometric')} onClick={() => { setTab('biometric'); setError(''); }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Fingerprint size={14} /> Biometric</div>
              </button>
            </div>

            {/* PASSWORD TAB */}
            {tab === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label className="form-label">Ghana Card Number</label>
                  <GhanaCardInput
                    name="ghana_card_number"
                    value={form.ghana_card_number}
                    onChange={val => setForm({ ...form, ghana_card_number: val })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><div className="spinner"></div> Verifying...</> : <>Continue <ArrowRight size={18} /></>}
                </button>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  You&apos;ll be asked for facial verification after entering credentials
                </div>
              </form>
            )}

            {/* OTP TAB */}
            {tab === 'otp' && (
              <form onSubmit={handleSendOTP}>
                <div className="form-group">
                  <label className="form-label">Ghana Card Number</label>
                  <GhanaCardInput value={form.ghana_card_number}
                    onChange={val => setForm({ ...form, ghana_card_number: val })} required />
                </div>
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><div className="spinner"></div> Sending...</> : <><Smartphone size={18} /> Send OTP to My Phone</>}
                </button>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  A one-time code will be sent to your registered phone number
                </div>
              </form>
            )}

            {/* BIOMETRIC TAB */}
            {tab === 'biometric' && (
              <form onSubmit={handleBiometricStart}>
                <div className="form-group">
                  <label className="form-label">Ghana Card Number</label>
                  <GhanaCardInput value={form.ghana_card_number}
                    onChange={val => setForm({ ...form, ghana_card_number: val })} required />
                </div>
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><div className="spinner"></div> Scanning...</> : <><Fingerprint size={18} /> Start Biometric Scan</>}
                </button>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Uses fingerprint and iris pattern matching
                </div>
              </form>
            )}
          </div>
        )}

        {/* OTP Input Step */}
        {loginStep === 'otp_input' && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}><Smartphone size={48} color="var(--gold)" /></div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Enter OTP Code</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Code sent to {maskedPhone}
              </p>
            </div>

            {/* Demo OTP hint */}
            {otpHint && (
              <div style={{ padding: '8px 12px', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--gold)', textAlign: 'center', marginBottom: '1rem' }}>
                🔑 Demo OTP: <strong style={{ fontFamily: 'monospace', letterSpacing: '3px' }}>{otpHint}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label">6-Digit OTP Code</label>
                <input className="form-input" placeholder="Enter 6-digit code" value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '6px', fontFamily: 'monospace' }}
                  required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={resetFlow}>← Back</button>
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading || form.otp.length < 6}>
                  {loading ? <><div className="spinner"></div> Verifying...</> : 'Verify OTP →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Demo credentials */}
        {loginStep === 'credentials' && (
          <div style={{ marginTop: '1.5rem', padding: '12px', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '8px' }}>🔑 Demo Credentials</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Admin:</strong> GHA-000000001-0 / admin123</div>
              <div><strong>Citizen:</strong> GHA-123456789-1 / pass123</div>
            </div>
          </div>
        )}

        {loginStep === 'credentials' && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don&apos;t have an account? <Link href="/auth/register" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Register now</Link>
          </p>
        )}
      </div>
    </div>
  );
}
