import { useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useObjectInteraction } from '../hooks/useObjectInteraction';
import { useObjectSpawner } from './ObjectSpawner';
import type { InteractiveObject3D } from './InteractiveObject3D';
import { PhysicsCube, PhysicsSphere, PhysicsGround } from '../../physics';
import { usePhysics } from '../../physics/hooks/usePhysics';
import { useGrabPhysics } from '../../physics/hooks/useGrabPhysics';
import { usePhysicsStore } from '../../physics/stores/PhysicsStore';
import { useInteractionStore } from '../../../stores/interactionStore';
import { useGestureStore } from '../../../stores/gestureStore';
import { useHandTrackingStore } from '../../../stores/handTrackingStore';
import { GestureType, GestureState } from '../../../types/gestures';
import { HandLandmark } from '../../../types/hand';
import { useRef, useEffect, useCallback, createContext, useContext, useMemo } from 'react';

interface InteractionAPI {
  spawnCube: (pos?: [number, number, number]) => InteractiveObject3D;
  spawnSphere: (pos?: [number, number, number]) => InteractiveObject3D;
  spawnRandom: (pos?: [number, number, number]) => InteractiveObject3D;
  removeObject: (id: string) => void;
  objectCount: number;
}

export const InteractionContext = createContext<InteractionAPI | null>(null);

export function useInteractionAPI(): InteractionAPI {
  const ctx = useContext(InteractionContext);
  if (!ctx) throw new Error('useInteractionAPI must be used within InteractionScene');
  return ctx;
}

function PhysicsInteractionInner() {
  const {
    processFrame,
    registerObject,
    removeObject,
    objectCount,
  } = useObjectInteraction();

  const { registerBody, getBody } = usePhysics();
  const { grab, moveGrabbed, release, isGrabbing } = useGrabPhysics();

  const objectsRef = useRef<InteractiveObject3D[]>([]);

  const handleRegister = useCallback(
    (obj: InteractiveObject3D) => {
      registerObject(obj);
      objectsRef.current = [...objectsRef.current, obj];
    },
    [registerObject],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeObject(id);
      objectsRef.current = objectsRef.current.filter((o) => o.id !== id);
    },
    [removeObject],
  );

  const { spawnCube, spawnSphere, spawnRandom } = useObjectSpawner(handleRegister);

  const handleBodyReady = useCallback(
    (id: string, body: RapierRigidBody) => {
      registerBody(id, body);
    },
    [registerBody],
  );

  useEffect(() => {
    const cubePositions: [number, number, number][] = [
      [-2.5, 1, 0], [-1.5, 1, 0], [-0.5, 1, 0], [0.5, 1, 0], [1.5, 1, 0],
      [-2, 2, 0], [-1, 2, 0], [0, 2, 0], [1, 2, 0],
      [-1.5, 3, 0], [-0.5, 3, 0], [0.5, 3, 0],
      [-1, 4, 0], [0, 4, 0],
      [-0.5, 5, 0],
      [2.5, 1, 0], [2.5, 2, 0], [2.5, 3, 0], [2.5, 4, 0], [2.5, 5, 0],
    ];
    for (const pos of cubePositions) {
      spawnCube(pos);
    }

    const spherePositions: [number, number, number][] = [
      [-3.5, 1, -1], [-2.5, 1, -1], [-1.5, 1, -1], [-0.5, 1, -1], [0.5, 1, -1],
      [1.5, 1, -1], [2.5, 1, -1], [3.5, 1, -1],
      [-3, 2, -1], [-2, 2, -1], [-1, 2, -1], [0, 2, -1],
      [1, 2, -1], [2, 2, -1], [3, 2, -1],
      [-2.5, 3, -1], [-1.5, 3, -1], [-0.5, 3, -1], [0.5, 3, -1], [1.5, 3, -1],
    ];
    for (const pos of spherePositions) {
      spawnSphere(pos);
    }
  }, [spawnCube, spawnSphere]);

  useFrame(() => {
    processFrame();

    const { hands } = useHandTrackingStore.getState();
    const { rightGesture, leftGesture } = useGestureStore.getState();

    const activeGesture = rightGesture.type !== GestureType.NONE ? rightGesture : leftGesture;
    const activeHand = hands.find((h) => h.handedness === activeGesture.handedness);

    if (activeGesture.type === GestureType.PINCH && activeHand) {
      const thumb = activeHand.landmarks[HandLandmark.THUMB_TIP];
      const index = activeHand.landmarks[HandLandmark.INDEX_FINGER_TIP];
      if (!thumb || !index) return;
      const handPos: [number, number, number] = [
        (thumb.x + index.x) / 2,
        (thumb.y + index.y) / 2,
        (thumb.z + index.z) / 2,
      ];

      if (activeGesture.state === GestureState.START && !isGrabbing()) {
        const { selectedObjectId } = useInteractionStore.getState();
        if (selectedObjectId) {
          const body = getBody(selectedObjectId);
          if (body) {
            grab(selectedObjectId, body, handPos, activeHand.handedness);
          }
        }
      } else if (
        (activeGesture.state === GestureState.HOLD || activeGesture.state === GestureState.START) &&
        isGrabbing()
      ) {
        moveGrabbed(handPos);
      }
    } else if (isGrabbing()) {
      release();
    }
  });

  const cubes = useMemo(() => objectsRef.current.filter((o) => o.name === 'Cube'), [objectsRef.current]);
  const spheres = useMemo(() => objectsRef.current.filter((o) => o.name === 'Sphere'), [objectsRef.current]);

  const api: InteractionAPI = {
    spawnCube,
    spawnSphere,
    spawnRandom,
    removeObject: handleRemove,
    objectCount,
  };

  return (
    <InteractionContext.Provider value={api}>
      <PhysicsGround />
      {cubes.map((obj) => (
        <PhysicsCube key={obj.id} interactable={obj} onBodyReady={handleBodyReady} />
      ))}
      {spheres.map((obj) => (
        <PhysicsSphere key={obj.id} interactable={obj} onBodyReady={handleBodyReady} />
      ))}
    </InteractionContext.Provider>
  );
}

export function InteractionScene() {
  const debugEnabled = usePhysicsStore((s) => s.debugEnabled);

  return (
    <Physics gravity={[0, -9.81, 0]} debug={debugEnabled} interpolate>
      <PhysicsInteractionInner />
    </Physics>
  );
}
