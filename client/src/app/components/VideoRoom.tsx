'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVideoRoom, ConnectionStatus } from '@/hooks/useVideoRoom';
import VideoTile from '@/components/VideoTile';
import RemoteParticipantTile from '@/components/RemoteParticipantTile';

interface Props {
  identity: string;
  roomName: string;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Ready',
  'acquiring-media': 'Requesting permissions…',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Disconnected',
  reconnecting: 'Reconnecting…',
  error: 'Error',
};

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  idle: 'var(--text-dim)',
  'acquiring-media': 'var(--warn)',
  connecting: 'var(--warn)',
  connected: 'var(--success)',
  disconnected: 'var(--text-dim)',
  reconnecting: 'var(--warn)',
  error: 'var(--danger)',
};

export default function VideoRoom({ identity, roomName }: Props) {
  const router = useRouter();
  const hasAutoConnected = useRef(false);

  const {
    status,
    error,
    localStream,
    remoteParticipants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    clearError,
  } = useVideoRoom();

  // Auto-connect exactly once on mount
  useEffect(() => {
    if (!hasAutoConnected.current) {
      hasAutoConnected.current = true;
      connect(identity, roomName);
    }
    // Disconnect on unmount (catches navigation away)
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = useCallback(() => {
    disconnect();
    router.push('/');
  }, [disconnect, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if (e.key === 'v' || e.key === 'V') toggleCamera();
      if (e.key === 'Escape') handleLeave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute, toggleCamera, handleLeave]);

  const isLoading = status === 'acquiring-media' || status === 'connecting';
  const totalPeople = remoteParticipants.length + 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1.5rem',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>◈</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{roomName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              as <strong style={{ color: 'var(--text)' }}>{identity}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 20,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: STATUS_COLOR[status],
              ...(status === 'reconnecting' ? { animation: 'pulse 1.2s ease infinite' } : {}),
              ...(status === 'connected' ? { boxShadow: '0 0 6px var(--success)' } : {}),
            }} />
            <span style={{ fontSize: '0.78rem', color: STATUS_COLOR[status], fontWeight: 500 }}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '0.3rem 0.4rem' }}>
            {totalPeople} {totalPeople === 1 ? 'person' : 'people'}
          </span>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="animate-fade-in" style={{
          background: 'rgba(255,77,106,0.1)', borderBottom: '1px solid rgba(255,77,106,0.25)',
          padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '1rem',
        }}>
          <span style={{ color: 'var(--danger)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            ⚠&nbsp; {error}
          </span>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            style={{ color: 'var(--danger)', background: 'none', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="animate-fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem',
        }}>
          <div style={{
            width: 52, height: 52,
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.85s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              {STATUS_LABEL[status]}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 340, lineHeight: 1.6 }}>
              {status === 'acquiring-media' && 'Please allow camera and microphone access when your browser asks.'}
              {status === 'connecting' && 'Authenticating and joining the room…'}
            </p>
          </div>
        </div>
      )}

      {/* ── Error / Disconnected CTA ── */}
      {(status === 'error' || status === 'disconnected') && !isLoading && (
        <div className="animate-fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem',
        }}>
          <div style={{ fontSize: '2.5rem' }}>{status === 'error' ? '⚠️' : '👋'}</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem' }}>
            {status === 'error' ? 'Could not connect' : 'You left the room'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => connect(identity, roomName)}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 10,
                background: 'var(--accent)', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 10,
                background: 'var(--surface-2)', color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ── Video Grid ── */}
      {!isLoading && status !== 'error' && status !== 'disconnected' && (
        <div style={{ flex: 1, padding: '1.25rem', overflow: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              remoteParticipants.length === 0
                ? 'minmax(0, 640px)'
                : remoteParticipants.length === 1
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fit, minmax(280px, 1fr))',
            justifyContent: remoteParticipants.length === 0 ? 'center' : undefined,
            gap: '1rem',
            maxWidth: 1280,
            margin: '0 auto',
          }}>
            {/* Local video tile */}
            <VideoTile
              stream={localStream}
              identity={identity}
              isLocal
              isMuted={isMuted}
              isCameraOff={isCameraOff}
            />

            {/* Remote participant tiles */}
            {remoteParticipants.map((p) => (
              <RemoteParticipantTile key={p.sid} participant={p} />
            ))}
          </div>

          {/* Alone-in-room nudge */}
          {status === 'connected' && remoteParticipants.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
              You're the only one here. Share the room name&nbsp;
              <strong style={{ color: 'var(--text)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                {roomName}
              </strong>
              &nbsp;to invite others.
            </p>
          )}
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.6rem', flexWrap: 'wrap',
      }}>
        <CtrlBtn icon={isMuted ? '🔇' : '🎙'} label={isMuted ? 'Unmute' : 'Mute'} shortcut="M"
          danger={isMuted} disabled={status !== 'connected'} onClick={toggleMute} />

        <CtrlBtn icon={isCameraOff ? '📷' : '🎥'} label={isCameraOff ? 'Start Cam' : 'Stop Cam'} shortcut="V"
          danger={isCameraOff} disabled={status !== 'connected'} onClick={toggleCamera} />

        <CtrlBtn icon={isScreenSharing ? '🖥' : '📺'} label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
          accent={isScreenSharing} disabled={status !== 'connected'} onClick={toggleScreenShare} />

        <div style={{ width: 1, height: 36, background: 'var(--border)', margin: '0 0.15rem' }} />

        <button
          onClick={handleLeave}
          style={{
            padding: '0.6rem 1.5rem', borderRadius: 10,
            background: 'var(--danger)', color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
            transition: 'all var(--transition)', boxShadow: '0 2px 14px var(--danger-glow)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
        >
          Leave Room
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{
        textAlign: 'center', padding: '0.35rem',
        fontSize: '0.68rem', color: 'var(--text-dim)', background: 'var(--surface)',
      }}>
        {[['M', 'mute'], ['V', 'camera'], ['Esc', 'leave']].map(([key, desc]) => (
          <span key={key} style={{ marginRight: '0.75rem' }}>
            <kbd style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border)', fontFamily: 'monospace' }}>{key}</kbd>
            {' '}{desc}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Control Button ────────────────────────────────────────────────────────── */
interface CtrlBtnProps {
  icon: string;
  label: string;
  shortcut?: string;
  danger?: boolean;
  accent?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function CtrlBtn({ icon, label, shortcut, danger, accent, disabled, onClick }: CtrlBtnProps) {
  const borderColor = danger
    ? 'rgba(255,77,106,0.5)'
    : accent
      ? 'rgba(108,99,255,0.5)'
      : 'var(--border)';
  const bg = danger
    ? 'rgba(255,77,106,0.12)'
    : accent
      ? 'rgba(108,99,255,0.15)'
      : 'var(--surface-2)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
        padding: '0.5rem 0.85rem', borderRadius: 10,
        background: bg, border: `1.5px solid ${borderColor}`,
        transition: 'all var(--transition)', minWidth: 58,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
    >
      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}
