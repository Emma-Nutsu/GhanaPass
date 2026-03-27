'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Home, FileText, Activity, Link2, 
  Smartphone, Landmark, Search, CheckCircle, 
  XCircle, Info, List, Phone, ShieldCheck,
  Check, X, LogOut
} from 'lucide-react';

import { API_BASE } from '../../../utils/api';

export default function SIMVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    phone_number: '',
    ghana_card_number: '',
    provider: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('gp_token') : null;

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    const storedUser = localStorage.getItem('gp_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    fetch(`${API_BASE}/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (data.id) setUser(data); }).catch(() => {});
  }, [token, router]);

  const providers = [
    { id: 'MTN', name: 'MTN Ghana', color: '#FFCC00', prefixes: '024, 025, 054, 055', logo: '/logos/mtn.png' },
    { id: 'Telecel', name: 'Telecel (Vodafone)', color: '#E60000', prefixes: '020, 050', logo: '/logos/telecel.png' },
    { id: 'AirtelTigo', name: 'AirtelTigo', color: '#FF0000', prefixes: '026, 027, 056, 057', logo: '/logos/airteltigo.png' },
    { id: 'Glo', name: 'Glo Mobile', color: '#00B300', prefixes: '023', logo: '/logos/glo.png' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/sim/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setHistory(prev => [data, ...prev]);
      } else {
        setToast({ type: 'error', message: data.error || 'Verification failed' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const autofillUser = () => {
    if (user) {
      setForm({
        phone_number: user.phone || '',
        ghana_card_number: user.ghana_card_number || '',
        provider: ''
      });
    }
  };

  const handleLogout = () => {
    if (token) {
      fetch(`${API_BASE}/auth/logout`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` } 
      }).catch(() => {});
    }
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    router.push('/auth/login');
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/dashboard/documents">Documents</Link></li>
          <li><Link href="/dashboard/activity">Activity</Link></li>
          <li><Link href="/dashboard/services">Services</Link></li>
        </ul>
        <div className="navbar-auth">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.full_name}</span>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">← Dashboard</Link>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Dashboard</div>
            <Link href="/dashboard" className="sidebar-link">
              <span className="link-icon"><Home size={18} color="white" /></span> Overview
            </Link>
            <Link href="/dashboard/documents" className="sidebar-link">
              <span className="link-icon"><FileText size={18} color="white" /></span> Documents
            </Link>
            <Link href="/dashboard/activity" className="sidebar-link">
              <span className="link-icon"><Activity size={18} color="white" /></span> Activity
            </Link>
            <Link href="/dashboard/services" className="sidebar-link">
              <span className="link-icon"><Link2 size={18} color="white" /></span> Services
            </Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">Services</div>
            <Link href="/dashboard/sim-verification" className="sidebar-link active">
              <span className="link-icon"><Smartphone size={18} color="white" /></span> SIM Verification
            </Link>
            <Link href="/dashboard/financial" className="sidebar-link">
              <span className="link-icon"><Landmark size={18} color="white" /></span> Financial Services
            </Link>
            <a onClick={handleLogout} className="sidebar-link" style={{ cursor: 'pointer', color: 'var(--red-light)', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <span className="link-icon"><LogOut size={18} color="var(--red-light)" /></span> Sign Out
            </a>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Smartphone size={32} color="white" /> SIM Card Verification
            </h1>
            <p className="page-subtitle">Verify SIM card ownership against Ghana Card identity records</p>
          </div>

          {/* Provider Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {providers.map(p => (
              <div key={p.id}
                onClick={() => setForm(f => ({ ...f, provider: p.id }))}
                style={{
                  background: form.provider === p.id ? `${p.color}15` : 'var(--gradient-card)',
                  border: `1px solid ${form.provider === p.id ? p.color + '60' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {form.provider === p.id && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: p.color }}></div>
                )}
                <img src={p.logo} alt={p.name} style={{ height: '48px', maxWidth: '100px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.prefixes}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Verification Form */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Verify SIM Ownership</h3>
                <button className="btn btn-secondary btn-sm" onClick={autofillUser} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <List size={14} /> Auto-fill my details
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="+233240000001"
                    value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    required
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Format: +233XXXXXXXXX</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghana Card Number</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="GHA-123456789-1"
                    value={form.ghana_card_number}
                    onChange={e => setForm(f => ({ ...f, ghana_card_number: e.target.value }))}
                    required
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Format: GHA-XXXXXXXXX-X</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Network Provider (optional)</label>
                  <select className="form-input" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                    <option value="">Auto-detect from number</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                      Verifying...
                    </>
                  ) : <><Search size={18} /> Verify SIM Card</>}
                </button>
              </form>
            </div>

            {/* Result Display */}
            <div>
              {result ? (
                <div className="card" style={{
                  padding: '2rem',
                  borderColor: result.status === 'verified' ? 'rgba(0, 168, 107, 0.4)' : 'rgba(206, 17, 38, 0.4)',
                  animation: 'fadeInUp 0.4s ease'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: result.status === 'verified'
                        ? 'rgba(0, 168, 107, 0.15)' : 'rgba(206, 17, 38, 0.15)',
                    }}>
                      {result.status === 'verified' ? <CheckCircle size={48} color="#00A86B" /> : <XCircle size={48} color="#EF4444" />}
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      {result.status === 'verified' ? 'SIM Verified' : 'Verification Failed'}
                    </h3>
                    <span className={`badge ${result.status === 'verified' ? 'badge-verified' : 'badge-rejected'}`}>
                      {result.status === 'verified' ? 'IDENTITY MATCH' : 'NO MATCH'}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.phone_number}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Provider</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.provider}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ghana Card</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{result.ghana_card_number}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verification ID</div>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace' }}>{result.verification_id?.substring(0, 12)}...</div>
                      </div>
                    </div>
                  </div>

                  {result.details && (
                    <div style={{ background: result.identity_match ? 'rgba(0,168,107,0.06)' : 'rgba(206,17,38,0.06)', borderRadius: 'var(--radius-md)', padding: '1rem', border: `1px solid ${result.identity_match ? 'rgba(0,168,107,0.2)' : 'rgba(206,17,38,0.2)'}` }}>
                      {result.identity_match ? (
                        <>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#00A86B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={16} /> Identity Confirmed
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>Owner: <strong>{result.details.owner_name}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Method: {result.details.verification_method}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FF4D6A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <X size={16} /> Identity Not Matched
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.details.reason}</div>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                    Verified at {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <Smartphone size={64} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>No Verification Yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                    Enter a phone number and Ghana Card number to verify SIM ownership against identity records.
                  </p>
                </div>
              )}

              {/* Quick Info */}
              <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="var(--gold)" /> How it works
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7 }}>
                  SIM verification confirms the ownership of a phone number by matching it against the Ghana Card identity database. 
                  This supports telecom regulatory compliance and protects against identity fraud.
                </p>
              </div>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Verification History</h3>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Phone</th>
                      <th>Ghana Card</th>
                      <th>Provider</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{h.phone_number}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{h.ghana_card_number}</td>
                        <td>{h.provider}</td>
                        <td>
                          <span className={`badge ${h.status === 'verified' ? 'badge-verified' : 'badge-rejected'}`}>
                            {h.status === 'verified' ? 'Verified' : 'Failed'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <div className={`toast ${toast.type}`} onClick={() => setToast(null)}>{toast.message}</div>}
    </>
  );
}
