import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SceneEnvironment } from '../engines/scene';
import { HandVisualization } from '../engines/scene';
import { InteractionScene } from '../engines/interactions';
import { useSceneStore } from '../stores/sceneStore';
import { eventBus } from '../services/EventBus';
import { useEffect } from 'react';

export function SpatialScene() {
  const config = useSceneStore((s) => s.config);
  const setReady = useSceneStore((s) => s.setReady);

  useEffect(() => {
    setReady(true);
    eventBus.emit('scene:ready', undefined);
    return () => setReady(false);
  }, [setReady]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: config.cameraPosition, fov: 60, near: 0.1, far: 100 }}
        style={{ background: config.backgroundColor }}
        gl={{ antialias: true, alpha: false }}
      >
        <SceneEnvironment />
        <HandVisualization />
        <InteractionScene />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
