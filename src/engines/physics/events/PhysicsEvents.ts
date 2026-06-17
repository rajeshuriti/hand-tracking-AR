import type { Handedness } from '../../../types/hand';

export interface BodyRegisteredPayload {
  objectId: string;
  mass: number;
  isDynamic: boolean;
}

export interface BodyRemovedPayload {
  objectId: string;
}

export interface BodyGrabbedPayload {
  objectId: string;
  handedness: Handedness;
}

export interface BodyReleasedPayload {
  objectId: string;
  velocity: [number, number, number];
}

export interface BodyThrownPayload {
  objectId: string;
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  speed: number;
}

export interface CollisionStartedPayload {
  objectIdA: string;
  objectIdB: string;
  contactPoint: [number, number, number];
  impactForce: number;
  timestamp: number;
}

export interface CollisionEndedPayload {
  objectIdA: string;
  objectIdB: string;
  timestamp: number;
}
