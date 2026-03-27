'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Home, FileText, Activity, Link2, 
  Smartphone, Landmark, Paperclip, Check, 
  ShieldCheck, PenTool, FileUp, X, Lock,
  FileBadge, CheckCircle, LogOut
} from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [showSign, setShowSign] = useState(null);
  const [pin, setPin] = useState('');
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [toast, setToast] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('gp_token') : null;

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetchDocuments();
  }, [token, router]);

  const fetchDocuments = () => {
    fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setDocuments(data.documents || [])).catch(() => {});
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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Document uploaded successfully' });
        fetchDocuments();
      } else {
        setToast({ type: 'error', message: data.error });
      }
    } catch { setToast({ type: 'error', message: 'Upload failed' }); }
    finally { setUploading(false); }
  };

  const handleSign = async (docId) => {
    setSigning(true);
    try {
      const res = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ document_id: docId, pin })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Document signed successfully!' });
        setShowSign(null);
        setPin('');
        fetchDocuments();
      } else {
        setToast({ type: 'error', message: data.error });
      }
    } catch { setToast({ type: 'error', message: 'Signing failed' }); }
    finally { setSigning(false); }
  };

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/dashboard/documents" style={{ color: 'var(--gold)' }}>Documents</Link></li>
          <li><Link href="/dashboard/activity">Activity</Link></li>
          <li><Link href="/dashboard/services">Services</Link></li>
        </ul>
        <div className="navbar-auth">
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
            <Link href="/dashboard/documents" className="sidebar-link active">
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
            <a onClick={handleLogout} className="sidebar-link" style={{ cursor: 'pointer', color: 'var(--red-light)', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <span className="link-icon"><LogOut size={18} color="var(--red-light)" /></span> Sign Out
            </a>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Documents</h1>
              <p className="page-subtitle">Upload and digitally sign documents</p>
            </div>
            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {uploading ? <div className="spinner"></div> : <FileUp size={18} />}
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* PIN info */}
          <div style={{ padding: '12px 16px', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="var(--gold)" />
            <span>Default signing PIN is <strong style={{ color: 'var(--gold)' }}>1234</strong> for demo accounts.</span>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><FileText size={48} color="var(--text-muted)" /></div>
              <h3>No documents yet</h3>
              <p>Upload a PDF document to get started with digital signatures.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.map((doc, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(206,17,38,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileBadge size={24} color="var(--red-light)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${doc.status === 'signed' ? 'badge-verified' : 'badge-pending'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {doc.status === 'signed' ? <><Check size={12} /> Signed</> : 'Unsigned'}
                  </span>
                  {doc.status !== 'signed' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSign(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PenTool size={14} /> Sign
                    </button>
                  )}
                  {doc.signature_hash && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.signature_hash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Sign Modal */}
      {showSign && (
        <div className="modal-overlay" onClick={() => setShowSign(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PenTool size={24} color="var(--gold)" /> Sign Document
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Enter your PIN to digitally sign this document. The signature will be cryptographically secured.
            </p>
            <div className="form-group">
              <label className="form-label">Signing PIN</label>
              <input className="form-input" type="password" placeholder="Enter your 4-digit PIN" maxLength={4}
                value={pin} onChange={e => setPin(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => { setShowSign(null); setPin(''); }}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={() => handleSign(showSign)} disabled={!pin || signing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {signing ? <div className="spinner"></div> : <PenTool size={18} />}
                {signing ? 'Signing...' : 'Sign Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`} onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}
    </>
  );
}
