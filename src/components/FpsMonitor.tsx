import { useRef, useEffect, useState } from 'react';

export function FpsMonitor() {
  const [fps, setFps] = useState(0);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let raf: number;

    const tick = () => {
      framesRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / delta));
        framesRef.current = 0;
        lastTimeRef.current = now;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = fps >= 55 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff4444';

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      background: 'rgba(0, 0, 0, 0.7)',
      color,
      padding: '4px 10px',
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 600,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {fps} FPS
    </div>
  );
}
