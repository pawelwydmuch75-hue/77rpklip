'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api, { getApiUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  ThumbsUp, ThumbsDown, Share2, Bell, MessageCircle, Send, Trash2
} from 'lucide-react';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1000)}K`;
  return String(n);
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} dni temu`;
  return `${Math.floor(days / 30)} mies. temu`;
}

interface VideoData {
  id: string; title: string; description: string;
  videoUrl: string; thumbnailUrl: string;
  viewsCount: number; createdAt: string;
  likesCount: number; dislikesCount: number;
  userLike: 'like' | 'dislike' | null;
  user: {
    id: string; username: string; handle: string; avatarUrl?: string;
    _count: { subscribers: number };
  };
  _count: { comments: number };
}

interface Comment {
  id: string; content: string; createdAt: string;
  user: { id: string; username: string; handle: string; avatarUrl?: string };
  replies?: Comment[];
  _count: { likes: number; replies: number };
}

interface WatchContentProps {
  initialId?: string;
}

export default function WatchContent({ initialId }: WatchContentProps) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const resolveVideoId = (): string => {
    const q = searchParams?.get('v') || searchParams?.get('id');
    if (q) return q;

    if (initialId && initialId !== 'demo') return initialId;

    let raw = '';
    if (pathname) {
      const parts = pathname.split('/watch/');
      if (parts[1]) {
        raw = parts[1].split('/')[0]?.split('?')[0];
      }
    }
    if (!raw && typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/watch/');
      if (parts[1]) {
        raw = parts[1].split('/')[0]?.split('?')[0];
      }
    }
    if (!raw) {
      const pid = params?.id;
      if (pid) raw = pid;
    }

    if (raw && raw !== 'demo') {
      return decodeURIComponent(raw);
    }
    return '';
  };

  const [id, setId] = useState<string>(resolveVideoId);

  useEffect(() => {
    const vid = resolveVideoId();
    if (vid && vid !== id) {
      setId(vid);
    }
  }, [searchParams, pathname, params, id, initialId]);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLike, setUserLike] = useState<'like' | 'dislike' | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  // Pobierz wideo
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/videos/${id}`)
      .then(({ data }) => {
        setVideo(data.video);
        setUserLike(data.video.userLike);
        setLikes(data.video.likesCount);
        setDislikes(data.video.dislikesCount);
        setSubCount(data.video.user._count.subscribers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Pobierz komentarze
  useEffect(() => {
    if (!id) return;
    api.get(`/comments/${id}`)
      .then(({ data }) => setComments(data.comments))
      .catch(console.error);
  }, [id]);

  // Status subskrypcji
  useEffect(() => {
    if (!id || !isAuthenticated || !video) return;
    api.get(`/subscriptions/status/${video.user.id}`)
      .then(({ data }) => { setSubscribed(data.subscribed); setSubCount(data.subscribersCount); })
      .catch(console.error);
  }, [id, isAuthenticated, video]);

  const toggleLike = async (isDislike: boolean) => {
    if (!isAuthenticated) return router.push('/login');
    try {
      const { data } = await api.post(`/likes/video/${id}`, { isDislike });
      setLikes(data.likesCount);
      setDislikes(data.dislikesCount);
      setUserLike(data.action === 'removed' ? null : isDislike ? 'dislike' : 'like');
    } catch (e) { console.error(e); }
  };

  const toggleSub = async () => {
    if (!isAuthenticated || !video) return router.push('/login');
    try {
      const { data } = await api.post(`/subscriptions/${video.user.id}`);
      setSubscribed(data.subscribed);
      setSubCount(data.subscribersCount);
    } catch (e) { console.error(e); }
  };

  const postComment = async (parentId?: string) => {
    if (!isAuthenticated) return router.push('/login');
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await api.post(`/comments/${id}`, {
        content: text.trim(),
        ...(parentId ? { parentId } : {}),
      });
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), data.comment] }
            : c
        ));
        setReplyTo(null); setReplyText('');
      } else {
        setComments(prev => [data.comment, ...prev]);
        setCommentText('');
      }
    } catch (e) { console.error(e); }
    finally { setCommentLoading(false); }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) { console.error(e); }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteVideo = async () => {
    if (!video) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/videos/${video.id}`);
      router.push('/');
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Błąd podczas usuwania filmu.');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
      </div>
    );
  }

  if (!video) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
      <h2>Nie znaleziono wideo</h2>
    </div>
  );

  const apiUrl = getApiUrl();
  const streamUrl = `${apiUrl}/videos/stream/${video.id}`;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="watch-layout">
        {/* Lewa kolumna */}
        <div>
          {/* Odtwarzacz */}
          <div className="video-player-wrap">
            <video
              controls
              autoPlay
              src={streamUrl}
              poster={video.thumbnailUrl}
              style={{ width: '100%', height: '100%', background: '#000' }}
            />
          </div>

          {/* Tytuł */}
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 8px', lineHeight: 1.3 }}>
            {video.title}
          </h1>

          {/* Meta + akcje */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {formatViews(video.viewsCount)} wyśw. · {timeAgo(video.createdAt)}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {/* Like */}
              <button
                className={`like-btn${userLike === 'like' ? ' active' : ''}`}
                onClick={() => toggleLike(false)}
              >
                <ThumbsUp size={18} /> {likes}
              </button>
              {/* Dislike */}
              <button
                className={`like-btn${userLike === 'dislike' ? ' active' : ''}`}
                onClick={() => toggleLike(true)}
                style={{ borderRadius: '0 20px 20px 0', borderLeft: '1px solid var(--border)' }}
              >
                <ThumbsDown size={18} /> {dislikes > 0 ? dislikes : ''}
              </button>
              <button className="like-btn"><Share2 size={18} /> Udostępnij</button>
              {/* Usuń film – tylko dla twórcy */}
              {isAuthenticated && user?.id === video.user.id && (
                <button
                  className="like-btn"
                  onClick={() => setDeleteConfirm(true)}
                  style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.3)', gap: 6 }}
                  title="Usuń film"
                >
                  <Trash2 size={16} /> Usuń
                </button>
              )}
            </div>
          </div>

          {/* Modal potwierdzenia usunięcia */}
          {deleteConfirm && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9000,
            }} onClick={() => setDeleteConfirm(false)}>
              <div style={{
                background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '90%',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,68,68,0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Trash2 size={20} color="#ff4444" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>Usuń film?</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Tej operacji nie można cofnąć. Film zostanie trwale usunięty.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button
                    className="btn-outline"
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleteLoading}
                    style={{ borderRadius: 8, padding: '9px 18px' }}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleDeleteVideo}
                    disabled={deleteLoading}
                    style={{
                      background: '#dc2626', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '9px 18px', fontWeight: 700,
                      fontSize: 14, cursor: 'pointer', opacity: deleteLoading ? 0.7 : 1,
                    }}
                  >
                    {deleteLoading ? 'Usuwanie...' : 'Tak, usuń film'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kanał + subskrypcja */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16,
          }}>
            <Link href={`/channel?id=${video.user.id}`}>
              {video.user.avatarUrl ? (
                <Image src={video.user.avatarUrl} alt={video.user.username}
                  width={48} height={48} className="avatar" style={{ width: 48, height: 48 }} unoptimized />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
              )}
            </Link>
            <div style={{ flex: 1 }}>
              <Link href={`/channel?id=${video.user.id}`}
                style={{ fontWeight: 700, fontSize: 15 }}>{video.user.username}</Link>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                {formatViews(subCount)} subskrybentów
              </div>
            </div>
            {(!isAuthenticated || user?.id !== video.user.id) && (
              <button
                className={subscribed ? 'btn-outline' : 'btn-primary'}
                onClick={toggleSub}
                style={{ borderRadius: 20 }}
              >
                {subscribed ? <><Bell size={16} /> Subskrybujesz</> : 'Subskrybuj'}
              </button>
            )}
          </div>

          {/* Opis */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 24,
          }}>
            <div style={{
              fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)',
              maxHeight: descExpanded ? 'none' : 80, overflow: 'hidden',
              whiteSpace: 'pre-wrap',
            }}>
              {video.description || 'Brak opisu.'}
            </div>
            {(video.description?.length || 0) > 200 && (
              <button className="btn-icon" style={{ padding: 0, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', borderRadius: 4 }}
                onClick={() => setDescExpanded(!descExpanded)}>
                {descExpanded ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            )}
          </div>

          {/* Komentarze */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <MessageCircle size={20} />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{video._count.comments} komentarzy</h2>
            </div>

            {/* Dodaj komentarz */}
            {isAuthenticated ? (
              <div className="comment-input-row" style={{ marginBottom: 24 }}>
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.username}
                    width={36} height={36} className="avatar" unoptimized />
                ) : (
                  <div className="avatar" style={{ background: 'var(--bg-tertiary)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <textarea
                    className="comment-input"
                    placeholder="Dodaj komentarz..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={1}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', resize: 'none', outline: 'none', color: 'var(--text-primary)', padding: '8px 0' }}
                    onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  />
                  {commentText && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <button className="btn-outline" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13 }}
                        onClick={() => setCommentText('')}>Anuluj</button>
                      <button className="btn-primary" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13 }}
                        onClick={() => postComment()} disabled={commentLoading}>
                        <Send size={14} /> Opublikuj
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Zaloguj się, aby dodać komentarz.</p>
                <button className="btn-primary" onClick={() => router.push('/login')} style={{ margin: '0 auto', borderRadius: 20 }}>Zaloguj się</button>
              </div>
            )}

            {/* Lista komentarzy */}
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                {comment.user.avatarUrl ? (
                  <Image src={comment.user.avatarUrl} alt={comment.user.username}
                    width={36} height={36} className="avatar" unoptimized />
                ) : (
                  <div className="avatar" style={{ background: 'var(--bg-tertiary)', flexShrink: 0 }} />
                )}
                <div className="comment-content">
                  <span className="comment-author">{comment.user.username}</span>
                  <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                  <p className="comment-text">{comment.content}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    {isAuthenticated && (
                      <button className="btn-icon" style={{ fontSize: 13, padding: '2px 0', color: 'var(--text-secondary)', borderRadius: 4 }}
                        onClick={() => setReplyTo(replyTo?.id === comment.id ? null : { id: comment.id, username: comment.user.username })}>
                        Odpowiedz
                      </button>
                    )}
                    {user?.id === comment.user.id && (
                      <button className="btn-icon" style={{ padding: '2px 4px', color: 'var(--text-tertiary)' }}
                        onClick={() => deleteComment(comment.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Reply input */}
                  {replyTo?.id === comment.id && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        className="comment-input"
                        placeholder={`Odpowiedz @${replyTo.username}...`}
                        value={replyText} rows={1}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', resize: 'none', outline: 'none', color: 'var(--text-primary)', padding: '6px 0' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button className="btn-outline" style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13 }}
                          onClick={() => { setReplyTo(null); setReplyText(''); }}>Anuluj</button>
                        <button className="btn-primary" style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13 }}
                          onClick={() => postComment(comment.id)} disabled={commentLoading}>
                          <Send size={12} /> Odpowiedz
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Odpowiedzi */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginTop: 12, paddingLeft: 4 }}>
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="comment-item" style={{ marginBottom: 12 }}>
                          {reply.user.avatarUrl ? (
                            <Image src={reply.user.avatarUrl} alt={reply.user.username}
                              width={28} height={28} className="avatar" unoptimized
                              style={{ width: 28, height: 28 }} />
                          ) : (
                            <div className="avatar" style={{ width: 28, height: 28, background: 'var(--bg-tertiary)', flexShrink: 0 }} />
                          )}
                          <div className="comment-content">
                            <span className="comment-author">{reply.user.username}</span>
                            <span className="comment-time">{timeAgo(reply.createdAt)}</span>
                            <p className="comment-text">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prawa kolumna — polecane (uproszczone) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            Polecane
          </h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Wróć na <Link href="/" style={{ color: '#3ea6ff' }}>stronę główną</Link>, aby odkryć więcej filmów.
          </p>
        </div>
      </div>
    </div>
  );
}
