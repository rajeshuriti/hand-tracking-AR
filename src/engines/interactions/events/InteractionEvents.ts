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
