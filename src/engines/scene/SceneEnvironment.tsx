import { Grid, Environment } from '@react-three/drei';
import { useSceneStore } from '../../stores/sceneStore';

export function SceneEnvironment() {
  const config = useSceneStore((s) => s.config);

  return (
    <>
      <ambientLight intensity={config.ambientLightIntensity} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />

      {config.showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#2a2a3e"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#4a4a6e"
          fadeDistance={15}
          position={[0, -0.01, 0]}
        />
      )}

      {config.showAxes && <axesHelper args={[3]} />}

      <Environment preset="city" background={false} />
    </>
  );
}
