'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Home, FileText, Activity, Link2, 
  Smartphone, Landmark, Key, X, LogOut, 
  List, MapPin, Tablet, Laptop, Smartphone as Phone
} from 'lucide-react';

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gp_token');
    if (!token) { router.push('/auth/login'); return; }

    fetch('/api/user/activity?limit=50', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setActivities(data.activities || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);
  
  const handleLogout = () => {
    const token = localStorage.getItem('gp_token');
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

  const actionIcons = {
    login: <Key size={18} color="white" />, 
    login_failed: <X size={18} color="white" />, 
    register: <FileText size={18} color="white" />, 
    logout: <LogOut size={18} color="white" />, 
    default: <List size={18} color="white" />
  };

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/dashboard/documents">Documents</Link></li>
          <li><Link href="/dashboard/activity" style={{ color: 'var(--gold)' }}>Activity</Link></li>
          <li><Link href="/dashboard/services">Services</Link></li>
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
            <Link href="/dashboard/activity" className="sidebar-link active">
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
            <a onClick={handleLogout} className="sidebar-link" style={{ cursor: 'pointer', color: 'var(--red-light)', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <span className="link-icon"><LogOut size={18} color="var(--red-light)" /></span> Sign Out
            </a>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">Login Activity</h1>
            <p className="page-subtitle">Monitor all authentication events for your account</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><Activity size={48} color="var(--text-muted)" /></div>
              <h3>No activity recorded</h3>
              <p>Your login activity will appear here as you use Ghana Pass.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((act, i) => (
                <div key={i} className="activity-item" style={{ animation: `fadeInUp 0.3s ease ${i * 0.05}s both` }}>
                  <div className={`activity-icon ${act.success ? 'success' : 'error'}`} style={{ background: 'transparent', padding: 0 }}>
                    {actionIcons[act.action] || actionIcons.default}
                  </div>
                  <div className="activity-details">
                    <div className="title">
                      {act.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="meta">
                      {act.device && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{act.device}</span>}
                      {act.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}> • <MapPin size={12} /> {act.location}</span>}
                      {act.ip_address && <span> • {act.ip_address}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge ${act.success ? 'badge-verified' : 'badge-rejected'}`}>
                      {act.success ? 'Success' : 'Failed'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
