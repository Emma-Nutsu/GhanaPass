'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Landmark, Wallet, PieChart, Lock, CheckCircle, 
  X, Home, FileText, Activity, Link2, Smartphone, 
  Check, Info, CreditCard, Building2, Briefcase, LogOut,
  ShieldCheck
} from 'lucide-react';

export default function FinancialServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [banks, setBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    account_type: 'savings',
    branch: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('gp_token') : null;

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    const storedUser = localStorage.getItem('gp_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (data.id) setUser(data); }).catch(() => {});

    fetchBanks();
    fetchAccounts();
  }, [token, router]);

  const fetchBanks = () => {
    fetch('/api/financial/banks', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setBanks(data.banks || [])).catch(() => {});
  };

  const fetchAccounts = () => {
    fetch('/api/financial/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setAccounts(data.accounts || [])).catch(() => {});
  };

  const handleLogout = () => {
    if (token) {
      fetch('/api/auth/logout', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` } 
      }).catch(() => {});
    }
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    router.push('/auth/login');
  };

  const stats = {
    linked_accounts: accounts.length,
    recent_transactions: 0,
    verification_score: user?.verification_status === 'verified' ? 98 : 0
  };

  const selectBank = (bank) => {
    setSelectedBank(bank);
    setForm({ account_type: 'savings', branch: bank.branches[0] });
    setShowForm(true);
    setResult(null);
  };

  const handleOpenAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/financial/open-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_id: selectedBank.id, ...form })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        setShowForm(false);
        fetchAccounts();
        setToast({ type: 'success', message: data.message });
      } else {
        setToast({ type: 'error', message: data.error || 'Account opening failed' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const accountTypeLabels = { savings: 'Savings', current: 'Current', fixed_deposit: 'Fixed Deposit' };
  const accountTypeIcons = { 
    savings: <Wallet size={20} color="white" />, 
    current: <PieChart size={20} color="white" />, 
    fixed_deposit: <Lock size={20} color="white" /> 
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand"><div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span></Link>
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
            <Link href="/dashboard/sim-verification" className="sidebar-link">
              <span className="link-icon"><Smartphone size={18} color="white" /></span> SIM Verification
            </Link>
            <Link href="/dashboard/financial" className="sidebar-link active">
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
              <Landmark size={32} color="white" /> Financial Services
            </h1>
            <p className="page-subtitle">Open bank accounts with our partner financial institutions using your verified Ghana Pass identity</p>
          </div>

          {/* Stats Row */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><Landmark size={24} color="white" /></div>
                <div className="stat-label">Linked Accounts</div>
              </div>
              <div className="stat-value">{stats.linked_accounts}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><CreditCard size={24} color="white" /></div>
                <div className="stat-label">Recent Transactions</div>
              </div>
              <div className="stat-value">{stats.recent_transactions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><ShieldCheck size={24} color="white" /></div>
                <div className="stat-label">Verification Score</div>
              </div>
              <div className="stat-value">{stats.verification_score}%</div>
            </div>
          </div>

          {/* Success Result */}
          {result && (
            <div className="card" style={{
              padding: '2rem', marginBottom: '2rem',
              borderColor: 'rgba(0, 168, 107, 0.4)',
              animation: 'fadeInUp 0.4s ease'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0, 168, 107, 0.15)',
                }}><CheckCircle size={48} color="#00A86B" /></div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>Account Created Successfully!</h3>
                <span className="badge badge-verified">ACTIVE</span>
              </div>

              <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Bank</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{result.account.bank_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Account Type</div>
                    <div style={{ fontWeight: 600 }}>{accountTypeLabels[result.account.account_type]}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Account Number</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--gold)', letterSpacing: '1px' }}>{result.account.account_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>IBAN</div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace' }}>{result.account.iban}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>SWIFT</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{result.account.swift}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Branch</div>
                    <div style={{ fontWeight: 600 }}>{result.account.branch}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Account Holder</div>
                    <div style={{ fontWeight: 600 }}>{result.account.holder_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Ghana Card</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{result.account.ghana_card}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setResult(null)}>✕ Dismiss</button>
              </div>
            </div>
          )}

          {/* Bank Selection */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            {showForm ? '← Select a Different Bank' : 'Select a Bank to Open an Account'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {banks.map(bank => (
              <div key={bank.id}
                onClick={() => selectBank(bank)}
                style={{
                  background: selectedBank?.id === bank.id ? `${bank.color}12` : 'var(--gradient-card)',
                  border: `1px solid ${selectedBank?.id === bank.id ? bank.color + '50' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => { if (selectedBank?.id !== bank.id) { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.transform = 'translateY(-4px)'; } }}
                onMouseOut={e => { if (selectedBank?.id !== bank.id) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                {selectedBank?.id === bank.id && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: bank.color }}></div>
                )}
                <div style={{
                  height: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <img src={bank.logo} alt={bank.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{bank.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  SWIFT: {bank.swift} • {bank.branches.length} branches
                </div>
                {selectedBank?.id === bank.id && (
                  <span className="badge badge-active" style={{ marginTop: '0.75rem' }}>Selected</span>
                )}
              </div>
            ))}
          </div>

          {/* Account Opening Form */}
          {showForm && selectedBank && (
            <div className="card" style={{ padding: '2rem', maxWidth: '600px', animation: 'fadeInUp 0.3s ease' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Open Account with {selectedBank.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Your Ghana Pass identity will be used for instant KYC verification.
              </p>

              <form onSubmit={handleOpenAccount}>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {Object.entries(accountTypeLabels).map(([key, label]) => (
                      <div key={key}
                        onClick={() => setForm(f => ({ ...f, account_type: key }))}
                        style={{
                          padding: '1rem',
                          background: form.account_type === key ? 'rgba(212, 168, 67, 0.1)' : 'var(--bg-glass)',
                          border: `1px solid ${form.account_type === key ? 'var(--gold)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{accountTypeIcons[key]}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select className="form-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                    {selectedBank.branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div style={{
                  background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '1rem',
                  marginBottom: '1.5rem', border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Holder</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{user.ghana_card_number} • {user.phone}</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setSelectedBank(null); }} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-green" disabled={loading} style={{ flex: 2 }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                        Opening Account...
                      </span>
                    ) : '🏦 Open Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Accounts */}
          {accounts.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>My Bank Accounts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(acc => {
                  const bankDetails = banks.find(b => b.code === acc.bank_code);
                  return (
                  <div key={acc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px'
                    }}>
                      {bankDetails?.logo ? (
                        <img src={bankDetails.logo} alt={acc.bank_name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : '🏛️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{acc.bank_name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--gold)', letterSpacing: '1px' }}>
                        {acc.account_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {accountTypeLabels[acc.account_type] || acc.account_type} • {acc.branch} • Opened {new Date(acc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge ${acc.status === 'active' ? 'badge-verified' : 'badge-pending'}`}>
                      {acc.status?.toUpperCase()}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>🔐 Secure KYC Integration</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Your verified Ghana Pass identity enables instant KYC (Know Your Customer) compliance. 
              Partner banks receive only the information you consent to share. All accounts opened through 
              Ghana Pass are fully compliant with Bank of Ghana regulations.
            </p>
          </div>
        </main>
      </div>

      {toast && <div className={`toast ${toast.type}`} onClick={() => setToast(null)}>{toast.message}</div>}
    </>
  );
}
