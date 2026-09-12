'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useServer } from '@/context/ServerContext';
import api from '@/lib/api';
import {
  Upload, Film, Image as ImageIcon, X, Check, AlertCircle, Lock, ShieldAlert, ShieldCheck
} from 'lucide-react';

export default function UploadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { server } = useServer();
  const router = useRouter();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Jeśli użytkownik nie ma Whitelist, ZAWSZE wymuś 'wl-off'
  const initialTag = (server === 'wl-on' && user?.hasWl) ? 'wl-on' : 'wl-off';
  const [serverTag, setServerTag] = useState<'wl-off' | 'wl-on'>(initialTag);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedId, setUploadedId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showWlModal, setShowWlModal] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Sync serverTag from context when context changes, but enforce WL restriction
  useEffect(() => {
    if (server === 'wl-on' && user?.hasWl) {
      setServerTag('wl-on');
    } else {
      setServerTag('wl-off');
    }
  }, [server, user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) { setErrorMsg('Wybierz plik wideo.'); return; }
    if (!title.trim()) { setErrorMsg('Podaj tytuł wideo.'); return; }

    setStatus('uploading');
    setErrorMsg('');
    setProgress(0);

    const form = new FormData();
    form.append('video', videoFile);
    if (thumbFile) form.append('thumbnail', thumbFile);
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('serverTag', serverTag);

    try {
      const { data } = await api.post('/videos/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setStatus('done');
      setUploadedId(data.video.id);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Błąd podczas przesyłania pliku.');
    }
  };

  if (isLoading) return null;

  if (user && !user.inGuild) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid #333', borderRadius: 16, padding: '40px 32px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldAlert size={36} color="#ff4444" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#fff' }}>Brak dostępu do przesyłania filmów</h1>
        <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Twoje konto Discord nie znajduje się na oficjalnym serwerze <strong>77RP</strong>. Aby móc publikować materiały wideo, musisz być członkiem naszej społeczności na Discordzie.
        </p>
        <a
          href="https://discord.gg/77rp"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14, borderRadius: 10, textDecoration: 'none' }}
        >
          Dołącz do oficjalnego Discorda 77RP
        </a>
      </div>
    );
  }


  if (status === 'done') {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(0,200,100,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <Check size={40} color="#00c864" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Film opublikowany!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Twój film został pomyślnie przesłany i jest dostępny publicznie.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => router.push(`/watch/${uploadedId}`)}>
            Oglądaj film
          </button>
          <button className="btn-outline" onClick={() => {
            setStatus('idle'); setVideoFile(null); setThumbFile(null);
            setThumbPreview(null); setTitle(''); setDescription(''); setProgress(0);
          }}>
            Dodaj kolejny
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dodaj film</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Prześlij swój film — obsługujemy MP4, WebM, MOV (do 500 MB).
      </p>

      <form onSubmit={handleSubmit}>
        {/* Strefa uploadu wideo */}
        {!videoFile ? (
          <div
            className={`upload-zone${dragging ? ' dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleVideoDrop}
            onClick={() => videoInputRef.current?.click()}
          >
            <Film size={64} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Przeciągnij plik wideo lub kliknij
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              MP4, WebM, MOV, AVI · Maks. 500 MB
            </p>
            <input ref={videoInputRef} type="file" accept="video/*" hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setVideoFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
              }} />
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <Film size={32} color="var(--accent)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile.name}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              </div>
              {status === 'uploading' && (
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
            {status === 'idle' && (
              <button type="button" className="btn-icon" onClick={() => setVideoFile(null)}>
                <X size={18} />
              </button>
            )}
            {status === 'uploading' && (
              <span style={{ color: '#3ea6ff', fontSize: 13, fontWeight: 600 }}>{progress}%</span>
            )}
          </div>
        )}

        {/* Metadane */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Tytuł wideo *</label>
            <input id="upload-title" type="text" className="form-input"
              placeholder="Przyciągający uwagę tytuł..."
              value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Opis (opcjonalnie)</label>
            <textarea id="upload-desc" className="form-input"
              placeholder="Opowiedz widzom o filmie..."
              rows={4} value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Serwer */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Serwer docelowy *</label>
              {user?.hasWl ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#00ff88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', padding: '4px 10px', borderRadius: 20 }}>
                  <ShieldCheck size={14} /> Zweryfikowany gracz WL (Dostęp: WL:ON + WL:OFF)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#ffaa00', background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.25)', padding: '4px 10px', borderRadius: 20 }}>
                  <AlertCircle size={14} /> Dostęp: tylko WL:OFF (Brak rangi WL)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* WL:OFF - Dostępny dla każdego na Discordzie */}
              <button
                type="button"
                onClick={() => setServerTag('wl-off')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 20,
                  border: '2px solid',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderColor: serverTag === 'wl-off' ? '#ffffff' : 'var(--border)',
                  background: serverTag === 'wl-off' ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-tertiary)',
                  color: serverTag === 'wl-off' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                WL:OFF
              </button>

              {/* WL:ON - Dostępny tylko dla graczy ze zdaną Whitelist */}
              <button
                type="button"
                onClick={() => {
                  if (!user?.hasWl) {
                    setShowWlModal(true);
                  } else {
                    setServerTag('wl-on');
                  }
                }}
                title={!user?.hasWl ? 'Wymaga Whitelist — kliknij, aby dowiedzieć się więcej' : 'Publikuj na serwerze WL:ON'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 24px',
                  borderRadius: 20,
                  border: '2px solid',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  opacity: user?.hasWl ? 1 : 0.65,
                  transition: 'all 0.2s',
                  borderColor: serverTag === 'wl-on' ? 'var(--accent)' : 'var(--border)',
                  background: serverTag === 'wl-on' ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                  color: serverTag === 'wl-on' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {!user?.hasWl && <Lock size={14} />}
                WL:ON {!user?.hasWl && '(Wymaga WL)'}
              </button>
            </div>

            {!user?.hasWl ? (
              <p style={{ fontSize: 12, color: '#ffaa00', marginTop: 8, fontWeight: 600 }}>
                ⚠️ Nie posiadasz roli Whitelist na serwerze Discord 77RP. Możesz publikować filmy wyłącznie dla serwera WL:OFF.
              </p>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                Film zostanie opublikowany w sekcji wybranego serwera ({serverTag === 'wl-on' ? 'WL:ON' : 'WL:OFF'}).
              </p>
            )}
          </div>

          {/* Miniaturka */}
          <div>
            <label className="form-label">Miniaturka (opcjonalnie)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <button type="button" className="btn-outline"
                onClick={() => thumbInputRef.current?.click()}
                style={{ flexShrink: 0 }}>
                <ImageIcon size={16} /> Wybierz obraz
              </button>
              <input ref={thumbInputRef} type="file" accept="image/*" hidden onChange={handleThumbChange} />
              {thumbPreview && (
                <div style={{ position: 'relative', width: 120 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbPreview} alt="Miniaturka" style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover' }} />
                  <button type="button" className="btn-icon"
                    onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                    style={{ position: 'absolute', top: -8, right: -8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', width: 24, height: 24, padding: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4444', marginBottom: 16, background: 'rgba(255,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <button id="upload-submit" type="submit" className="btn-primary"
          disabled={status === 'uploading' || !videoFile}
          style={{ padding: '12px 32px', fontSize: 15, borderRadius: 10 }}>
          <Upload size={18} />
          {status === 'uploading' ? `Przesyłanie ${progress}%...` : 'Opublikuj film'}
        </button>
      </form>

      {/* Modal braku uprawnień do publikacji na WL:ON */}
      {showWlModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowWlModal(false)}
        >
          <div
            style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 16,
              padding: '28px 24px',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'rgba(255, 170, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock size={22} color="#ffaa00" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Brak dostępu do WL:ON</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ffaa00', background: 'rgba(255,170,0,0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                  77RP Gracz (WL:OFF)
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Nie posiadasz roli <strong>Whitelist</strong> na oficjalnym serwerze Discord 77RP.
              <br /><br />
              Aby publikować filmy w sekcji <strong>WL:ON</strong>, musisz pomyślnie zdać rekrutację Whitelist na serwerze i uzyskać status zweryfikowanego gracza.
              <br /><br />
              💡 Jako gracz WL:OFF możesz bez żadnych przeszkód publikować wszystkie swoje materiały w sekcji <strong>WL:OFF</strong>!
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <a
                href="https://discord.gg/77rp"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}
              >
                Discord 77RP
              </a>
              <button
                className="btn-primary"
                onClick={() => setShowWlModal(false)}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}
              >
                Rozumiem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
