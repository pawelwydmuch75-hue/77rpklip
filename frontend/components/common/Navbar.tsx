'use client';

import { useState, FormEvent } from 'react';
import { Search, Bell, Upload, LogOut, User, Menu, Settings, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useServer } from '@/context/ServerContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { server, clearServer } = useServer();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleChangeServer = () => {
    clearServer();
    router.push('/');
  };

  const serverLabel = server === 'wl-on' ? 'WL:ON' : 'WL:OFF';

  return (
    <nav className="navbar">
      {/* Hamburger */}
      <button className="btn-icon" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} />
      </button>

      {/* Logo 77RP */}
      <Link href="/" className="navbar-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_77rp.png"
          alt="77RP Server"
          style={{
            height: '48px',
            width: 'auto',
            mixBlendMode: 'screen',
            filter: 'brightness(1.1) contrast(1.05)',
          }}
        />
      </Link>

      {/* Wyszukiwarka */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Szukaj filmów na 77RP..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Wyszukaj filmy"
        />
        <button type="submit" aria-label="Szukaj">
          <Search size={18} />
        </button>
      </form>

      {/* Akcje */}
      <div className="navbar-actions">
        {/* Server badge */}
        <button
          className="server-badge"
          onClick={handleChangeServer}
          title="Zmień serwer"
          aria-label="Zmień serwer"
        >
          <span className={`server-badge-dot ${server === 'wl-on' ? 'wlon' : 'wloff'}`} />
          <span>{serverLabel}</span>
          <RefreshCw size={11} style={{ opacity: 0.5, marginLeft: 2 }} />
        </button>

        {isAuthenticated ? (
          <>
            <Link href="/upload" className="btn-outline" style={{ fontSize: '13px' }} title="Dodaj film">
              <Upload size={16} /><span> Dodaj film</span>
            </Link>
            <button className="btn-icon" aria-label="Powiadomienia">
              <Bell size={20} />
            </button>
            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-icon"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu użytkownika"
                style={{ padding: 0, borderRadius: '50%' }}
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.username}
                    width={32} height={32}
                    className="avatar"
                    unoptimized
                  />
                ) : (
                  <div className="avatar" style={{ background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                  </div>
                )}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 40, right: 0,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 8, minWidth: 200, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-soft)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{user?.username}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{user?.discordTag || user?.handle}</div>
                    <div style={{ marginTop: 6 }}>
                      {user?.hasWl ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          ✓ 77RP Whitelist
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ffaa00', background: 'rgba(255,170,0,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          77RP Gracz (WL:OFF)
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/channel?id=${user?.id || 'me'}`}
                    className="sidebar-item"
                    onClick={() => setMenuOpen(false)}
                    style={{ gap: 12, padding: '8px 12px' }}
                  >
                    <User size={16} /> Twój kanał
                  </Link>
                  <Link
                    href="/settings/channel"
                    className="sidebar-item"
                    onClick={() => setMenuOpen(false)}
                    style={{ gap: 12, padding: '8px 12px' }}
                  >
                    <Settings size={16} /> Personalizuj kanał
                  </Link>
                  <button
                    className="sidebar-item"
                    style={{ gap: 12, padding: '8px 12px', width: '100%', border: 'none', background: 'none', color: '#ff6666', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => { logout(); setMenuOpen(false); router.push('/'); }}
                  >
                    <LogOut size={16} /> Wyloguj się
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="btn-primary"
            style={{
              background: '#5865F2',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Zaloguj przez Discord</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
