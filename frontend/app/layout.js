import './globals.css';

export const metadata = {
  title: 'Ghana Pass — National Digital Identity Platform',
  description: 'Ghana\'s centralized digital identity and authentication platform. Verify your identity, sign documents digitally, and access services securely.',
  keywords: 'Ghana Pass, digital identity, Ghana Card, authentication, SSO, digital signature',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
