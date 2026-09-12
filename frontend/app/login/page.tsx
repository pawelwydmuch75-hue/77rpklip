'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

function DiscordIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function LoginContent() {
  const { loginWithDiscord, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discordAuthUrl, setDiscordAuthUrl] = useState<string | null>(null);
  const codeHandledRef = useRef(false);

  // Sprawdź czy jest URL OAuth z backendu
  useEffect(() => {
    const currentRedirect = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    api.get('/auth/discord/url', { params: { redirect_uri: currentRedirect } }).then(({ data }) => {
      if (data.configured && data.url) {
        setDiscordAuthUrl(data.url);
      }
    }).catch(() => {});
  }, []);

  // Jeśli użytkownik wraca z przekierowania Discord z parametrem ?code=...
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !codeHandledRef.current) {
      codeHandledRef.current = true;
      setLoading(true);
      const currentRedirect = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      loginWithDiscord({ code, redirectUri: currentRedirect })
        .then(() => router.push('/'))
        .catch((err) => {
          setError(err.response?.data?.message || 'Nie udało się zalogować przez Discord.');
          setLoading(false);
        });
    }
  }, [searchParams, loginWithDiscord, router]);

  // Jeśli już zalogowany, przekieruj
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handlePersonaLogin = async (persona: 'wl-on' | 'wl-off' | 'no-guild') => {
    setError('');
    setLoading(true);
    try {
      await loginWithDiscord({ persona });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd autoryzacji.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialDiscordClick = async () => {
    setError('');
    if (discordAuthUrl) {
      window.location.href = discordAuthUrl;
      return;
    }
    const currentRedirect = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://77rptube.surge.sh/login';
    setLoading(true);
    try {
      const { data } = await api.get('/auth/discord/url', { params: { redirect_uri: currentRedirect } });
      if (data.configured && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Direct fallback to Discord OAuth URL
    }
    const directUrl = `https://discord.com/oauth2/authorize?client_id=1547336130742194256&response_type=code&redirect_uri=${encodeURIComponent(currentRedirect)}&scope=identify%20guilds%20guilds.members.read`;
    window.location.href = directUrl;
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="auth-card" style={{ maxWidth: '480px', width: '100%', background: '#101010', border: '1px solid #222222', borderRadius: '16px', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image
            src="/logo_77rp.png"
            alt="77RP"
            width={140}
            height={60}
            unoptimized
            style={{ width: 'auto', height: 50, margin: '0 auto 16px' }}
          />
          <h1 className="auth-title" style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.5, color: '#fff', margin: '0 0 8px' }}>
            Zaloguj się przez Discord
          </h1>
          <p className="auth-subtitle" style={{ fontSize: 13, color: '#888888', margin: 0, lineHeight: 1.5 }}>
            Weryfikacja konta odbywa się automatycznie na podstawie Twojej obecności na serwerze 77RP oraz posiadania Whitelist.
          </p>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255, 60, 60, 0.1)', border: '1px solid #ff4444', borderRadius: 8, color: '#ff6666', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Główny przycisk logowania przez Discord */}
        <button
          onClick={handleOfficialDiscordClick}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 20px',
            background: '#5865F2',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 0.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 18px rgba(88, 101, 242, 0.4)',
            marginBottom: 24,
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#4752c4')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#5865F2')}
        >
          <DiscordIcon />
          <span>{loading ? 'Weryfikacja Discord...' : 'Zaloguj przez Discord'}</span>
        </button>

        <div style={{ position: 'relative', textAlign: 'center', margin: '24px 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #222222', margin: 0 }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#101010', padding: '0 12px', fontSize: 11, fontWeight: 800, color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Tryby testowe konta
          </span>
        </div>

        <p style={{ fontSize: 12, color: '#777777', marginBottom: 12, textAlign: 'center' }}>
          Wybierz profil testowy, aby sprawdzić zachowanie uprawnień:
        </p>

        {/* Profile testowe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 1. Gracz z WL */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handlePersonaLogin('wl-on')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#151515',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} color="#00ff88" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Gracz 77RP z Whitelist</div>
                <div style={{ fontSize: 11, color: '#888888' }}>Obecny na DC • Ranga WL (Dostęp: WL:ON + WL:OFF)</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Wybierz</span>
          </button>

          {/* 2. Gracz bez WL */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handlePersonaLogin('wl-off')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#151515',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#888888')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="#3ea6ff" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Gracz 77RP bez Whitelist</div>
                <div style={{ fontSize: 11, color: '#888888' }}>Obecny na DC • Brak WL (Dostęp tylko: WL:OFF)</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Wybierz</span>
          </button>

          {/* 3. Brak serwera DC */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handlePersonaLogin('no-guild')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#151515',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#ff4444')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={20} color="#ff4444" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Użytkownik spoza Discorda 77RP</div>
                <div style={{ fontSize: 11, color: '#ff6666' }}>Brak na serwerze DC (Całkowity brak uploadu)</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ff4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>Wybierz</span>
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888888', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Wróć do przeglądania filmów
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ładowanie...</div>}>
      <LoginContent />
    </Suspense>
  );
}
