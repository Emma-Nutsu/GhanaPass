'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Star, Terminal, Code, BookOpen,
  Cpu, Link2, Lock, ShieldCheck,
  Smartphone, PenTool, ExternalLink,
  CheckCircle, Globe, Zap, Shield,
  ArrowRight, Play, Info
} from 'lucide-react';

import { API_BASE } from '../../utils/api';

export default function DeveloperPortal() {
  const [tab, setTab] = useState('docs');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const runSandboxTest = async (endpoint, method, body) => {
    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      const start = Date.now();
      const options = { method, headers: { 'Content-Type': 'application/json' } };
      const token = localStorage.getItem('gp_token');
      if (token) options.headers['Authorization'] = `Bearer ${token}`;
      if (body) options.body = JSON.stringify(body);

      // Prepend API_BASE and remove /api prefix from endpoint if present
      const targetUrl = endpoint.startsWith('/api') 
        ? `${API_BASE}${endpoint.substring(4)}` 
        : `${API_BASE}${endpoint}`;

      const res = await fetch(targetUrl, options);
      const data = await res.json();
      const duration = Date.now() - start;

      setSandboxResult({
        status: res.status,
        statusText: res.statusText,
        duration,
        data: JSON.stringify(data, null, 2)
      });
    } catch (err) {
      setSandboxResult({ status: 'ERROR', data: err.message, duration: 0 });
    }
    setSandboxLoading(false);
  };

  const apiEndpoints = [
    { method: 'POST', path: '/api/auth/register', desc: 'Register a new citizen', body: { ghana_card_number: 'GHA-999888777-1', phone: '+233209999999', full_name: 'Test User', date_of_birth: '1995-06-15', password: 'test123' } },
    { method: 'POST', path: '/api/auth/login', desc: 'Login with Ghana Card', body: { ghana_card_number: 'GHA-123456789-1', password: 'pass123' } },
    { method: 'GET', path: '/api/user/profile', desc: 'Get user profile (auth required)' },
    { method: 'POST', path: '/api/verify/identity', desc: 'Verify Ghana Card identity', body: { ghana_card_number: 'GHA-123456789-1' } },
    { method: 'POST', path: '/api/verify/face', desc: 'Facial recognition verification', body: { user_id: 'demo' } },
    { method: 'POST', path: '/api/sim/verify', desc: 'Verify SIM card ownership', body: { phone_number: '+233240000001', ghana_card_number: 'GHA-123456789-1' } },
    { method: 'GET', path: '/api/user/activity', desc: 'Get login activity log' },
    { method: 'GET', path: '/api/user/consents', desc: 'Get linked services' },
    { method: 'GET', path: '/api/health', desc: 'API health check' },
  ];

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div>
          <span>Ghana<span className="brand-accent">Pass</span></span>
          <span style={{ fontSize: '0.7rem', color: 'var(--green-light)', fontWeight: 700, marginLeft: '8px', padding: '2px 8px', background: 'rgba(0,107,63,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Code size={10} /> DEVELOPER
          </span>
        </Link>
        <ul className="navbar-links">
          <li><a onClick={() => setTab('docs')} style={{ cursor: 'pointer', color: tab === 'docs' ? 'var(--gold)' : undefined }}>API Docs</a></li>
          <li><a onClick={() => setTab('sandbox')} style={{ cursor: 'pointer', color: tab === 'sandbox' ? 'var(--gold)' : undefined }}>Sandbox</a></li>
          <li><a onClick={() => setTab('integration')} style={{ cursor: 'pointer', color: tab === 'integration' ? 'var(--gold)' : undefined }}>Integration Guide</a></li>
        </ul>
        <div className="navbar-auth">
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <a href="/api/docs" target="_blank" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Swagger UI <ExternalLink size={14} />
          </a>
        </div>
      </nav>

      <div style={{ paddingTop: '72px', maxWidth: '1200px', margin: '0 auto', padding: '100px 2rem 4rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} /> Developer Portal
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem' }}>
            Build with <span style={{ color: 'var(--gold)' }}>GhanaPass</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
            Integrate national identity verification into your applications with our REST API and OAuth 2.0 SSO.
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ justifyContent: 'center', maxWidth: '500px', margin: '0 auto 2rem' }}>
          <button className={`tab ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} /> API Reference
          </button>
          <button className={`tab ${tab === 'sandbox' ? 'active' : ''}`} onClick={() => setTab('sandbox')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} /> Sandbox
          </button>
          <button className={`tab ${tab === 'integration' ? 'active' : ''}`} onClick={() => setTab('integration')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={16} /> Integration
          </button>
        </div>

        {/* API DOCS TAB */}
        {tab === 'docs' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>API Endpoints</h2>
              <a href="/api/docs" target="_blank" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Open Swagger UI <ExternalLink size={14} />
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Auth endpoints */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} /> Authentication
              </h3>
              {[
                { method: 'POST', path: '/api/auth/register', desc: 'Register a new user with Ghana Card' },
                { method: 'POST', path: '/api/auth/login', desc: 'Login and receive JWT tokens' },
                { method: 'POST', path: '/api/auth/refresh', desc: 'Refresh access token' },
                { method: 'POST', path: '/api/auth/logout', desc: 'Invalidate session' },
              ].map((e, i) => (
                <div key={i} className="api-card">
                  <div className="api-card-header">
                    <span className={`api-method ${e.method.toLowerCase()}`}>{e.method}</span>
                    <span className="api-path">{e.path}</span>
                  </div>
                  <div className="api-card-body">{e.desc}</div>
                </div>
              ))}

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> Identity Verification
              </h3>
              {[
                { method: 'POST', path: '/api/verify/identity', desc: 'Verify identity using Ghana Card number' },
                { method: 'POST', path: '/api/verify/face', desc: 'Facial recognition with liveness detection' },
              ].map((e, i) => (
                <div key={i} className="api-card">
                  <div className="api-card-header">
                    <span className={`api-method ${e.method.toLowerCase()}`}>{e.method}</span>
                    <span className="api-path">{e.path}</span>
                  </div>
                  <div className="api-card-body">{e.desc}</div>
                </div>
              ))}

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} /> SIM Verification
              </h3>
              <div className="api-card">
                <div className="api-card-header"><span className="api-method post">POST</span><span className="api-path">/api/sim/verify</span></div>
                <div className="api-card-body">Verify SIM ownership against Ghana Card registration</div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenTool size={18} /> Digital Signatures
              </h3>
              {[
                { method: 'POST', path: '/api/documents/upload', desc: 'Upload a PDF document' },
                { method: 'POST', path: '/api/documents/sign', desc: 'Digitally sign a document with PIN' },
                { method: 'GET', path: '/api/documents', desc: 'List user documents' },
                { method: 'GET', path: '/api/documents/:id/verify', desc: 'Verify document signature integrity' },
              ].map((e, i) => (
                <div key={i} className="api-card">
                  <div className="api-card-header">
                    <span className={`api-method ${e.method.toLowerCase()}`}>{e.method}</span>
                    <span className="api-path">{e.path}</span>
                  </div>
                  <div className="api-card-body">{e.desc}</div>
                </div>
              ))}

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={18} /> OAuth 2.0 / OpenID Connect
              </h3>
              {[
                { method: 'GET', path: '/api/oauth/authorize', desc: 'Authorization endpoint — start SSO flow' },
                { method: 'POST', path: '/api/oauth/token', desc: 'Exchange authorization code for tokens' },
                { method: 'GET', path: '/api/oauth/userinfo', desc: 'OpenID Connect userinfo endpoint' },
              ].map((e, i) => (
                <div key={i} className="api-card">
                  <div className="api-card-header">
                    <span className={`api-method ${e.method.toLowerCase()}`}>{e.method}</span>
                    <span className="api-path">{e.path}</span>
                  </div>
                  <div className="api-card-body">{e.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SANDBOX TAB */}
        {tab === 'sandbox' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>API Sandbox</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Test API endpoints live. Login first to test authenticated endpoints.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Available Tests</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {apiEndpoints.map((ep, i) => (
                    <button key={i} className="card" onClick={() => runSandboxTest(ep.path, ep.method, ep.body)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                      <span className={`api-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{ep.path}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ep.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Response</h3>
                <div className="card-glass" style={{ minHeight: '400px' }}>
                  {sandboxLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                      <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                    </div>
                  ) : sandboxResult ? (
                    <div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, background: sandboxResult.status < 300 ? 'rgba(0,168,107,0.15)' : 'rgba(206,17,38,0.15)', color: sandboxResult.status < 300 ? '#00A86B' : '#EF4444' }}>
                          {sandboxResult.status} {sandboxResult.statusText}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sandboxResult.duration}ms</span>
                      </div>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', maxHeight: '500px', color: 'var(--green-light)', fontFamily: 'Courier New, monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {sandboxResult.data}
                      </pre>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
                      <Play size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                      Click an endpoint to test
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATION GUIDE TAB */}
        {tab === 'integration' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Integration Guide</h2>

            <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={24} color="var(--gold)" /> SSO Integration (OAuth 2.0)
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Add &quot;Login with Ghana Pass&quot; to your application in 3 steps:
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>Step 1: Redirect to Ghana Pass</h4>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', color: '#60A5FA', fontFamily: 'Courier New, monospace' }}>
                  {`GET /api/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &response_type=code
  &scope=openid profile ghana_card
  &state=random_state_string`}
                </pre>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>Step 2: Exchange Code for Tokens</h4>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', color: '#60A5FA', fontFamily: 'Courier New, monospace' }}>
                  {`POST /api/oauth/token
{
  "grant_type": "authorization_code",
  "code": "AUTHORIZATION_CODE",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "https://yourapp.com/callback"
}`}
                </pre>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>Step 3: Get User Info</h4>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', color: '#60A5FA', fontFamily: 'Courier New, monospace' }}>
                  {`GET /api/oauth/userinfo
Authorization: Bearer ACCESS_TOKEN

Response:
{
  "sub": "user-id",
  "name": "Ama Mensah",
  "ghana_card_number": "GHA-123456789-1",
  "phone_number": "+233240000001",
  "identity_verified": true
}`}
                </pre>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={24} color="var(--gold)" /> SIM Verification API
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>For telecom providers to verify SIM registration:</p>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', color: '#60A5FA', fontFamily: 'Courier New, monospace' }}>
                {`POST /api/sim/verify
Authorization: Bearer API_TOKEN
{
  "phone_number": "+233240000001",
  "ghana_card_number": "GHA-123456789-1"
}

Response:
{
  "status": "verified",
  "provider": "MTN",
  "identity_match": true,
  "details": {
    "owner_name": "Ama Mensah",
    "verification_method": "ghana_card + phone_match"
  }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
