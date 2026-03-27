'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  Star, ShieldCheck, Building2, Lock, 
  CheckCircle, XCircle, Shield, Info,
  ArrowRight, User, Phone, FileText, Fingerprint
} from 'lucide-react';

function ConsentContent() {
  const searchParams = useSearchParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');

    if (clientId) {
      fetch(`/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&response_type=code&scope=${scope || 'openid profile'}&state=${state || ''}`)
        .then(res => res.json())
        .then(data => { setClient(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      // Demo mode
      setClient({
        client: { name: 'Ghana Revenue Authority', description: 'GRA Tax Filing Portal', id: 'demo' },
        requested_scopes: ['openid', 'profile', 'ghana_card', 'phone'],
        redirect_uri: 'https://gra.gov.gh/callback',
        state: 'demo'
      });
      setLoading(false);
    }
  }, [searchParams]);

  const handleConsent = async (approved) => {
    const token = localStorage.getItem('gp_token');
    const res = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        client_id: client.client.id,
        redirect_uri: client.redirect_uri,
        scope: client.requested_scopes.join(' '),
        state: client.state,
        approved
      })
    });
    const data = await res.json();
    if (data.redirect) {
      alert(`Would redirect to: ${data.redirect}`);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;
  }

  const scopeDescriptions = {
    openid: 'Access your unique identifier',
    profile: 'View your name and basic profile',
    ghana_card: 'Verify your Ghana Card number',
    phone: 'Access your phone number',
    email: 'View your email address',
  };

  return (
    <div className="auth-page">
      <div className="auth-card consent-card">
        <div className="auth-logo">
          <div className="logo-icon"><Star size={24} fill="var(--gold)" color="var(--gold)" /></div>
          <h2 style={{ fontSize: '1.2rem' }}>Authorization Request</h2>
        </div>

        {client && (
          <>
            <div className="consent-app">
              <div className="consent-app-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{client.client.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.client.description}</div>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <strong>{client.client.name}</strong> is requesting access to your Ghana Pass identity:
            </p>

            <ul className="consent-scopes">
              {client.requested_scopes.map((scope, i) => (
                <li key={i}>
                  <span>{scopeDescriptions[scope] || scope}</span>
                </li>
              ))}
            </ul>

            <div style={{ background: 'rgba(0,107,63,0.1)', border: '1px solid rgba(0,107,63,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--green-light)" />
              <span>Ghana Pass will never share your password or biometric data.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn btn-secondary btn-lg" onClick={() => handleConsent(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <XCircle size={18} /> Deny
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => handleConsent(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Authorize
              </button>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          You can revoke this access anytime from your <Link href="/dashboard/services" style={{ color: 'var(--gold)' }}>dashboard</Link>.
        </p>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>}>
      <ConsentContent />
    </Suspense>
  );
}
