'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useServer, ServerType } from '@/context/ServerContext';

export default function ServerSelector() {
  const { setServer } = useServer();
  const [hoveredPanel, setHoveredPanel] = useState<ServerType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const choose = (s: ServerType) => {
    setServer(s);
  };

  const getCharStyle = (side: ServerType): React.CSSProperties => ({
    filter:
      hoveredPanel === side
        ? 'grayscale(0%) brightness(1.06) contrast(1.02) drop-shadow(0 0 16px rgba(255,106,0,0.8)) drop-shadow(0 0 40px rgba(255,106,0,0.4))'
        : 'grayscale(100%) brightness(0.65) contrast(1.12)',
    transform: hoveredPanel === side ? 'scale(1.04) translateY(-8px)' : 'scale(1) translateY(0)',
    transition: 'filter 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
    width: isMobile ? '40vw' : '30vw',
    maxWidth: isMobile ? '40vw' : '30vw',
    height: 'auto',
    maxHeight: isMobile ? '40vh' : '72vh',
    objectFit: 'contain' as const,
    objectPosition: 'bottom center',
    display: 'block',
    willChange: 'filter, transform',
  });

  const getHintStyle = (side: ServerType): React.CSSProperties => ({
    display: 'block',
    fontSize: isMobile ? 10 : 13,
    fontWeight: 800,
    letterSpacing: isMobile ? '2px' : '3.5px',
    textTransform: 'uppercase',
    color: hoveredPanel === side ? '#aaaaaa' : '#555555',
    marginBottom: isMobile ? 4 : 10,
    transition: 'color 0.3s ease',
  });

  const getTitleStyle = (side: ServerType): React.CSSProperties => ({
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: isMobile ? 40 : 68,
    fontWeight: 900,
    letterSpacing: hoveredPanel === side ? '5px' : '3px',
    lineHeight: 1,
    color: '#ffffff',
    margin: 0,
    transition: 'letter-spacing 0.3s ease',
  });

  // ── Układ mobilny: dwie kafelki pionowo ──
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', zIndex: 9999,
      }}>
        {/* WL:OFF */}
        <div
          role="button" tabIndex={0}
          aria-label="Wybierz serwer WL:OFF"
          onClick={() => choose('wl-off')}
          onKeyDown={(e) => e.key === 'Enter' && choose('wl-off')}
          onTouchStart={() => setHoveredPanel('wl-off')}
          onTouchEnd={() => setHoveredPanel(null)}
          style={{
            flex: 1, background: hoveredPanel === 'wl-off' ? '#1a1a1a' : '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 32px', borderBottom: '1px solid #222',
            transition: 'background 0.3s',
            cursor: 'pointer',
          }}
        >
          <div>
            <span style={getHintStyle('wl-off')}>Interesuję mnie</span>
            <h2 style={getTitleStyle('wl-off')}>WL:OFF</h2>
            <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>Bez Whitelist</p>
          </div>
          <Image
            src="/char_wloff.png" alt="WL:OFF postać"
            width={700} height={900}
            style={getCharStyle('wl-off')}
            priority unoptimized
          />
        </div>

        {/* Divider */}
        <div style={{
          height: 2, background: 'linear-gradient(90deg, transparent, #333, transparent)',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#0a0a0a', padding: '2px 12px',
            fontSize: 10, color: '#444', letterSpacing: 2,
            fontWeight: 700, textTransform: 'uppercase',
          }}>VS</span>
        </div>

        {/* WL:ON */}
        <div
          role="button" tabIndex={0}
          aria-label="Wybierz serwer WL:ON"
          onClick={() => choose('wl-on')}
          onKeyDown={(e) => e.key === 'Enter' && choose('wl-on')}
          onTouchStart={() => setHoveredPanel('wl-on')}
          onTouchEnd={() => setHoveredPanel(null)}
          style={{
            flex: 1, background: hoveredPanel === 'wl-on' ? '#151009' : '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 32px',
            transition: 'background 0.3s',
            cursor: 'pointer',
          }}
        >
          <div>
            <span style={getHintStyle('wl-on')}>Interesuję mnie</span>
            <h2 style={{ ...getTitleStyle('wl-on'), color: hoveredPanel === 'wl-on' ? 'var(--accent)' : '#fff' }}>
              WL:ON
            </h2>
            <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>Z Whitelist</p>
          </div>
          <Image
            src="/char_wlon.png" alt="WL:ON postać"
            width={700} height={900}
            style={getCharStyle('wl-on')}
            priority unoptimized
          />
        </div>
      </div>
    );
  }

  // ── Układ desktopowy — oryginalny ──
  return (
    <div className="server-select-screen">

      {/* Tło: lewa strona grafitowa z ukośnym cięciem */}
      <div className="server-bg-left" />

      {/* Central diagonal divider SVG */}
      <svg
        className="server-center-divider-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="535" y1="0"
          x2="465" y2="1000"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
      </svg>

      {/* WL:OFF – Lewa strona */}
      <div
        className="server-panel server-panel-off"
        role="button"
        tabIndex={0}
        aria-label="Wybierz serwer WL:OFF"
        onClick={() => choose('wl-off')}
        onKeyDown={(e) => e.key === 'Enter' && choose('wl-off')}
        onMouseEnter={() => setHoveredPanel('wl-off')}
        onMouseLeave={() => setHoveredPanel(null)}
      >
        <div className="server-panel-content">
          <div className="server-panel-header">
            <span style={getHintStyle('wl-off')}>INTERESUJĘ MNIE</span>
            <h1 style={getTitleStyle('wl-off')}>WL:OFF</h1>
          </div>
          <div className="server-char-box">
            <Image
              src="/char_wloff.png"
              alt="WL:OFF postać"
              width={700}
              height={900}
              style={getCharStyle('wl-off')}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* WL:ON – Prawa strona */}
      <div
        className="server-panel server-panel-on"
        role="button"
        tabIndex={0}
        aria-label="Wybierz serwer WL:ON"
        onClick={() => choose('wl-on')}
        onKeyDown={(e) => e.key === 'Enter' && choose('wl-on')}
        onMouseEnter={() => setHoveredPanel('wl-on')}
        onMouseLeave={() => setHoveredPanel(null)}
      >
        <div className="server-panel-content">
          <div className="server-panel-header">
            <span style={getHintStyle('wl-on')}>INTERESUJĘ MNIE</span>
            <h1 style={getTitleStyle('wl-on')}>WL:ON</h1>
          </div>
          <div className="server-char-box">
            <Image
              src="/char_wlon.png"
              alt="WL:ON postać"
              width={700}
              height={900}
              style={getCharStyle('wl-on')}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
