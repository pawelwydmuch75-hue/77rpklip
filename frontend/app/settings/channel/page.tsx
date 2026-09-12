'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Camera, X, Save, Eye, Palette, User,
  AtSign, FileText, Check, AlertCircle, ChevronRight, Trash2
} from 'lucide-react';

const GRADIENT_PRESETS = [
  { label: 'Czerwień', value: 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)' },
  { label: 'Neon', value: 'linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%)' },
  { label: 'Zachód', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { label: 'Kosmos', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { label: 'Aurora', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'Fiolet', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { label: 'Ogień', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { label: 'Stal', value: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
  { label: 'Koral', value: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
  { label: 'Noce', value: 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)' },
  { label: 'Mango', value: 'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)' },
];

type Tab = 'profile' | 'appearance' | 'preview';

export default function ChannelSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Pola formularza
  const [username, setUsername] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  // Awatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Banner
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[4].value);
  const [bannerMode, setBannerMode] = useState<'gradient' | 'image'>('gradient');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setHandle(user.handle?.replace('@', '') || '');
      setBio(user.bio || '');
      if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
      if (user.bannerUrl) {
        setBannerPreview(user.bannerUrl);
        setBannerMode('image');
      }
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setBannerMode('image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('handle', handle);
      form.append('bio', bio);
      if (avatarFile) form.append('avatar', avatarFile);
      if (bannerFile) form.append('banner', bannerFile);
      // Gradient jako bannerUrl tylko gdy tryb gradient i brak pliku
      if (bannerMode === 'gradient' && !bannerFile) {
        form.append('bannerGradient', selectedGradient);
      }

      const { data } = await api.patch('/auth/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Zaktualizuj localStorage
      const saved = localStorage.getItem('yt_user');
      if (saved) {
        localStorage.setItem('yt_user', JSON.stringify({ ...JSON.parse(saved), ...data.user }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd zapisu. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await api.delete('/auth/avatar');
      setAvatarFile(null);
      setAvatarPreview(`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`);
    } catch {}
  };

  const removeBanner = async () => {
    try {
      await api.delete('/auth/banner');
      setBannerFile(null);
      setBannerPreview(null);
      setBannerMode('gradient');
    } catch {}
  };

  const bannerStyle = bannerMode === 'gradient' && !bannerPreview
    ? { background: selectedGradient }
    : {};

  if (isLoading || !user) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Dane profilu', icon: <User size={16} /> },
    { id: 'appearance', label: 'Wygląd kanału', icon: <Palette size={16} /> },
    { id: 'preview', label: 'Podgląd', icon: <Eye size={16} /> },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Nagłówek */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Ustawienia kanału</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Personalizuj swój kanał — awatar, baner, opis i dane profilu.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'var(--bg-secondary)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'var(--bg-hover)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Profile ── */}
      {tab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Formularz */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Awatar */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Zdjęcie profilowe</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar"
                      width={96} height={96} unoptimized
                      style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={36} color="var(--text-tertiary)" />
                    </div>
                  )}
                  <button onClick={() => avatarInputRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent)', border: '2px solid var(--bg-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                    <Camera size={14} color="#fff" />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                    Zalecane: kwadratowe zdjęcie, min. 200×200 px.<br />
                    Formaty: JPG, PNG, WebP, GIF. Maks. 10 MB.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" onClick={() => avatarInputRef.current?.click()} style={{ fontSize: 13 }}>
                      <Camera size={14} /> Zmień
                    </button>
                    <button className="btn-icon" onClick={removeAvatar}
                      style={{ color: '#ff4444', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', background: 'none', fontSize: 13 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dane konta */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Dane kanału</h2>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} /> Nazwa kanału
                </label>
                <input type="text" className="form-input" value={username}
                  onChange={(e) => setUsername(e.target.value)} maxLength={50}
                  placeholder="Nazwa Twojego kanału" />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {username.length}/50
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AtSign size={13} /> Identyfikator (handle)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 15 }}>@</span>
                  <input type="text" className="form-input" value={handle}
                    onChange={(e) => setHandle(e.target.value.replace('@', ''))} maxLength={30}
                    placeholder="twoj_handle" style={{ paddingLeft: 30 }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {handle.length}/30
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={13} /> Bio kanału
                </label>
                <textarea className="form-input" value={bio}
                  onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
                  placeholder="Opowiedz widzom o swoim kanale..." style={{ resize: 'vertical' }} />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {bio.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Podgląd karty profilu */}
          <div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Podgląd profilu</h3>
              <div style={{ textAlign: 'center' }}>
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" width={80} height={80} unoptimized
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={30} color="var(--text-tertiary)" />
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{username || 'Twoja Nazwa'}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 8 }}>@{handle || 'twoj_handle'}</div>
                {bio && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, textAlign: 'left', background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8 }}>
                    {bio.slice(0, 120)}{bio.length > 120 ? '...' : ''}
                  </div>
                )}
              </div>

              <button onClick={() => router.push(`/channel/${user.id}`)}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: 13 }}>
                <Eye size={14} /> Otwórz kanał <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Appearance ── */}
      {tab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Banner */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Baner kanału</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Pojawia się na górze strony Twojego kanału. Wybierz własny obraz lub gotowy gradient.
            </p>

            {/* Podgląd banera */}
            <div style={{
              width: '100%', height: 180, borderRadius: 12, marginBottom: 20,
              overflow: 'hidden', position: 'relative',
              ...bannerStyle,
            }}>
              {bannerPreview && bannerMode === 'image' && (
                <Image src={bannerPreview} alt="Banner" fill style={{ objectFit: 'cover' }} unoptimized />
              )}
              {!bannerPreview && bannerMode === 'gradient' && (
                <div style={{ width: '100%', height: '100%', background: selectedGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Podgląd gradientu</span>
                </div>
              )}
            </div>

            {/* Tryb wyboru */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setBannerMode('gradient')}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${bannerMode === 'gradient' ? '#3ea6ff' : 'var(--border)'}`,
                  background: bannerMode === 'gradient' ? 'rgba(62,166,255,0.1)' : 'transparent',
                  color: bannerMode === 'gradient' ? '#3ea6ff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <Palette size={14} /> Gradient
              </button>
              <button
                onClick={() => bannerInputRef.current?.click()}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${bannerMode === 'image' ? '#3ea6ff' : 'var(--border)'}`,
                  background: bannerMode === 'image' ? 'rgba(62,166,255,0.1)' : 'transparent',
                  color: bannerMode === 'image' ? '#3ea6ff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <Camera size={14} /> Własny obraz
              </button>
              <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerChange} />
              {(bannerFile || user.bannerUrl) && (
                <button onClick={removeBanner}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: '#ff4444', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Usuń
                </button>
              )}
            </div>

            {/* Siatka gradientów */}
            {bannerMode === 'gradient' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Wybierz preset gradientu:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {GRADIENT_PRESETS.map((g) => (
                    <button key={g.value} onClick={() => setSelectedGradient(g.value)}
                      style={{
                        height: 52, borderRadius: 10,
                        background: g.value,
                        border: selectedGradient === g.value ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer', position: 'relative',
                        boxShadow: selectedGradient === g.value ? '0 0 0 2px #3ea6ff' : 'none',
                        transition: 'all 0.15s',
                      }}
                      title={g.label}>
                      {selectedGradient === g.value && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={16} color="white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Preview ── */}
      {tab === 'preview' && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Tak będzie wyglądał Twój kanał po zapisaniu zmian.
          </p>
          {/* Baner */}
          <div style={{
            width: '100%', height: 200, borderRadius: 16, overflow: 'hidden',
            position: 'relative', marginBottom: -50,
            ...(bannerMode === 'gradient' && !bannerPreview ? { background: selectedGradient } : {}),
          }}>
            {bannerPreview && bannerMode === 'image' && (
              <Image src={bannerPreview} alt="Banner" fill style={{ objectFit: 'cover' }} unoptimized />
            )}
            {!bannerPreview && bannerMode === 'gradient' && (
              <div style={{ width: '100%', height: '100%', background: selectedGradient }} />
            )}
          </div>

          {/* Header kanału */}
          <div style={{ background: 'var(--bg-primary)', padding: '0 24px 24px', display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Avatar" width={80} height={80} unoptimized
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-primary)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '4px solid var(--bg-primary)', flexShrink: 0 }} />
            )}
            <div style={{ marginTop: 50 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{username || 'Nazwa kanału'}</h1>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>@{handle || 'handle'} · 0 subskrybentów</div>
              {bio && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8, maxWidth: 600 }}>{bio}</p>}
            </div>
            <button className="btn-primary" style={{ marginLeft: 'auto', marginTop: 50, borderRadius: 20 }}>
              Subskrybuj
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-soft)', margin: '0 0 24px' }} />

          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 12, padding: '60px 40px', textAlign: 'center',
            color: 'var(--text-tertiary)', fontSize: 14,
          }}>
            Tu pojawią się Twoje filmy po zapisaniu profilu.
          </div>
        </div>
      )}

      {/* ── Pasek zapisu ── */}
      <div style={{
        position: 'sticky', bottom: 16, left: 0, right: 0,
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 32, backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff4444', fontSize: 13, flex: 1 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00c864', fontSize: 13, flex: 1 }}>
            <Check size={14} /> Zapisano pomyślnie!
          </div>
        )}
        {!error && !saved && <div style={{ flex: 1 }} />}

        <button className="btn-outline" onClick={() => router.push(`/channel/${user.id}`)} style={{ fontSize: 13 }}>
          <Eye size={14} /> Podgląd kanału
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}
          style={{ padding: '10px 24px', fontSize: 14, borderRadius: 10 }}>
          {saving ? 'Zapisywanie...' : <><Save size={16} /> Zapisz zmiany</>}
        </button>
      </div>
    </div>
  );
}
