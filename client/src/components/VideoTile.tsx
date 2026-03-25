'use client';

import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  identity: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export default function VideoTile({
  stream,
  identity,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream && !isCameraOff) {
      el.srcObject = stream;
      el.play().catch((err) => {
        // Autoplay may be blocked before user interaction — silently ignore
        if (err.name !== 'AbortError') {
          console.warn('[VideoTile] Autoplay blocked:', err.message);
        }
      });
    } else {
      // Pause first to avoid "srcObject set while playing" errors in some browsers
      el.pause();
      el.srcObject = null;
    }

    return () => {
      el.pause();
      el.srcObject = null;
    };
  }, [stream, isCameraOff]);

  const initials = identity
    .split(/[\s\-_]+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      overflow: 'hidden', aspectRatio: '16/9', minHeight: 180,
    }}>
      {/* Camera-off / no-stream avatar */}
      {(!stream || isCameraOff) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isLocal
              ? 'linear-gradient(135deg, var(--accent), #8b83ff)'
              : 'linear-gradient(135deg, var(--accent-2), #00a88a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#fff',
          }}>
            {initials || '?'}
          </div>
          {isCameraOff && <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Camera off</span>}
        </div>
      )}

      {/* Video element — always mirrored for local */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Local video is always muted (prevents echo); remote audio is in the audio element
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: stream && !isCameraOff ? 'block' : 'none',
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* "You" badge */}
      {isLocal && (
        <div style={{
          position: 'absolute', top: '0.6rem', right: '0.6rem',
          background: 'rgba(108,99,255,0.85)', borderRadius: 6,
          padding: '0.2rem 0.55rem', fontSize: '0.68rem',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>You</div>
      )}

      {/* Identity badge */}
      <div style={{
        position: 'absolute', bottom: '0.6rem', left: '0.6rem',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        padding: '0.25rem 0.6rem', borderRadius: 6,
        fontSize: '0.78rem', fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: '0.35rem',
      }}>
        {isLocal ? identity : identity}
        {isMuted && <span title="Muted">🔇</span>}
      </div>

      {/* Status indicators for local tile */}
      {isLocal && (isMuted || isCameraOff) && (
        <div style={{
          position: 'absolute', top: '0.6rem', left: '0.6rem',
          display: 'flex', gap: '0.3rem',
        }}>
          {isMuted && (
            <div style={{
              background: 'rgba(255,77,106,0.85)', borderRadius: 6,
              padding: '0.2rem 0.45rem', fontSize: '0.68rem', fontWeight: 600,
            }}>🔇 Muted</div>
          )}
          {isCameraOff && (
            <div style={{
              background: 'rgba(255,77,106,0.85)', borderRadius: 6,
              padding: '0.2rem 0.45rem', fontSize: '0.68rem', fontWeight: 600,
            }}>📷 Off</div>
          )}
        </div>
      )}
    </div>
  );
}
