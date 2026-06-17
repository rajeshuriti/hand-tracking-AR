import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHandTrackingStore } from '../../../stores/handTrackingStore';
import { useGestureStore } from '../../../stores/gestureStore';
import { useInteractionStore } from '../../../stores/interactionStore';
import { GestureType, GestureState } from '../../../types/gestures';
import { HandLandmark } from '../../../types/hand';

const SPHERE_RADIUS = 0.15;
const GRAB_DISTANCE = 1.0;
const LERP_SPEED = 0.25;
const WORLD_SCALE = 3;

function landmarkToWorld(x: number, y: number, z: number): [number, number, number] {
  return [
    (x - 0.5) * WORLD_SCALE,
    -(y - 0.5) * WORLD_SCALE,
    -z * WORLD_SCALE,
  ];
}

function CursorIndicator() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.5 }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const pos = useInteractionStore.getState().cursorPosition;
    const isGrabbed = useInteractionStore.getState().isGrabbed;

    if (pos[0] === 0 && pos[1] === 0 && pos[2] === 0) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    mesh.position.set(pos[0], pos[1], pos[2]);
    material.color.setHex(isGrabbed ? 0x44dd88 : 0xffcc00);
    material.opacity = isGrabbed ? 0.7 : 0.4;
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[0.04, 12, 12]} />
    </mesh>
  );
}

export function InteractionScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const grabbedRef = useRef(false);
  const offsetRef = useRef<[number, number, number]>([0, 0, 0]);
  const positionRef = useRef<[number, number, number]>([0, 0, 0]);

  const normalMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.1 }),
    [],
  );

  const grabbedMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: 0x44dd88,
      emissive: 0x113322,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.15,
    }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { hands } = useHandTrackingStore.getState();
    const { rightGesture, leftGesture } = useGestureStore.getState();

    const activeGesture = rightGesture.type !== GestureType.NONE ? rightGesture : leftGesture;
    const hand = hands.find((h) => h.handedness === activeGesture.handedness) ?? hands[0];

    if (!hand) {
      if (grabbedRef.current) {
        grabbedRef.current = false;
        mesh.material = normalMaterial;
        useInteractionStore.getState().setGrabbed(false);
      }
      return;
    }

    const thumb = hand.landmarks[HandLandmark.THUMB_TIP];
    const index = hand.landmarks[HandLandmark.INDEX_FINGER_TIP];
    if (!thumb || !index) return;

    const pinchWorld = landmarkToWorld(
      (thumb.x + index.x) / 2,
      (thumb.y + index.y) / 2,
      (thumb.z + index.z) / 2,
    );

    useInteractionStore.getState().setCursorPosition(pinchWorld);

    const isPinching = activeGesture.type === GestureType.PINCH &&
      (activeGesture.state === GestureState.START || activeGesture.state === GestureState.HOLD);

    if (isPinching && !grabbedRef.current) {
      const dx = pinchWorld[0] - positionRef.current[0];
      const dy = pinchWorld[1] - positionRef.current[1];
      const dist2D = Math.sqrt(dx * dx + dy * dy);

      if (dist2D < GRAB_DISTANCE) {
        grabbedRef.current = true;
        offsetRef.current = [
          positionRef.current[0] - pinchWorld[0],
          positionRef.current[1] - pinchWorld[1],
          0,
        ];
        mesh.material = grabbedMaterial;
        useInteractionStore.getState().setGrabbed(true);
      }
    }

    if (!isPinching && grabbedRef.current) {
      grabbedRef.current = false;
      mesh.material = normalMaterial;
      useInteractionStore.getState().setGrabbed(false);
    }

    if (grabbedRef.current) {
      const targetX = pinchWorld[0] + offsetRef.current[0];
      const targetY = pinchWorld[1] + offsetRef.current[1];

      positionRef.current[0] += (targetX - positionRef.current[0]) * LERP_SPEED;
      positionRef.current[1] += (targetY - positionRef.current[1]) * LERP_SPEED;
    }

    mesh.position.set(positionRef.current[0], positionRef.current[1], positionRef.current[2]);
  });

  return (
    <>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
        <meshStandardMaterial color={0x4488ff} roughness={0.3} metalness={0.1} />
      </mesh>
      <CursorIndicator />
    </>
  );
}
