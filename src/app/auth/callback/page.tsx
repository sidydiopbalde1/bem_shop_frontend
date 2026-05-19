'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { tokenStorage } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function CallbackHandler() {
  const params = useSearchParams();

  useEffect(() => {
    const access  = params.get('access');
    const refresh = params.get('refresh');

    function navigate(dest: string) {
      // Rechargement complet indispensable : router.replace() est client-side
      // et ne re-monte pas AuthContext, donc le token ne serait pas lu.
      window.location.href = dest;
    }

    if (access && refresh) {
      tokenStorage.set(access, refresh);
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${access}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((user) => {
          if (user?.role === 'ADMIN') {
            navigate('/admin/analytics');
          } else {
            const redirect = sessionStorage.getItem('redirect_after_login') ?? '/compte';
            sessionStorage.removeItem('redirect_after_login');
            navigate(redirect);
          }
        })
        .catch(() => navigate('/compte'));
    } else {
      navigate('/compte');
    }
  }, [params]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '16px',
    }}>
      <span style={{
        display: 'inline-block', width: '28px', height: '28px',
        border: '3px solid var(--bem-gray-100)',
        borderTopColor: 'var(--bem-red)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ fontSize: '14px', color: 'var(--bem-gray-400)' }}>
        Connexion avec Google en cours…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
