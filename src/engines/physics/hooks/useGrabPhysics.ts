import { useRef, useCallback } from 'react';
import type { RapierRigidBody } from '@react-three/rapier';
import { DEFAULT_PHYSICS_CONFIG } from '../interfaces/IPhysicsConfig';
import type { PhysicsConfig } from '../interfaces/IPhysicsConfig';
import { usePhysicsStore } from '../stores/PhysicsStore';
import { eventBus } from '../../../services/EventBus';
import type { Handedness } from '../../../types/hand';

interface VelocitySample {
  position: [number, number, number];
  timestamp: number;
}

interface GrabData {
  objectId: string;
  bodyRef: RapierRigidBody;
  grabOffset: [number, number, number];
  velocityHistory: VelocitySample[];
  handedness: Handedness;
}

export function useGrabPhysics(config?: Partial<PhysicsConfig>) {
  const cfg = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  const grabRef = useRef<GrabData | null>(null);

  const grab = useCallback(
    (
      objectId: string,
      body: RapierRigidBody,
      handPosition: [number, number, number],
      handedness: Handedness,
    ) => {
      const bodyPos = body.translation();

      body.setBodyType(2, true); // kinematicPosition
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);

      grabRef.current = {
        objectId,
        bodyRef: body,
        grabOffset: [
          bodyPos.x - handPosition[0],
          bodyPos.y - handPosition[1],
          bodyPos.z - handPosition[2],
        ],
        velocityHistory: [
          { position: [...handPosition] as [number, number, number], timestamp: performance.now() },
        ],
        handedness,
      };

      usePhysicsStore.getState().setGrabbedObjectId(objectId);
      eventBus.emit('physics:body:grabbed', { objectId, handedness });
    },
    [cfg],
  );

  const moveGrabbed = useCallback(
    (handPosition: [number, number, number]) => {
      const data = grabRef.current;
      if (!data) return;

      const targetX = handPosition[0] + data.grabOffset[0];
      const targetY = handPosition[1] + data.grabOffset[1];
      const targetZ = handPosition[2] + data.grabOffset[2];

      data.bodyRef.setNextKinematicTranslation({ x: targetX, y: targetY, z: targetZ });

      data.velocityHistory.push({
        position: [...handPosition] as [number, number, number],
        timestamp: performance.now(),
      });
      if (data.velocityHistory.length > cfg.velocityHistorySize) {
        data.velocityHistory.shift();
      }

      const vel = computeVelocity(data.velocityHistory);
      usePhysicsStore.getState().setGrabbedVelocity(vel);
    },
    [cfg],
  );

  const release = useCallback(() => {
    const data = grabRef.current;
    if (!data) return;

    data.bodyRef.setBodyType(0, true); // dynamic

    const velocity = computeVelocity(data.velocityHistory);
    const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
    const clampedSpeed = Math.min(speed, cfg.maxThrowSpeed);
    const scale = speed > 0 ? (clampedSpeed / speed) * cfg.throwMultiplier : 0;

    const linVel = {
      x: velocity[0] * scale,
      y: velocity[1] * scale,
      z: velocity[2] * scale,
    };
    data.bodyRef.setLinvel(linVel, true);

    const angVel = {
      x: velocity[1] * cfg.throwAngularMultiplier,
      y: -velocity[0] * cfg.throwAngularMultiplier,
      z: velocity[2] * cfg.throwAngularMultiplier * 0.5,
    };
    data.bodyRef.setAngvel(angVel, true);

    eventBus.emit('physics:body:released', {
      objectId: data.objectId,
      velocity: [linVel.x, linVel.y, linVel.z],
    });

    if (clampedSpeed * cfg.throwMultiplier > 1.5) {
      eventBus.emit('physics:body:thrown', {
        objectId: data.objectId,
        velocity: [linVel.x, linVel.y, linVel.z],
        angularVelocity: [angVel.x, angVel.y, angVel.z],
        speed: clampedSpeed * cfg.throwMultiplier,
      });
    }

    const store = usePhysicsStore.getState();
    store.setGrabbedObjectId(null);
    store.setGrabbedVelocity([0, 0, 0]);
    grabRef.current = null;
  }, [cfg]);

  const isGrabbing = useCallback(() => grabRef.current !== null, []);

  const getGrabbedObjectId = useCallback(() => grabRef.current?.objectId ?? null, []);

  return { grab, moveGrabbed, release, isGrabbing, getGrabbedObjectId };
}

function computeVelocity(history: VelocitySample[]): [number, number, number] {
  if (history.length < 2) return [0, 0, 0];

  let vx = 0;
  let vy = 0;
  let vz = 0;
  let totalWeight = 0;

  for (let i = 1; i < history.length; i++) {
    const dt = (history[i].timestamp - history[i - 1].timestamp) / 1000;
    if (dt <= 0) continue;

    const weight = i / history.length;
    vx += ((history[i].position[0] - history[i - 1].position[0]) / dt) * weight;
    vy += ((history[i].position[1] - history[i - 1].position[1]) / dt) * weight;
    vz += ((history[i].position[2] - history[i - 1].position[2]) / dt) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return [0, 0, 0];
  return [vx / totalWeight, vy / totalWeight, vz / totalWeight];
}
