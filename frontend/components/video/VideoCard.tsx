'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailUrl: string;
    viewsCount: number;
    createdAt: string;
    duration: number;
    serverTag?: string | null;
    user: { id: string; username: string; handle: string; avatarUrl?: string };
    _count?: { likes: number; comments: number };
  };
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M wyśw.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K wyśw.`;
  return `${n} wyśw.`;
}

function formatDuration(secs: number): string {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} dni temu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mies. temu`;
  return `${Math.floor(months / 12)} lat temu`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();
  const dur = formatDuration(video.duration);

  return (
    // div zamiast Link — eliminuje błąd nested <a>
    <div
      className="video-card"
      onClick={() => router.push(`/watch?v=${video.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/watch?v=${video.id}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* Miniaturka */}
      <div className="video-thumbnail">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          unoptimized
        />
        {dur && <span className="video-duration">{dur}</span>}
        {video.serverTag && (
          <span className={`video-server-tag ${video.serverTag === 'wl-off' ? 'wloff' : 'wlon'}`}>
            {video.serverTag === 'wl-off' ? 'WL:OFF' : 'WL:ON'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="video-info">
        {video.user.avatarUrl ? (
          <Image
            src={video.user.avatarUrl}
            alt={video.user.username}
            width={36} height={36}
            className="video-info-avatar"
            unoptimized
            onClick={(e) => { e.stopPropagation(); router.push(`/channel?id=${video.user.id}`); }}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div
            className="video-info-avatar"
            style={{ background: 'var(--bg-tertiary)', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); router.push(`/channel?id=${video.user.id}`); }}
          />
        )}
        <div className="video-info-text">
          <div className="video-title">{video.title}</div>
          {/* span zamiast Link — brak nested <a> */}
          <div className="video-channel-name">
            <Link
              href={`/channel?id=${video.user.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--text-secondary)' }}
            >
              {video.user.username}
            </Link>
          </div>
          <div className="video-meta">
            {formatViews(video.viewsCount)} · {timeAgo(video.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
