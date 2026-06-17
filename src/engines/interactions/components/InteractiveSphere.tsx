import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { InteractiveObject3D } from './InteractiveObject3D';

interface Props {
  interactable: InteractiveObject3D;
  hoverScaleMultiplier?: number;
}

export function InteractiveSphere({ interactable, hoverScaleMultiplier = 1.08 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    interactable.onChange(triggerUpdate);
    return () => interactable.onChange(() => {});
  }, [interactable, triggerUpdate]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.position.set(...interactable.position);
    mesh.rotation.set(...interactable.rotation);

    if (interactable.isSelected) {
      mesh.scale.set(...interactable.baseScale);
    } else if (interactable.isHovered) {
      mesh.scale.set(
        interactable.baseScale[0] * hoverScaleMultiplier,
        interactable.baseScale[1] * hoverScaleMultiplier,
        interactable.baseScale[2] * hoverScaleMultiplier,
      );
    } else {
      mesh.scale.set(...interactable.baseScale);
    }
  });

  const color = interactable.isSelected
    ? '#ffcc00'
    : interactable.isHovered
      ? '#88bbff'
      : interactable.baseColor;

  const emissive = interactable.isSelected
    ? '#553300'
    : interactable.isHovered
      ? '#112244'
      : '#000000';

  return (
    <mesh ref={meshRef} position={interactable.position} rotation={interactable.rotation}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={interactable.isSelected ? 0.6 : interactable.isHovered ? 0.3 : 0}
        roughness={0.25}
        metalness={0.2}
      />
    </mesh>
  );
}
