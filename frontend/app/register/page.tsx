'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '', handle: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd rejestracji. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            <span style={{ color: 'var(--accent)' }}>▶</span>
          </div>
          <h1 className="auth-title">Utwórz konto YoTube</h1>
          <p className="auth-subtitle">Dołącz i zacznij dodawać filmy już dziś</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nazwa użytkownika *</label>
              <input id="reg-username" type="text" className="form-input" placeholder="jan_kowalski"
                value={form.username} onChange={(e) => update('username', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Handle (ID kanału) *</label>
              <input id="reg-handle" type="text" className="form-input" placeholder="@jankowalski"
                value={form.handle} onChange={(e) => update('handle', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adres email *</label>
            <input id="reg-email" type="email" className="form-input" placeholder="jan@email.com"
              value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Hasło (min. 6 znaków) *</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Silne hasło"
              value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Bio (opcjonalne)</label>
            <textarea id="reg-bio" className="form-input" placeholder="Kilka słów o sobie..."
              rows={2} value={form.bio} onChange={(e) => update('bio', e.target.value)}
              style={{ resize: 'none' }} />
          </div>

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          <button id="reg-btn" type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 10, marginTop: 8 }}>
            {loading ? 'Tworzenie konta...' : <><UserPlus size={18} /> Utwórz konto</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          Masz już konto?{' '}
          <Link href="/login" style={{ color: '#3ea6ff', fontWeight: 600 }}>Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
