import { useEffect } from 'react';
import { SpatialScene } from '../pages/SpatialScene';
import { CameraFeed, DebugOverlay, FpsMonitor } from '../components';
import { useAppStore } from '../stores/appStore';

export default function App() {
  const debugMode = useAppStore((s) => s.debugMode);
  const toggleDebugMode = useAppStore((s) => s.toggleDebugMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMode]);

  return (
    <>
      <SpatialScene />
      <CameraFeed />
      {debugMode && (
        <>
          <DebugOverlay />
          <FpsMonitor />
        </>
      )}
    </>
  );
}
