'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home, FileText, BarChart3, Link2, Smartphone,
  Landmark, ShieldCheck, Terminal, Settings, User,
  LogOut, Check, X, Key, List, Info, Activity,
  LayoutDashboard, CreditCard, ExternalLink
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [consents, setConsents] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('gp_token');
    const storedUser = localStorage.getItem('gp_user');
    if (!token) { router.push('/auth/login'); return; }
    if (storedUser) setUser(JSON.parse(storedUser));

    fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (data.id) setUser(data); }).catch(() => { });

    fetch('/api/user/activity?limit=5', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setActivity(data.activities || [])).catch(() => { });

    fetch('/api/user/consents', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setConsents(data.consents || [])).catch(() => { });
  }, [router]);

  const handleLogout = () => {
    const token = localStorage.getItem('gp_token');
    fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    router.push('/auth/login');
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;

  const statusBadge = {
    verified: 'badge-verified', pending: 'badge-pending', flagged: 'badge-flagged', rejected: 'badge-rejected'
  };

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard" style={{ color: 'var(--gold)' }}>Dashboard</Link></li>
          <li><Link href="/dashboard/documents">Documents</Link></li>
          <li><Link href="/dashboard/activity">Activity</Link></li>
          <li><Link href="/dashboard/services">Services</Link></li>
        </ul>
        <div className="navbar-auth">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.full_name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Dashboard</div>
            <Link href="/dashboard" className="sidebar-link active">
              <span className="link-icon"><LayoutDashboard size={18} color="white" /></span> Overview
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
            <Link href="/dashboard/financial" className="sidebar-link">
              <span className="link-icon"><Landmark size={18} color="white" /></span> Financial Services
            </Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">Quick Actions</div>
            <Link href="/auth/consent" className="sidebar-link">
              <span className="link-icon"><ExternalLink size={18} color="white" /></span> OAuth Demo
            </Link>
            <Link href="/developer" className="sidebar-link">
              <span className="link-icon"><Terminal size={18} color="white" /></span> Developer
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" className="sidebar-link">
                <span className="link-icon"><Settings size={18} color="white" /></span> Admin Panel
              </Link>
            )}
            <a onClick={handleLogout} className="sidebar-link" style={{ cursor: 'pointer', color: 'var(--red-light)' }}>
              <span className="link-icon"><LogOut size={18} color="var(--red-light)" /></span> Sign Out
            </a>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">Welcome back, {user.full_name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Manage your digital identity and connected services</p>
          </div>

          {/* Identity Card */}
          <div className="identity-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">GHANA PASS</div>
                <div className="card-subtitle">National Digital Identity</div>
              </div>
            </div>
            <div className="card-info">
              <div className="info-label">Full Name</div>
              <div className="info-value">{user.full_name}</div>
              <div className="info-label">Date of Birth</div>
              <div className="info-value">{user.date_of_birth}</div>
              <div className="info-label">Status</div>
              <span className={`badge ${statusBadge[user.verification_status]}`}>
                {user.verification_status?.toUpperCase()}
              </span>
            </div>
            <div className="card-id">{user.ghana_card_number}</div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><ShieldCheck size={24} color="white" /></div>
                <div className="stat-label">Identity Status</div>
              </div>
              <div className="stat-value">{user.verification_status === 'verified' ? 'Verified' : 'Pending'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><FileText size={24} color="white" /></div>
                <div className="stat-label">Signed Documents</div>
              </div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><Activity size={24} color="white" /></div>
                <div className="stat-label">Recent Activity</div>
              </div>
              <div className="stat-value">{activity.length}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem' }}>Quick Actions</h3>
          <div className="quick-actions">
            <Link href="/dashboard/documents" className="quick-action">
              <FileText size={32} color="white" style={{ marginBottom: '12px' }} />
              <span className="action-label">Sign Document</span>
            </Link>
            <Link href="/dashboard/sim-verification" className="quick-action">
              <Smartphone size={32} color="white" style={{ marginBottom: '12px' }} />
              <span className="action-label">SIM Verification</span>
            </Link>
            <Link href="/dashboard/financial" className="quick-action">
              <Landmark size={32} color="white" style={{ marginBottom: '12px' }} />
              <span className="action-label">Financial Services</span>
            </Link>
            <Link href="/dashboard/services" className="quick-action">
              <Link2 size={32} color="white" style={{ marginBottom: '12px' }} />
              <span className="action-label">Manage Services</span>
            </Link>
            <Link href="/dashboard/activity" className="quick-action">
              <Activity size={32} color="white" style={{ marginBottom: '12px' }} />
              <span className="action-label">View Activity</span>
            </Link>
          </div>

          {/* Recent Activity */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem' }}>Recent Activity</h3>
          <div className="activity-list">
            {activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="icon">📊</div>
                <h3>No activity yet</h3>
                <p>Your login and identity activity will appear here.</p>
              </div>
            ) : (
              activity.slice(0, 5).map((act, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon ${act.success ? 'success' : 'error'}`} style={{ background: 'transparent', padding: 0 }}>
                    {act.action === 'login' ? <Key size={20} color="white" /> :
                      act.action === 'register' ? <FileText size={20} color="white" /> :
                        act.action === 'logout' ? <LogOut size={20} color="white" /> : <List size={20} color="white" />}
                  </div>
                  <div className="activity-details">
                    <div className="title">{act.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div className="meta">{act.device} • {act.location} • {new Date(act.created_at).toLocaleString()}</div>
                  </div>
                  <span className={`badge ${act.success ? 'badge-verified' : 'badge-rejected'}`}>
                    {act.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Linked Services */}
          {consents.length > 0 && (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem' }}>Linked Services</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {consents.map((consent, i) => (
                  <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--gradient-green)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏛️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{consent.service_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected {new Date(consent.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="badge badge-active">Active</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
