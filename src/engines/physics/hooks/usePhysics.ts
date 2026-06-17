import { useRef, useCallback } from 'react';
import type { RapierRigidBody } from '@react-three/rapier';
import { usePhysicsStore } from '../stores/PhysicsStore';
import { eventBus } from '../../../services/EventBus';

export function usePhysics() {
  const bodyRegistryRef = useRef<Map<string, RapierRigidBody>>(new Map());

  const registerBody = useCallback((objectId: string, body: RapierRigidBody) => {
    bodyRegistryRef.current.set(objectId, body);
    usePhysicsStore.getState().setActiveBodies(bodyRegistryRef.current.size);
    eventBus.emit('physics:body:registered', {
      objectId,
      mass: body.mass(),
      isDynamic: body.bodyType() === 0,
    });
  }, []);

  const removeBody = useCallback((objectId: string) => {
    bodyRegistryRef.current.delete(objectId);
    usePhysicsStore.getState().setActiveBodies(bodyRegistryRef.current.size);
    eventBus.emit('physics:body:removed', { objectId });
  }, []);

  const getBody = useCallback((objectId: string): RapierRigidBody | undefined => {
    return bodyRegistryRef.current.get(objectId);
  }, []);

  const applyForce = useCallback((objectId: string, force: [number, number, number]) => {
    const body = bodyRegistryRef.current.get(objectId);
    if (body) body.addForce({ x: force[0], y: force[1], z: force[2] }, true);
  }, []);

  const applyImpulse = useCallback((objectId: string, impulse: [number, number, number]) => {
    const body = bodyRegistryRef.current.get(objectId);
    if (body) body.applyImpulse({ x: impulse[0], y: impulse[1], z: impulse[2] }, true);
  }, []);

  const setVelocity = useCallback((objectId: string, velocity: [number, number, number]) => {
    const body = bodyRegistryRef.current.get(objectId);
    if (body) body.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
  }, []);

  const getVelocity = useCallback((objectId: string): [number, number, number] | null => {
    const body = bodyRegistryRef.current.get(objectId);
    if (!body) return null;
    const vel = body.linvel();
    return [vel.x, vel.y, vel.z];
  }, []);

  const physicsEnabled = usePhysicsStore((s) => s.physicsEnabled);
  const debugEnabled = usePhysicsStore((s) => s.debugEnabled);
  const activeBodies = usePhysicsStore((s) => s.activeBodies);
  const grabbedObjectId = usePhysicsStore((s) => s.grabbedObjectId);
  const collisionCount = usePhysicsStore((s) => s.collisionCount);

  return {
    registerBody,
    removeBody,
    getBody,
    applyForce,
    applyImpulse,
    setVelocity,
    getVelocity,
    bodyRegistry: bodyRegistryRef.current,
    physicsEnabled,
    debugEnabled,
    activeBodies,
    grabbedObjectId,
    collisionCount,
  };
}
