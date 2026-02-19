import { useEffect, useState } from 'react';

export default function CookiesImporter() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const importStr = params?.get('import') || '';

    if (!importStr) {
      setStatus('invalid');
      return;
    }

    try {
      const cookiePairs = importStr.split(';').map((c) => c.trim()).filter(Boolean);
      cookiePairs.forEach((pair) => {
        document.cookie = pair + '; path=/; SameSite=Lax';
      });
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch {
      setStatus('invalid');
    }
  }, []);

  if (status === 'invalid') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>Invalid import link</h1>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>Cookies imported</h1>
        <p>Session restored. Redirecting…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <p>Loading…</p>
    </div>
  );
}
