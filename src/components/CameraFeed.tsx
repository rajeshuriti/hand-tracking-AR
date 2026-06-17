import { useRef, useCallback, useState } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { useAppStore } from '../stores/appStore';

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { start, stop, isTracking } = useHandTracking();
  const [loading, setLoading] = useState(false);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);

  const handleToggle = useCallback(async () => {
    if (isTracking) {
      stop();
      return;
    }
    if (!videoRef.current) return;

    setError(null);
    setLoading(true);
    try {
      await start(videoRef.current);
    } catch {
      // error is already set in store by CameraEngine
    } finally {
      setLoading(false);
    }
  }, [isTracking, start, stop, setError]);

  const buttonLabel = loading
    ? 'Connecting...'
    : isTracking
      ? 'Stop Tracking'
      : 'Start Tracking';

  const buttonColor = loading
    ? '#666'
    : isTracking
      ? '#ff4444'
      : '#00d4ff';

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
      maxWidth: 280,
    }}>
      <video
        ref={videoRef}
        style={{
          width: 240,
          height: 180,
          borderRadius: 12,
          objectFit: 'cover',
          border: `2px solid ${isTracking ? '#00d4ff' : error ? '#ff4444' : '#333'}`,
          background: '#000',
          transform: 'scaleX(-1)',
        }}
        playsInline
        muted
      />

      {error && !isTracking && (
        <div style={{
          background: 'rgba(255, 40, 40, 0.15)',
          border: '1px solid rgba(255, 68, 68, 0.4)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11,
          color: '#ff8888',
          lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: 'none',
          background: buttonColor,
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
