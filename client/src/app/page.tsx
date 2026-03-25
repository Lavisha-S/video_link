'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const ADJECTIVES = ['swift', 'bright', 'calm', 'clear', 'bold', 'wise', 'fair', 'keen'];
const NOUNS = ['falcon', 'river', 'mountain', 'aurora', 'horizon', 'ember', 'wave', 'prism'];
const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const generateIdentity = () => `${random(ADJECTIVES)}-${random(NOUNS)}-${Math.floor(Math.random() * 100)}`;

function validateIdentity(v: string) {
  if (!v.trim()) return 'Name is required';
  if (v.trim().length < 2) return 'At least 2 characters';
  if (v.trim().length > 50) return 'Max 50 characters';
  if (!/^[a-zA-Z0-9_\-\.@]+$/.test(v.trim())) return 'Letters, numbers, _ - . @ only';
  return null;
}

function validateRoom(v: string) {
  if (!v.trim()) return 'Room name is required';
  if (v.trim().length < 1) return 'Too short';
  if (v.trim().length > 100) return 'Max 100 characters';
  if (!/^[a-zA-Z0-9_\- ]+$/.test(v.trim())) return 'Letters, numbers, spaces, _ - only';
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [identity, setIdentity] = useState(generateIdentity());
  const [roomName, setRoomName] = useState('');
  const [errors, setErrors] = useState<{ identity?: string; roomName?: string }>({});
  const [touched, setTouched] = useState<{ identity?: boolean; roomName?: boolean }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const idErr = validateIdentity(identity);
    const roomErr = validateRoom(roomName);
    setTouched({ identity: true, roomName: true });
    setErrors({ identity: idErr || undefined, roomName: roomErr || undefined });
    if (idErr || roomErr) return;
    router.push(`/room?identity=${encodeURIComponent(identity.trim())}&roomName=${encodeURIComponent(roomName.trim())}`);
  };

  const identityErr = touched.identity ? validateIdentity(identity) : null;
  const roomErr = touched.roomName ? validateRoom(roomName) : null;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,180,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="animate-fade-up" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px var(--accent-glow)' }}>
              ◈
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>VideoLink</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Real-time video calls, zero friction.<br />Just enter a name and join.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Identity */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Name</label>
                <button type="button" onClick={() => setIdentity(generateIdentity())}
                  style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', padding: '2px 6px', borderRadius: 4, transition: 'opacity var(--transition)' }}>
                  ↻ Random
                </button>
              </div>
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, identity: true }))}
                placeholder="e.g. john-doe"
                maxLength={50}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                  background: 'var(--surface-2)', border: `1.5px solid ${identityErr ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text)', fontSize: '0.95rem', transition: 'border-color var(--transition)',
                }}
                onFocus={(e) => { if (!identityErr) e.currentTarget.style.borderColor = 'var(--accent)'; }}
              />
              {identityErr && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.35rem' }}>⚠ {identityErr}</p>}
            </div>

            {/* Room Name */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, roomName: true }))}
                placeholder="e.g. team-standup"
                maxLength={100}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                  background: 'var(--surface-2)', border: `1.5px solid ${roomErr ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text)', fontSize: '0.95rem', transition: 'border-color var(--transition)',
                }}
                onFocus={(e) => { if (!roomErr) e.currentTarget.style.borderColor = 'var(--accent)'; }}
              />
              {roomErr && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.35rem' }}>⚠ {roomErr}</p>}
            </div>

            <button type="submit" style={{
              width: '100%', padding: '0.875rem', borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--accent), #8b83ff)',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
              letterSpacing: '-0.01em', transition: 'all var(--transition)',
              boxShadow: '0 4px 24px var(--accent-glow)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-glow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px var(--accent-glow)'; }}
            >
              Join Room →
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '1.25rem', lineHeight: 1.5 }}>
            Rooms are created automatically. Share the room name with others to invite them.
          </p>
        </div>
      </div>
    </main>
  );
}
