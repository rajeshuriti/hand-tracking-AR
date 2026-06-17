import { useRef, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import type { SceneObject } from '../../types/scene';
import { useSceneStore } from '../../stores/sceneStore';

interface Props {
  data: SceneObject;
}

const geometries = {
  box: <boxGeometry args={[1, 1, 1]} />,
  sphere: <sphereGeometry args={[0.5, 32, 32]} />,
  cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
  plane: <planeGeometry args={[1, 1]} />,
  custom: <boxGeometry args={[1, 1, 1]} />,
} as const;

export function InteractiveObject({ data }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const selectObject = useSceneStore((s) => s.selectObject);
  const isSelected = selectedId === data.id;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!data.interactive) return;
    e.stopPropagation();
    selectObject(isSelected ? null : data.id);
  };

  return (
    <mesh
      ref={ref}
      position={data.position}
      rotation={data.rotation}
      scale={data.scale}
      onClick={handleClick}
      onPointerOver={() => data.interactive && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {geometries[data.type]}
      <meshStandardMaterial
        color={isSelected ? '#ffcc00' : hovered ? '#88bbff' : data.color}
        emissive={isSelected ? '#332200' : hovered ? '#001133' : '#000000'}
        roughness={0.4}
        metalness={0.1}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[ref.current?.geometry]} />
          <lineBasicMaterial color="#ffcc00" />
        </lineSegments>
      )}
    </mesh>
  );
}
