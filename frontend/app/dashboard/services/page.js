'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Home, FileText, Activity, Link2, 
  Smartphone, Landmark, ShieldCheck, Building2, 
  Trash2, Plus, Info, Shield, CheckCircle, LogOut
} from 'lucide-react';

export default function ServicesPage() {
  const router = useRouter();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('gp_token') : null;

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetchConsents();
  }, [token, router]);

  const fetchConsents = () => {
    fetch('/api/user/consents', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setConsents(data.consents || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const revokeConsent = async (id) => {
    try {
      const res = await fetch(`/api/user/consents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Access revoked successfully' });
        fetchConsents();
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to revoke access' });
    }
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

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div>
          <span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/dashboard/documents">Documents</Link></li>
          <li><Link href="/dashboard/activity">Activity</Link></li>
          <li><Link href="/dashboard/services" style={{ color: 'var(--gold)' }}>Services</Link></li>
        </ul>
        <div className="navbar-auth"><Link href="/dashboard" className="btn btn-secondary btn-sm">← Dashboard</Link></div>
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
            <Link href="/dashboard/services" className="sidebar-link active">
              <span className="link-icon"><Link2 size={18} color="white" /></span> Services
            </Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">Services</div>
            <Link href="/dashboard/sim-verification" className="sidebar-link">
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
            <h1 className="page-title">Connected Services</h1>
            <p className="page-subtitle">Manage third-party services that have access to your Ghana Pass identity</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>
          ) : consents.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><Link2 size={48} color="var(--text-muted)" /></div>
              <h3>No connected services</h3>
              <p>When you authorize third-party services to access your Ghana Pass identity, they&apos;ll appear here.</p>
              <Link href="/auth/consent" className="btn btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Try OAuth Demo
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {consents.map((consent, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--gradient-green)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={24} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{consent.service_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {consent.service_description} • Scopes: {consent.scopes}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Connected {new Date(consent.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge badge-active">Active</span>
                  <button className="btn btn-danger btn-sm" onClick={() => revokeConsent(consent.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--gold)" /> Privacy Controls
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              You have full control over your identity data. Revoking access will immediately invalidate 
              all access tokens for that service. They will no longer be able to access your identity information.
            </p>
          </div>
        </main>
      </div>

      {toast && <div className={`toast ${toast.type}`} onClick={() => setToast(null)}>{toast.message}</div>}
    </>
  );
}
