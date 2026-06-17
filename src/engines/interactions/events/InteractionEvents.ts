import type { Handedness } from '../../../types/hand';
import type { ObjectTransform } from './InteractionTypes';

export interface ObjectHoveredPayload {
  objectId: string;
  handedness: Handedness;
}

export interface ObjectUnhoveredPayload {
  objectId: string;
}

export interface ObjectSelectedPayload {
  objectId: string;
  handedness: Handedness;
}

export interface ObjectReleasedPayload {
  objectId: string;
  finalPosition: [number, number, number];
}

export interface ObjectMovedPayload {
  objectId: string;
  transform: ObjectTransform;
}

export interface ObjectCreatedPayload {
  objectId: string;
  type: string;
  position: [number, number, number];
}

export interface ObjectDestroyedPayload {
  objectId: string;
}

export interface GrabStartedPayload {
  objectId: string;
  handedness: Handedness;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface GrabUpdatedPayload {
  objectId: string;
  handedness: Handedness;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
}

export interface GrabEndedPayload {
  objectId: string;
  handedness: Handedness;
  finalPosition: [number, number, number];
  finalRotation: [number, number, number];
  velocity: [number, number, number];
  durationMs: number;
}

export interface GrabTransferredPayload {
  objectId: string;
  fromHand: Handedness;
  toHand: Handedness;
  position: [number, number, number];
}
