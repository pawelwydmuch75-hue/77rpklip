'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import { 
  LayoutGrid, Sparkles, Flame, ThumbsUp, Search 
} from 'lucide-react';
import { useServer } from '@/context/ServerContext';

interface Video {
  id: string; title: string; thumbnailUrl: string; videoUrl: string;
  viewsCount: number; createdAt: string; duration: number;
  serverTag?: string;
  user: { id: string; username: string; handle: string; avatarUrl?: string };
  _count?: { likes: number; comments: number };
}

const CHIPS = [
  { label: 'Wszystkie', icon: LayoutGrid, sort: 'latest', search: '' },
  { label: 'Nowe', icon: Sparkles, sort: 'latest', search: '' },
  { label: 'Popularne', icon: Flame, sort: 'popular', search: '' },
  { label: 'Wysoko oceniane', icon: ThumbsUp, sort: 'top_rated', search: '' },
];

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { server } = useServer();

  const fetchVideos = useCallback(async (chipIdx: number, pg: number, append = false) => {
    const chip = CHIPS[chipIdx];
    try {
      if (pg === 1) setLoading(true);
      else setLoadingMore(true);

      const params: Record<string, string | number> = {
        sort: chip.sort,
        page: pg,
        limit: 20,
      };
      if (chip.search) params.search = chip.search;
      // Filtruj po serwerze
      if (server) params.serverTag = server;

      const { data } = await api.get('/videos', { params });

      setVideos(prev => append ? [...prev, ...data.videos] : data.videos);
      setHasMore(data.pagination.hasNextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [server]);

  useEffect(() => {
    setPage(1);
    fetchVideos(activeChip, 1, false);
  }, [activeChip, fetchVideos, server]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchVideos(activeChip, next, true);
  };

  const serverLabel = server === 'wl-off' ? 'WL:OFF' : 'WL:ON';
  const serverColor = server === 'wl-off' ? '#888888' : 'var(--accent)';

  return (
    <div>
      {/* Top Header Bar */}
      <div className="content-header-top">
        <div>
          <div className="server-context-pill">
            <span className={`server-context-dot ${server === 'wl-off' ? 'wloff' : 'wlon'}`} />
            <span>SERWER {serverLabel}</span>
          </div>
          <h1 className="content-heading">
            {activeChip === 0 ? 'Ostatnio dodane filmy' : CHIPS[activeChip].label}
          </h1>
        </div>
      </div>

      {/* Chip filter row z ikonami SVG zamiast emoji */}
      <div className="chips-row">
        {CHIPS.map((chip, i) => {
          const IconComp = chip.icon;
          return (
            <button
              key={i}
              className={`chip${activeChip === i ? ' active' : ''}`}
              onClick={() => setActiveChip(i)}
            >
              <IconComp size={15} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="video-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }} />
              <div style={{ display: 'flex', gap: 12, padding: '12px 4px' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <Search size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Brak filmów</h2>
          <p>Nie znaleziono żadnych filmów dla serwera <strong style={{ color: serverColor }}>{serverLabel}</strong>.</p>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>
            Bądź pierwszy — dodaj swój klip!
          </p>
        </div>
      )}

      {/* Video grid */}
      {!loading && videos.length > 0 && (
        <>
          <div className="video-grid">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                className="btn-outline"
                onClick={loadMore}
                disabled={loadingMore}
                style={{ padding: '10px 32px', borderRadius: 20 }}
              >
                {loadingMore ? 'Ładowanie...' : 'Załaduj więcej'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
