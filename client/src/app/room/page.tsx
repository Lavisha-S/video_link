'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VideoRoom from '../components/VideoRoom';

function RoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const identity = searchParams.get('identity') || '';
  const roomName = searchParams.get('roomName') || '';

  useEffect(() => {
    // Guard: redirect if params are missing
    if (!identity || !roomName) {
      router.replace('/');
    }
  }, [identity, roomName, router]);

  if (!identity || !roomName) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Redirecting...
      </div>
    );
  }

  return <VideoRoom identity={identity} roomName={roomName} />;
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          Loading room...
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
