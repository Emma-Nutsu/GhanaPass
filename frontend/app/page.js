'use client';
import Link from 'next/link';
import {
  Star, ShieldCheck, Key, FileText, Smartphone,
  Landmark, ShieldAlert, Shield, Activity, Lock,
  ArrowRight, CheckCircle, Smartphone as Phone,
  Shield as ShieldIcon, Fingerprint, Zap
} from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span>
        </Link>
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="/developer">Developers</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <div className="navbar-auth">
          <Link href="/auth/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '8rem 4rem' }}>
        <div style={{
          maxWidth: '1440px',
          width: '100%', margin: '0 auto', position: 'relative', zIndex: 1
        }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '6rem', alignItems: 'center' }}>

            {/* Left Column */}
            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                fontSize: 'clamp(3.0rem, 7vw, 7.0rem)',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1,
                letterSpacing: '-4px',
                marginBottom: '1.5rem'
              }}>
                One Identity.<br />
                <span style={{ color: '#D4A843', fontSize: '0.9em' }}>Infinite Access.</span>
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.4rem',
                lineHeight: 1.5,
                maxWidth: '750px',
                marginBottom: '4rem'
              }}>
                Verify your identity, sign documents, and access
                government and private services across Ghana — all
                from a single, secure digital identity powered by
                your Ghana Card.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <Link href="/auth/register" style={{
                  display: 'inline-block',
                  padding: '20px 48px',
                  background: 'white',
                  color: '#000',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  border: '1px solid white'
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(255,255,255,0.2)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Get Started
                </Link>
                <Link href="/developer" style={{
                  display: 'inline-block',
                  padding: '20px 48px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textDecoration: 'none',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.25s ease'
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Developer Portal →
                </Link>
              </div>
            </div>

            {/* Right Column: QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src="/qrcode.png"
                  alt="Ghana Pass QR Code"
                  style={{
                    width: '640px',
                    height: '640px',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 2,
                    filter: 'brightness(1.1) contrast(1.1) ',

                  }}
                />
              </div>
              <p style={{
                marginTop: '1.5rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                fontSize: '1.1rem',
                letterSpacing: '4px',
                textTransform: 'uppercase'
              }}>
                Scan to download the app
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features" style={{ background: '#000', maxWidth: '100%', padding: '8rem 4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label">Core Capabilities</div>
          <h2 className="section-title">Everything you need in one identity</h2>
          <p className="section-subtitle">
            Ghana Pass provides a comprehensive suite of digital identity services for citizens and businesses.
          </p>

          <div className="features-grid">
            {[
              { icon: <ShieldCheck size={48} color="#D4A843" />, title: 'Identity Verification', desc: 'Verify your identity using your Ghana Card. Our system connects directly with the National Identification Authority.' },
              { icon: <Key size={48} color="#D4A843" />, title: 'Single Sign-On (SSO)', desc: 'Log into any connected service with one tap. No more multiple passwords across government and private platforms.' },
              { icon: <FileText size={48} color="#D4A843" />, title: 'Digital Signatures', desc: 'Sign documents legally and securely from anywhere. Every signature is timestamped and cryptographically verified.' },
              { icon: <Smartphone size={48} color="#D4A843" />, title: 'SIM Verification', desc: 'Link and verify your SIM card registration. Telecom providers can verify identity through Ghana Pass API.' },
              { icon: <Landmark size={48} color="#D4A843" />, title: 'Financial Services', desc: 'Open bank accounts, verify for fintech services, and enable secure digital transactions with verified identity.' },
              { icon: <Shield size={48} color="#D4A843" />, title: 'Privacy & Security', desc: 'End-to-end encryption, biometric verification, and you control exactly what data each service can access.' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ animation: `fadeInUp 0.5s ease ${i * 0.1}s both`, background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div className="feature-icon" style={{ background: 'transparent', padding: 0, display: 'flex', alignItems: 'center' }}>{f.icon}</div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{f.title}</h3>
                </div>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="features-section" id="services" style={{ background: '#000', maxWidth: '100%', padding: '8rem 4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Get started in 3 simple steps</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            {[
              { step: '01', title: 'Register with Ghana Card', desc: 'Enter your Ghana Card number and phone to create your digital identity account.' },
              { step: '02', title: 'Verify Your Identity', desc: 'Complete facial recognition verification to confirm your identity securely.' },
              { step: '03', title: 'Access All Services', desc: 'Use GhanaPass to log in, sign documents, and transact across 500+ connected services.' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem', background: 'transparent', border: '1px solid white' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Partners */}
      <section className="features-section" style={{ background: '#000', maxWidth: '100%', padding: '8rem 4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Trusted By</div>
            <h2 className="section-title" style={{ marginBottom: '6rem' }}>Ghana&apos;s leading institutions</h2>

            {/* Governmental Agencies - Left to Right */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', color: '#D4A843' }}>Governmental Agencies</span>
            </div>
            <div className="marquee-container" style={{ marginBottom: '5rem' }}>
              <div className="marquee-content-reverse">
                {[
                  { name: 'Food and Drugs Authority', img: '/logos/FDA.png' },
                  { name: 'Electricty Company of Ghana', img: '/logos/ECG.jpg' },
                  { name: 'Ghana Education Service', img: '/logos/GES.png' },
                  { name: 'Ghana Civil Aviation Authority', img: '/logos/GCAA.png' },
                  { name: 'Ghana Ports and Harbours Authority', img: '/logos/GPHA.jpg' },
                  { name: 'Ghana Police Service', img: '/logos/GPS.png' },
                  { name: 'Ghana Standards Authority', img: '/logos/GSA.jpg' },
                  { name: 'National Communications Authority', img: '/logos/NCA.png' },
                  { name: 'National Petroleum Authority', img: '/logos/NPA.png' },
                  { name: 'Volta River Authority', img: '/logos/vra.png' },
                  { name: 'NHIS', img: '/logos/nhis.png' },
                  { name: 'Ghana Revenue Authority', img: '/logos/gra.png' },
                  { name: 'National Identification Authority', img: '/logos/nia.png' }
                ].concat([
                  { name: 'Food and Drugs Authority', img: '/logos/FDA.png' },
                  { name: 'Electricty Company of Ghana', img: '/logos/ECG.jpg' },
                  { name: 'Ghana Education Service', img: '/logos/GES.png' },
                  { name: 'Ghana Civil Aviation Authority', img: '/logos/GCAA.png' },
                  { name: 'Ghana Ports and Harbours Authority', img: '/logos/GPHA.jpg' },
                  { name: 'Ghana Police Service', img: '/logos/GPS.png' },
                  { name: 'Ghana Standards Authority', img: '/logos/GSA.jpg' },
                  { name: 'National Communications Authority', img: '/logos/NCA.png' },
                  { name: 'National Petroleum Authority', img: '/logos/NPA.png' },
                  { name: 'Volta River Authority', img: '/logos/vra.png' },
                  { name: 'NHIS', img: '/logos/nhis.png' },
                  { name: 'Ghana Revenue Authority', img: '/logos/gra.png' },
                  { name: 'National Identification Authority', img: '/logos/nia.png' }
                ]).map((partner, i) => (
                  <div key={i} className="partner-card">
                    {partner.img ? (
                      <img src={partner.img} alt={partner.name} />
                    ) : (
                      <span style={{ color: '#000', fontWeight: 700 }}>{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leading Institutions - Right to Left */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem', paddingRight: '4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', color: '#D4A843' }}>Leading Institutions</span>
            </div>
            <div className="marquee-container">
              <div className="marquee-content">
                {[
                  { name: 'MTN Ghana', img: '/logos/mtn.png' },
                  { name: 'Telecel', img: '/logos/telecel.png' },
                  { name: 'GCB Bank', img: '/logos/gcb.png' },
                  { name: 'Bank of Ghana', img: '/logos/bog.png' },
                  { name: 'Stanbic Bank', img: '/logos/stanbic.png' },
                  { name: 'Ecobank', img: '/logos/ecobank.png' },
                  { name: 'Standard Chartered', img: '/logos/stanchart.png' }
                ].concat([
                  { name: 'MTN Ghana', img: '/logos/mtn.png' },
                  { name: 'Telecel', img: '/logos/telecel.png' },
                  { name: 'GCB Bank', img: '/logos/gcb.png' },
                  { name: 'Bank of Ghana', img: '/logos/bog.png' },
                  { name: 'Stanbic Bank', img: '/logos/stanbic.png' },
                  { name: 'Ecobank', img: '/logos/ecobank.png' },
                  { name: 'Standard Chartered', img: '/logos/stanchart.png' }
                ]).map((partner, i) => (
                  <div key={i} className="partner-card">
                    {partner.img ? (
                      <img src={partner.img} alt={partner.name} />
                    ) : (
                      <span style={{ color: '#000', fontWeight: 700 }}>{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center', background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '1rem' }}>
          Ready to get your <span style={{ color: 'var(--gold)' }}>GhanaPass</span>?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
          Join millions of Ghanaians using their digital identity to access services seamlessly.
        </p>
        <Link href="/auth/register" className="btn btn-primary btn-lg">Create Your Account</Link>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ background: '#000', color: '#fff', fontSize: '1.25rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 4rem' }}>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ghana<span>Pass</span></div>
            <p style={{ fontSize: '1.25rem', lineHeight: 1.6, maxWidth: '400px' }}>Ghana&apos;s centralized digital identity platform. Secure, accessible, and built for every citizen.</p>
          </div>
          <div className="footer-section">
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>Platform</h4>
            <a href="#features" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Features</a>
            <a href="/auth/register" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Register</a>
            <a href="/auth/login" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Sign In</a>
            <a href="/dashboard" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Dashboard</a>
          </div>
          <div className="footer-section">
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>Developers</h4>
            <a href="/developer" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>API Docs</a>
            <a href="/developer" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Sandbox</a>
            <a href="/developer" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Integrations</a>
            <a href="/developer" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Webhooks</a>
          </div>
          <div className="footer-section">
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>Legal</h4>
            <a href="#" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Terms of Service</a>
            <a href="#" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Data Protection</a>
            <a href="#" style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'block' }}>Contact</a>
          </div>
        </div>
        <div className="footer-bottom" style={{ fontSize: '1rem', marginTop: '6rem', opacity: 0.6 }}>
          © 2026 Ghana Pass. Republic of Ghana. All rights reserved.
        </div>
      </footer>
    </>
  );
}
