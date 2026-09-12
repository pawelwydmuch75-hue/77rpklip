'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import VideoCard from '@/components/video/VideoCard';
import { Bell, Users, Film, Settings, Share2 } from 'lucide-react';

function formatSubs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1000)}K`;
  return String(n);
}

interface ChannelContentProps {
  initialId?: string;
}

export default function ChannelContent({ initialId }: ChannelContentProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user: me, isAuthenticated } = useAuth();

  const resolveChannelId = (): string => {
    const q = searchParams?.get('id') || searchParams?.get('c');
    if (q) {
      if (q === 'me') return me?.id || 'me';
      return q;
    }

    if (initialId && initialId !== 'demo') {
      if (initialId === 'me') return me?.id || 'me';
      return initialId;
    }

    let raw = '';
    if (pathname) {
      const parts = pathname.split('/channel/');
      if (parts[1]) {
        raw = parts[1].split('/')[0]?.split('?')[0];
      }
    }
    if (!raw && typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/channel/');
      if (parts[1]) {
        raw = parts[1].split('/')[0]?.split('?')[0];
      }
    }
    if (!raw) {
      const pid = params?.id as string;
      if (pid) raw = pid;
    }

    if (raw && raw !== 'demo') {
      if (raw === 'me') return me?.id || 'me';
      return decodeURIComponent(raw);
    }
    if (me?.id) return me.id;
    return 'me';
  };

  const [channelId, setChannelId] = useState<string>(resolveChannelId);
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = resolveChannelId();
    if (cid && cid !== channelId) {
      setChannelId(cid);
    } else if ((!channelId || channelId === 'me') && me?.id) {
      setChannelId(me.id);
    }
  }, [searchParams, pathname, params, me, channelId, initialId]);

  const isOwnChannel = !!me?.id && (me.id === channelId || channelId === 'me' || channel?.id === me.id);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    api.get(`/videos/channel/${channelId}`)
      .then(({ data }) => {
        setChannel(data.channel);
        setVideos(data.videos);
        setSubCount(data.channel._count?.subscribers || 0);
      })
      .catch((err) => {
        console.error('Błąd pobierania kanału:', err);
        setChannel(null);
      })
      .finally(() => setLoading(false));
  }, [channelId]);

  useEffect(() => {
    const targetId = channel?.id || channelId;
    if (!targetId || !isAuthenticated || isOwnChannel) return;
    api.get(`/subscriptions/status/${targetId}`)
      .then(({ data }) => setSubscribed(data.subscribed))
      .catch(console.error);
  }, [channel, channelId, isAuthenticated, isOwnChannel]);

  const toggleSub = async () => {
    if (!isAuthenticated) return router.push('/login');
    const targetId = channel?.id || channelId;
    try {
      const { data } = await api.post(`/subscriptions/${targetId}`);
      setSubscribed(data.subscribed);
      setSubCount(data.subscribersCount);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link skopiowany!');
    } catch {}
  };

  if (loading || (!channel && !channelId)) return (
    <div>
      <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 16 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 0 24px' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 120 }} />
        </div>
      </div>
    </div>
  );

  if (!channel) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
      <h2 style={{ marginBottom: 16 }}>Nie znaleziono kanału</h2>
      <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
        Wróć na stronę główną
      </button>
    </div>
  );

  const isGradient = channel.bannerUrl?.startsWith('linear-gradient');

  return (
    <div>
      {/* ── Baner ── */}
      <div style={{
        width: '100%', height: 200, borderRadius: 16, overflow: 'hidden',
        position: 'relative', marginBottom: -50,
        background: isGradient
          ? channel.bannerUrl
          : !channel.bannerUrl
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : undefined,
      }}>
        {channel.bannerUrl && !isGradient && (
          <Image src={channel.bannerUrl} alt="Banner" fill
            style={{ objectFit: 'cover' }} unoptimized priority />
        )}
      </div>

      {/* ── Header kanału ── */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '0 0 24px',
        display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          {channel.avatarUrl ? (
            <Image src={channel.avatarUrl} alt={channel.username}
              width={88} height={88} unoptimized
              style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-primary)', display: 'block' }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '4px solid var(--bg-primary)' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, marginTop: 52 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>
            {channel.username}
          </h1>
          <div style={{ display: 'flex', gap: 16, color: 'var(--text-tertiary)', fontSize: 14, flexWrap: 'wrap', marginBottom: channel.bio ? 8 : 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {channel.handle}
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} /> {formatSubs(subCount)} subskrybentów
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Film size={14} /> {channel._count?.videos || videos.length} filmów
            </span>
          </div>
          {channel.bio && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600, lineHeight: 1.5 }}>
              {channel.bio}
            </p>
          )}
        </div>

        {/* Akcje */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 52 }}>
          <button className="btn-icon" onClick={handleShare}
            style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-secondary)' }}>
            <Share2 size={16} />
          </button>

          {isOwnChannel ? (
            <Link href="/settings/channel" className="btn-outline" style={{ borderRadius: 20, fontSize: 13 }}>
              <Settings size={16} /> Personalizuj kanał
            </Link>
          ) : (
            <button
              className={subscribed ? 'btn-outline' : 'btn-primary'}
              onClick={toggleSub}
              style={{ borderRadius: 20, padding: '10px 20px' }}>
              {subscribed
                ? <><Bell size={16} /> Subskrybujesz</>
                : 'Subskrybuj'}
            </button>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-soft)', margin: '0 0 28px' }} />

      {/* ── Filmy ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Filmy</h2>
        {isOwnChannel && (
          <Link href="/upload" className="btn-primary" style={{ fontSize: 13, borderRadius: 20 }}>
            + Dodaj film
          </Link>
        )}
      </div>

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 16 }}>
          <Film size={56} style={{ marginBottom: 12, opacity: 0.3 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>
            {isOwnChannel ? 'Dodaj swój pierwszy film!' : 'Brak filmów na tym kanale.'}
          </h3>
          {isOwnChannel && (
            <Link href="/upload" className="btn-primary" style={{ display: 'inline-flex', marginTop: 12 }}>
              Prześlij wideo
            </Link>
          )}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v: any) => (
            <VideoCard key={v.id} video={{ ...v, user: channel }} />
          ))}
        </div>
      )}
    </div>
  );
}
