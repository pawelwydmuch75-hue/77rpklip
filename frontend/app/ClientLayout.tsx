'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { ServerProvider, useServer } from '@/context/ServerContext';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ServerSelector from '@/components/common/ServerSelector';

// Strony bez layoutu (auth)
const NO_LAYOUT_PATHS = ['/login', '/register'];

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { server, setServer, isReady } = useServer();
  const isAuthPage = NO_LAYOUT_PATHS.includes(pathname);

  // Domyślnie zamknięty na mobile, otwarty na desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // desktop = otwarty, mobile = zamknięty
    };
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Zamknij sidebar po zmianie strony (na mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Pokaż selektor serwera TYLKO na stronie głównej (/) po załadowaniu stanu z localStorage, gdy nie wybrano serwera
  if (pathname === '/' && isReady && !server) {
    return <ServerSelector />;
  }

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Overlay – ciemne tło na mobile gdy sidebar otwarty */}
      <div
        className={`sidebar-overlay${sidebarOpen && isMobile ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar isOpen={sidebarOpen} />
      <main
        className="main-content"
        style={{ marginLeft: (!isMobile && sidebarOpen) ? 'var(--sidebar-width)' : '0' }}
      >
        {children}
      </main>

      {/* 77RP Floating Server Switcher (zgodny z oficjalną stroną 77RP) */}
      <div className="server-floating-switcher">
        <span className="server-floating-label">
          Przeglądasz {server === 'wl-on' ? 'WL:ON.' : 'WL:OFF.'}
        </span>
        <button
          className="server-floating-btn"
          onClick={() => setServer(server === 'wl-on' ? 'wl-off' : 'wl-on')}
        >
          Przełącz: <strong>{server === 'wl-on' ? 'WL:OFF' : 'WL:ON'}</strong>
        </button>
      </div>
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ServerProvider>
        <InnerLayout>{children}</InnerLayout>
      </ServerProvider>
    </AuthProvider>
  );
}
