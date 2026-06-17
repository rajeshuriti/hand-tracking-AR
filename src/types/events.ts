import type { HandData, HandTrackingResult } from './hand';
import type { GestureResult, GestureTransition } from './gestures';
import type {
  ObjectHoveredPayload,
  ObjectUnhoveredPayload,
  ObjectSelectedPayload,
  ObjectReleasedPayload,
  ObjectMovedPayload,
  ObjectCreatedPayload,
  ObjectDestroyedPayload,
} from '../engines/interactions/events/InteractionEvents';
import type {
  BodyRegisteredPayload,
  BodyRemovedPayload,
  BodyGrabbedPayload,
  BodyReleasedPayload,
  BodyThrownPayload,
  CollisionStartedPayload,
  CollisionEndedPayload,
} from '../engines/physics/events/PhysicsEvents';

export interface EventMap {
  'camera:started': { width: number; height: number };
  'camera:stopped': void;
  'camera:error': { error: string };
  'camera:frame': { timestamp: number };

  'hand:tracking:started': void;
  'hand:tracking:stopped': void;
  'hand:detected': HandTrackingResult;
  'hand:updated': HandTrackingResult;
  'hand:lost': { handedness: 'Left' | 'Right'; timestamp: number };
  'hand:gained': { hand: HandData };
  'hand:landmarks': { hands: HandData[]; timestamp: number };

  'gesture:start': GestureResult;
  'gesture:hold': GestureResult;
  'gesture:end': GestureResult;
  'gesture:changed': GestureTransition;

  'interaction:object:hovered': ObjectHoveredPayload;
  'interaction:object:unhovered': ObjectUnhoveredPayload;
  'interaction:object:selected': ObjectSelectedPayload;
  'interaction:object:released': ObjectReleasedPayload;
  'interaction:object:moved': ObjectMovedPayload;
  'interaction:object:created': ObjectCreatedPayload;
  'interaction:object:destroyed': ObjectDestroyedPayload;

  'physics:body:registered': BodyRegisteredPayload;
  'physics:body:removed': BodyRemovedPayload;
  'physics:body:grabbed': BodyGrabbedPayload;
  'physics:body:released': BodyReleasedPayload;
  'physics:body:thrown': BodyThrownPayload;
  'physics:collision:started': CollisionStartedPayload;
  'physics:collision:ended': CollisionEndedPayload;
  'physics:paused': void;
  'physics:resumed': void;

  'scene:ready': void;
  'scene:object:added': { id: string };
  'scene:object:removed': { id: string };

  'app:initialized': void;
  'app:error': { error: string; source: string };
}

export type EventName = keyof EventMap;
export type EventPayload<T extends EventName> = EventMap[T];
export type EventHandler<T extends EventName> = (payload: EventPayload<T>) => void;
