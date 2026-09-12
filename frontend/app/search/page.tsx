'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import { Search as SearchIcon } from 'lucide-react';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get('/videos', { params: { search: q, limit: 40 } })
      .then(({ data }) => setVideos(data.videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        Wyniki wyszukiwania: <span style={{ color: 'var(--accent)' }}>&quot;{q}&quot;</span>
      </h1>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 14 }}>
        {loading ? 'Szukanie...' : `Znaleziono ${videos.length} filmów`}
      </p>

      {loading && (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }} />
              <div style={{ padding: '12px 4px' }}>
                <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <SearchIcon size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Brak wyników</h2>
          <p>Nie znaleziono filmów pasujących do frazy &quot;{q}&quot;.</p>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="video-grid">
          {videos.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Ładowanie...</div>}>
      <SearchResults />
    </Suspense>
  );
}
