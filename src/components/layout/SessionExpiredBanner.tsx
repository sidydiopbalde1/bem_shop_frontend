'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function SessionExpiredBanner() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();

  if (!sessionExpired) return null;

  const handleLogin = () => {
    clearSessionExpired();
    router.push('/auth/login');
  };

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#1a1a2e',
        borderBottom: '2px solid #e63946',
        color: '#f1faee',
        fontSize: '0.9rem',
        flexWrap: 'wrap',
      }}
    >
      <span>
        <strong>Session expirée.</strong> Votre session a expiré en raison d&apos;une longue inactivité. Veuillez vous reconnecter pour continuer.
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={handleLogin}
          style={{
            padding: '0.35rem 0.9rem',
            backgroundColor: '#e63946',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          Se reconnecter
        </button>
        <button
          onClick={clearSessionExpired}
          aria-label="Fermer"
          style={{
            padding: '0.35rem 0.6rem',
            backgroundColor: 'transparent',
            color: '#f1faee',
            border: '1px solid #f1faee55',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
