'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Compass, Clock, ThumbsUp, ListVideo,
  Flame, Sparkles, Star
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useServer } from '@/context/ServerContext';

interface SidebarProps {
  isOpen: boolean;
}

const mainLinks = [
  { href: '/', label: 'Wszystkie', icon: Home },
  { href: '/?sort=latest', label: 'Nowe', icon: Sparkles },
  { href: '/?sort=popular', label: 'Popularne', icon: Flame },
  { href: '/?sort=top_rated', label: 'Wysoko oceniane', icon: Star },
];

const libraryLinks = [
  { href: '/history', label: 'Historia', icon: Clock },
  { href: '/liked', label: 'Polubione', icon: ThumbsUp },
  { href: '/playlists', label: 'Playlisty', icon: ListVideo },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { server, clearServer } = useServer();

  const handleChangeServer = () => {
    clearServer();
    router.push('/');
  };

  const serverLabel = server === 'wl-on' ? 'WL:ON' : 'WL:OFF';
  const serverColor = server === 'wl-on' ? 'var(--accent)' : '#aaa';

  return (
    <>
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>

        {/* Server indicator */}
        <div className="sidebar-server-box">
          <div className="sidebar-server-header">
            <span className="sidebar-server-label">Wybrany serwer</span>
            <button
              onClick={handleChangeServer}
              className="sidebar-server-switch-btn"
              title="Wróć do wyboru serwera"
            >
              Zmień
            </button>
          </div>
          <div className="sidebar-server-name">
            <span className={`server-context-dot ${server === 'wl-on' ? 'wlon' : 'wloff'}`} />
            <span>77RP {serverLabel}</span>
          </div>
        </div>

        <div style={{ height: 8 }} />

        {/* Główne */}
        {mainLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-item${pathname === href ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        <hr className="sidebar-divider" />

        {/* Biblioteka (tylko zalogowani) */}
        {isAuthenticated && (
          <>
            <div className="sidebar-section-title">Biblioteka</div>
            {libraryLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="sidebar-item">
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
            <hr className="sidebar-divider" />
          </>
        )}

        {/* Mój kanał */}
        {isAuthenticated && (
          <>
            <hr className="sidebar-divider" />
            <div className="sidebar-section-title">Twój kanał</div>
            <Link href={`/channel?id=${user?.id || 'me'}`} className="sidebar-item">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={24} height={24}
                  className="sidebar-channel-avatar"
                  unoptimized
                />
              ) : (
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--bg-hover)',
                }} />
              )}
              <span>{user?.username}</span>
            </Link>
          </>
        )}

        <div style={{ height: 24 }} />
      </aside>
    </>
  );
}
