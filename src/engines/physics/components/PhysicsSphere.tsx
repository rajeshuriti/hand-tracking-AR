import { useRef, useState, useCallback } from 'react';
import { RigidBody, BallCollider } from '@react-three/rapier';
import type { RapierRigidBody, CollisionEnterPayload, CollisionExitPayload } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { InteractiveObject3D } from '../../interactions/components/InteractiveObject3D';
import { usePhysicsStore } from '../stores/PhysicsStore';
import { eventBus } from '../../../services/EventBus';
import { DEFAULT_PHYSICS_CONFIG } from '../interfaces/IPhysicsConfig';

interface Props {
  interactable: InteractiveObject3D;
  onBodyReady?: (id: string, body: RapierRigidBody) => void;
}

export function PhysicsSphere({ interactable, onBodyReady }: Props) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [, forceUpdate] = useState(0);
  const reportedRef = useRef(false);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  interactable.onChange(triggerUpdate);

  useFrame(() => {
    const body = rigidBodyRef.current;
    if (!body) return;

    if (!reportedRef.current && onBodyReady) {
      onBodyReady(interactable.id, body);
      reportedRef.current = true;
    }

    const pos = body.translation();
    interactable.position = [pos.x, pos.y, pos.z];

    const rot = body.rotation();
    const mesh = meshRef.current;
    if (mesh) {
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  });

  const handleCollisionEnter = useCallback(
    (payload: CollisionEnterPayload) => {
      const otherId = payload.other.rigidBodyObject?.name ?? 'unknown';
      const manifold = payload.manifold;
      const point = manifold.localContactPoint1(0);
      usePhysicsStore.getState().incrementCollisions();
      eventBus.emit('physics:collision:started', {
        objectIdA: interactable.id,
        objectIdB: otherId,
        contactPoint: point ? [point.x, point.y, point.z] : [0, 0, 0],
        impactForce: 0,
        timestamp: performance.now(),
      });
    },
    [interactable.id],
  );

  const handleCollisionExit = useCallback(
    (payload: CollisionExitPayload) => {
      const otherId = payload.other.rigidBodyObject?.name ?? 'unknown';
      eventBus.emit('physics:collision:ended', {
        objectIdA: interactable.id,
        objectIdB: otherId,
        timestamp: performance.now(),
      });
    },
    [interactable.id],
  );

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

  const hoverScale = interactable.isHovered && !interactable.isSelected ? 1.08 : 1;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={interactable.position}
      type="dynamic"
      colliders={false}
      restitution={DEFAULT_PHYSICS_CONFIG.restitution + 0.2}
      friction={DEFAULT_PHYSICS_CONFIG.friction - 0.2}
      linearDamping={DEFAULT_PHYSICS_CONFIG.linearDamping}
      angularDamping={DEFAULT_PHYSICS_CONFIG.angularDamping * 0.5}
      ccd={DEFAULT_PHYSICS_CONFIG.ccdEnabled}
      name={interactable.id}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
    >
      <BallCollider args={[0.5]} />
      <mesh ref={meshRef} scale={[hoverScale, hoverScale, hoverScale]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={interactable.isSelected ? 0.6 : interactable.isHovered ? 0.3 : 0}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
}
