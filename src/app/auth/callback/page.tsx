'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenStorage } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access  = params.get('access');
    const refresh = params.get('refresh');
    if (access && refresh) {
      tokenStorage.set(access, refresh);
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${access}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((user) => {
          router.replace(user?.role === 'ADMIN' ? '/admin/analytics' : '/compte');
        })
        .catch(() => router.replace('/compte'));
    } else {
      router.replace('/compte');
    }
  }, [params, router]);

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
