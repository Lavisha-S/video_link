'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
  LocalTrackPublication,
} from 'twilio-video';
import { fetchToken, ApiError } from '@/lib/api';

export type ConnectionStatus =
  | 'idle'
  | 'acquiring-media'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface UseVideoRoomReturn {
  status: ConnectionStatus;
  error: string | null;
  localStream: MediaStream | null;
  /** Raw Twilio RemoteParticipant objects for rendering tiles */
  remoteParticipants: RemoteParticipant[];
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  connect: (identity: string, roomName: string) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  clearError: () => void;
}

export function useVideoRoom(): UseVideoRoomReturn {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<(LocalVideoTrack | LocalAudioTrack)[]>([]);
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const refreshRemoteParticipants = useCallback((room: Room) => {
    setRemoteParticipants(Array.from(room.participants.values()));
  }, []);

  const cleanupLocalTracks = useCallback(() => {
    localTracksRef.current.forEach((t) => { t.stop(); t.detach(); });
    localTracksRef.current = [];
    setLocalStream(null);
  }, []);

  const cleanupScreenTrack = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current.detach();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    cleanupLocalTracks();
    cleanupScreenTrack();
    setRemoteParticipants([]);
    setIsMuted(false);
    setIsCameraOff(false);
    setStatus('idle');
  }, [cleanupLocalTracks, cleanupScreenTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (roomRef.current) roomRef.current.disconnect();
      cleanupLocalTracks();
      cleanupScreenTrack();
    };
  }, [cleanupLocalTracks, cleanupScreenTrack]);

  // ── Connect ───────────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (identity: string, roomName: string) => {
      // Prevent duplicate connections
      if (status === 'connecting' || status === 'connected' || status === 'acquiring-media') return;

      setError(null);
      setStatus('acquiring-media');

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Step 1: Dynamic import (SSR-safe)
      let Video: typeof import('twilio-video');
      try {
        Video = await import('twilio-video');
      } catch {
        setError('Failed to load video library. Please refresh the page.');
        setStatus('error');
        return;
      }

      // Step 2: Acquire local media
      let localVideoTrack: LocalVideoTrack | undefined;
      let localAudioTrack: LocalAudioTrack | undefined;

      try {
        const tracks = await Video.createLocalTracks({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true,
        });

        for (const track of tracks) {
          if (track.kind === 'video') localVideoTrack = track as LocalVideoTrack;
          if (track.kind === 'audio') localAudioTrack = track as LocalAudioTrack;
        }
        localTracksRef.current = tracks as (LocalVideoTrack | LocalAudioTrack)[];

        // Build MediaStream for local preview
        if (localVideoTrack) {
          const ms = new MediaStream();
          const raw = (localVideoTrack as any).mediaStreamTrack;
          if (raw) ms.addTrack(raw);
          setLocalStream(ms);
        }
      } catch (err: unknown) {
        const name = (err as any)?.name ?? '';
        const msg = (err as Error).message ?? '';

        if (name === 'NotAllowedError' || msg.includes('Permission denied')) {
          setError('Camera/microphone access denied. Allow permissions in your browser and try again.');
        } else if (name === 'NotFoundError' || msg.includes('DevicesNotFound')) {
          setError('No camera or microphone found. Connect a device and try again.');
        } else if (name === 'NotReadableError') {
          setError('Camera or microphone is in use by another app. Close it and try again.');
        } else if (name === 'OverconstrainedError') {
          // Retry with relaxed constraints
          try {
            const fallback = await Video.createLocalTracks({ audio: true, video: true });
            localTracksRef.current = fallback as (LocalVideoTrack | LocalAudioTrack)[];
            localVideoTrack = fallback.find((t) => t.kind === 'video') as LocalVideoTrack | undefined;
            localAudioTrack = fallback.find((t) => t.kind === 'audio') as LocalAudioTrack | undefined;
            if (localVideoTrack) {
              const ms = new MediaStream();
              const raw = (localVideoTrack as any).mediaStreamTrack;
              if (raw) ms.addTrack(raw);
              setLocalStream(ms);
            }
          } catch {
            setError('Could not access media devices with your current hardware.');
            setStatus('error');
            return;
          }
        } else {
          setError(`Media error: ${msg || 'Could not access camera or microphone.'}`);
          setStatus('error');
          return;
        }

        // Only continue if we recovered via OverconstrainedError fallback
        if (!localTracksRef.current.length) {
          setStatus('error');
          return;
        }
      }

      // Step 3: Fetch token
      setStatus('connecting');
      let token: string;
      try {
        const resp = await fetchToken(identity, roomName, abortRef.current.signal);
        token = resp.token;
      } catch (err: unknown) {
        cleanupLocalTracks();
        if (err instanceof ApiError) {
          if (err.statusCode === 429) {
            setError('Too many requests — please wait a moment and try again.');
          } else if (err.statusCode === 400) {
            setError(`Invalid input: ${err.message}`);
          } else {
            setError(err.message);
          }
        } else {
          setError('Unexpected error while fetching token.');
        }
        setStatus('error');
        return;
      }

      // Step 4: Connect to Twilio room
      try {
        const tracksToPublish = [localVideoTrack, localAudioTrack].filter(Boolean) as (LocalVideoTrack | LocalAudioTrack)[];

        const room = await Video.connect(token, {
          name: roomName,
          tracks: tracksToPublish,
          bandwidthProfile: {
            video: { mode: 'collaboration', maxTracks: 10 },
          },
          preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
          networkQuality: { local: 1, remote: 1 },
        });

        roomRef.current = room;
        setStatus('connected');
        refreshRemoteParticipants(room);

        // ── Room events ──────────────────────────────────────────────────────
        room.on('participantConnected', (p: RemoteParticipant) => {
          refreshRemoteParticipants(room);
          // Re-render when their tracks change
          const refresh = () => refreshRemoteParticipants(room);
          p.on('trackSubscribed', refresh);
          p.on('trackUnsubscribed', refresh);
          p.on('trackEnabled', refresh);
          p.on('trackDisabled', refresh);
        });

        room.on('participantDisconnected', () => {
          refreshRemoteParticipants(room);
        });

        // Pre-bind events for already-present participants
        room.participants.forEach((p: RemoteParticipant) => {
          const refresh = () => refreshRemoteParticipants(room);
          p.on('trackSubscribed', refresh);
          p.on('trackUnsubscribed', refresh);
          p.on('trackEnabled', refresh);
          p.on('trackDisabled', refresh);
        });

        room.on('reconnecting', (reconnErr) => {
          console.warn('[Room] Reconnecting:', reconnErr?.message);
          setStatus('reconnecting');
        });

        room.on('reconnected', () => {
          setStatus('connected');
          refreshRemoteParticipants(room);
        });

        room.on('disconnected', (_room: Room, disconnErr) => {
          if (disconnErr) {
            const code = (disconnErr as any).code;
            if (code === 20104) {
              setError('Session expired. Please rejoin the room.');
            } else if (code === 53001) {
              setError('Network connection lost. Please check your internet.');
            } else {
              setError(`Disconnected: ${disconnErr.message}`);
            }
            setStatus('error');
          } else {
            setStatus('disconnected');
          }
          cleanupLocalTracks();
          cleanupScreenTrack();
          setRemoteParticipants([]);
          roomRef.current = null;
        });

        // Graceful disconnect on tab/window close
        const onBeforeUnload = () => room.disconnect();
        window.addEventListener('beforeunload', onBeforeUnload);
        room.once('disconnected', () => window.removeEventListener('beforeunload', onBeforeUnload));
      } catch (err: unknown) {
        cleanupLocalTracks();
        const code = (err as any)?.code;
        const msg = (err as Error).message ?? 'Unknown error';

        if (code === 20101 || code === 20103) {
          setError('Access token invalid or expired. Please try again.');
        } else if (code === 53105) {
          setError('Room is full. Try a different room name.');
        } else if (code === 53118) {
          setError('Room not found or access denied.');
        } else if (msg.toLowerCase().includes('signaling')) {
          setError('Could not reach Twilio servers. Check your internet connection.');
        } else {
          setError(`Failed to join room: ${msg}`);
        }
        setStatus('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cleanupLocalTracks, cleanupScreenTrack, refreshRemoteParticipants]
  );

  // ── Toggle Mute ───────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.audioTracks.forEach((pub: LocalTrackPublication) => {
      const track = pub.track as LocalAudioTrack;
      isMuted ? track.enable() : track.disable();
    });
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  // ── Toggle Camera ─────────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
      const track = pub.track as LocalVideoTrack;
      if (!track || (track as any)._name === 'screen') return; // skip screen share track
      isCameraOff ? track.enable() : track.disable();
    });
    setIsCameraOff((prev) => !prev);
  }, [isCameraOff]);

  // ── Toggle Screen Share ────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current) return;

    if (isScreenSharing) {
      if (screenTrackRef.current) {
        roomRef.current.localParticipant.unpublishTrack(screenTrackRef.current);
        cleanupScreenTrack();
      }
      // Re-enable camera
      if (!isCameraOff) {
        roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
          (pub.track as LocalVideoTrack)?.enable();
        });
      }
      return;
    }

    try {
      const Video = await import('twilio-video');
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      const nativeTrack = screenStream.getVideoTracks()[0];

      const screenTrack = new Video.LocalVideoTrack(nativeTrack, { name: 'screen' });
      screenTrackRef.current = screenTrack;

      // Disable camera while sharing screen
      roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
        (pub.track as LocalVideoTrack)?.disable();
      });

      await roomRef.current.localParticipant.publishTrack(screenTrack);
      setIsScreenSharing(true);

      // Browser "Stop sharing" button
      nativeTrack.addEventListener('ended', () => {
        if (roomRef.current && screenTrackRef.current) {
          roomRef.current.localParticipant.unpublishTrack(screenTrackRef.current);
        }
        cleanupScreenTrack();
        if (roomRef.current && !isCameraOff) {
          roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
            (pub.track as LocalVideoTrack)?.enable();
          });
        }
      });
    } catch (err: unknown) {
      const name = (err as any)?.name ?? '';
      // User cancelled — not an error
      if (name !== 'NotAllowedError' && name !== 'AbortError') {
        setError('Screen sharing failed. Please try again.');
      }
    }
  }, [isScreenSharing, isCameraOff, cleanupScreenTrack]);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  return {
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
  };
}
