'use client';

import { useEffect, useRef, useState } from 'react';
import type { RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'twilio-video';

interface Props {
  /**
   * The raw Twilio RemoteParticipant object.
   * Passed directly from room.participants so we can subscribe to track events.
   */
  participant: RemoteParticipant;
}

export default function RemoteParticipantTile({ participant }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    const attachTrack = (track: RemoteTrack) => {
      if (track.kind === 'video' && videoRef.current) {
        track.attach(videoRef.current);
        setHasVideo(true);
      }
      if (track.kind === 'audio' && audioRef.current) {
        track.attach(audioRef.current);
      }
    };

    const detachTrack = (track: RemoteTrack) => {
     // track.detach();
       if ("detach" in track) {
    (track as any).detach();
  }

      if (track.kind === 'video') setHasVideo(false);
    };

    // Attach tracks that are already subscribed
    participant.tracks.forEach((pub: RemoteTrackPublication) => {
      if (pub.isSubscribed && pub.track) {
        attachTrack(pub.track);
        if (pub.track.kind === 'audio') {
          setIsAudioMuted(!pub.isTrackEnabled);
        }
      }
    });

    participant.on('trackSubscribed', attachTrack);
    participant.on('trackUnsubscribed', detachTrack);
    participant.on('trackEnabled', (pub: RemoteTrackPublication) => {
      if (pub.track?.kind === 'audio') setIsAudioMuted(false);
    });
    participant.on('trackDisabled', (pub: RemoteTrackPublication) => {
      if (pub.track?.kind === 'audio') setIsAudioMuted(true);
    });

    return () => {
      participant.removeAllListeners();
      participant.tracks.forEach((pub: RemoteTrackPublication) => {
        pub.track?.detach();
      });
      // Clean up injected audio elements
      document.querySelectorAll(`[data-remote-audio="${participant.sid}"]`).forEach((el) => el.remove());
    };
  }, [participant]);

  const initials = participant.identity
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
      {/* Avatar placeholder when no video */}
      {!hasVideo && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: '#fff',
          }}>
            {initials || '?'}
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Camera off</span>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: hasVideo ? 'block' : 'none' }}
      />

      {/* Hidden audio element — must be in DOM for Twilio to attach audio */}
      <audio ref={audioRef} autoPlay data-remote-audio={participant.sid} style={{ display: 'none' }} />

      {/* Name badge */}
      <div style={{
        position: 'absolute', bottom: '0.6rem', left: '0.6rem',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        {participant.identity}
        {isAudioMuted && <span title="Microphone muted">🔇</span>}
      </div>
    </div>
  );
}
