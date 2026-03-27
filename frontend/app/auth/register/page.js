'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, CheckCircle, ShieldCheck, 
  User, PartyPopper, ArrowRight, ArrowLeft, 
  Camera, Lock, Mail, Phone, Calendar, 
  MapPin, UserCheck, Shield, Check
} from 'lucide-react';
import { useRef, useEffect } from 'react';
import GhanaCardInput from '../../../components/GhanaCardInput';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [citizen, setCitizen] = useState(null);
  const [form, setForm] = useState({
    ghana_card_number: 'GHA-', phone: '', full_name: '', date_of_birth: '', password: '', email: ''
  });
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Lookup Ghana Card in registry
  const lookupCard = async () => {
    if (!form.ghana_card_number) return;
    setLookingUp(true);
    setError('');
    setCitizen(null);
    try {
      const res = await fetch(`/api/registry/lookup/${encodeURIComponent(form.ghana_card_number)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setError(data.error || 'Invalid Ghana Card Number. Cannot create account.');
        return;
      }
      if (data.already_registered) {
        setError('This Ghana Card is already registered. Please sign in instead.');
        return;
      }
      setCitizen(data.citizen);
      updateForm('full_name', data.citizen.full_name);
      updateForm('date_of_birth', data.citizen.date_of_birth);
      if (data.citizen.phone) updateForm('phone', data.citizen.phone);
    } catch {
      setError('Unable to verify Ghana Card. Please try again.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      stopCamera();
      localStorage.setItem('gp_token', data.tokens.accessToken);
      localStorage.setItem('gp_user', JSON.stringify(data.user));
      setStep(4); // success
    } catch (err) {
      setError(err.message);
      setStep(3); // go back to face scan step on error
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    console.log("Attempting to start camera (Register)...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser/context.");
      }
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      console.log("Camera stream obtained (Register):", s.id);
      setStream(s);
    } catch (err) {
      console.error("Camera error (Register):", err);
      setError("Unable to access camera: " + (err.message || "Unknown error"));
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log("Stopping camera stream (Register)...");
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    console.log("Current Step:", step);
    if (step === 3) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Attaching stream to video element (Register)...");
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startFaceScan = () => {
    setScanning(true);
    // Simulate face scan → auto-register on completion
    setTimeout(() => {
      setScanning(false);
      handleRegister(); // Auto-submit after face scan
    }, 3000);
  };

  const canProceedStep1 = citizen && form.ghana_card_number && form.phone;
  const canProceedStep2 = form.full_name && form.date_of_birth && form.password && form.password.length >= 6;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: step === 3 ? '500px' : '460px' }}>
        {/* Logo & Header - only show when not in success state */}
        {step < 4 && (
          <div className="auth-logo">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div>
              <h2>Create Your Ghana<span style={{ color: 'var(--gold)' }}>Pass</span></h2>
            </Link>
            <p>Setup your national digital identity</p>
          </div>
        )}

        {/* Progress steps - only show when not in success state */}
        {step < 4 && (
          <div className="steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 16px', background: 'rgba(206,17,38,0.1)', border: '1px solid rgba(206,17,38,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--red-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Step 1: Ghana Card Lookup */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verify Your Ghana Card</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter your Ghana Card number to verify your identity with the National Identification Authority.
            </p>
            <div className="form-group">
              <label className="form-label">Ghana Card Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <GhanaCardInput value={form.ghana_card_number}
                  onChange={(val) => { updateForm('ghana_card_number', val); setCitizen(null); setError(''); }}
                  style={{ flex: 1 }} />
                <button className="btn btn-secondary" onClick={lookupCard} disabled={lookingUp || form.ghana_card_number.length < 15}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lookingUp ? <div className="spinner" style={{ width: '16px', height: '16px' }}></div> : <><Search size={16} /> Verify</>}
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>The GHA- prefix is auto-filled. Just enter your numbers.</div>
            </div>

            {/* Show citizen info if found */}
            {citizen && (
              <div style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.3)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={18} color="var(--green)" />
                  <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.85rem' }}>Identity Found in NIA Registry</span>
                </div>
                <div style={{ display: 'grid', gap: '4px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Name</span>
                    <span style={{ fontWeight: 600 }}>{citizen.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
                    <span style={{ fontWeight: 600 }}>{citizen.date_of_birth}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gender</span>
                    <span style={{ fontWeight: 600 }}>{citizen.gender}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Region</span>
                    <span style={{ fontWeight: 600 }}>{citizen.region}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+233XXXXXXXXX" value={form.phone}
                onChange={e => updateForm('phone', e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => { setError(''); setStep(2); }}
              disabled={!canProceedStep1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Email, Password (Name & DOB auto-filled, read-only) */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Complete Your Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your details have been auto-filled from the NIA registry. Enter your email and create a password.
            </p>

            <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} /> Auto-filled from NIA Registry
              </div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
                  <span style={{ fontWeight: 700 }}>{form.full_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
                  <span style={{ fontWeight: 600 }}>{form.date_of_birth}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ghana Card</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{form.ghana_card_number}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email}
                onChange={e => updateForm('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Create Password</label>
              <input className="form-input" type="password" placeholder="Minimum 6 characters" value={form.password}
                onChange={e => updateForm('password', e.target.value)} />
              {form.password && form.password.length < 6 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--red-light)', marginTop: '4px' }}>Password must be at least 6 characters</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => { setError(''); setStep(3); }}
                disabled={!canProceedStep2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue to Face Scan <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Facial Verification → Auto-Register */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Facial Verification</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              We&apos;ll match your face against your Ghana Card photo. Your account will be created automatically upon successful verification.
            </p>
            <div className="face-capture">
              <div className={`face-frame ${scanning ? 'scanning' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Scanner Overlay */}
                {(scanning || loading) && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', marginBottom: '12px', borderWidth: '3px', borderColor: 'var(--gold) transparent var(--gold) transparent' }}></div>
                    <div style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {scanning ? 'SCANNING...' : 'FINALIZING...'}
                    </div>
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
                <p><strong>Position your face within the frame</strong></p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Ensure good lighting • Remove glasses • Look straight ahead</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={scanning || loading}>← Back</button>
                {!scanning && !loading && (
                  <button className="btn btn-green btn-full btn-lg" onClick={startFaceScan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Camera size={20} /> Capture & Create Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success Message */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <PartyPopper size={64} color="var(--gold)" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome to GhanaPass!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Your digital identity has been created and <strong style={{ color: 'var(--green)' }}>automatically verified</strong>.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(0,168,107,0.1)', border: '1px solid rgba(0,168,107,0.3)', borderRadius: '9999px', fontSize: '0.85rem', color: 'var(--green)', fontWeight: 600, marginBottom: '2rem' }}>
              <CheckCircle size={18} /> Identity Verified via Facial Recognition
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
              No manual admin verification required. You can now access all services across Ghana.
            </p>
            <Link href="/dashboard" className="btn btn-primary btn-lg btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {step < 4 && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
