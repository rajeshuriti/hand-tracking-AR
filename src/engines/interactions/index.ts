export type { IInteractable } from './interfaces/IInteractable';
export { InteractiveObject3D } from './components/InteractiveObject3D';
export { ObjectManager } from './managers/ObjectManager';
export { SelectionManager } from './managers/SelectionManager';
export { HandInteractionController } from './controllers/HandInteractionController';
export { InteractiveCube } from './components/InteractiveCube';
export { InteractiveSphere } from './components/InteractiveSphere';
export { ObjectSpawner, useObjectSpawner } from './components/ObjectSpawner';
export { InteractionScene, useInteractionAPI } from './components/InteractionScene';
export { useObjectInteraction } from './hooks/useObjectInteraction';
export { InteractionState, DEFAULT_INTERACTION_CONFIG } from './events/InteractionTypes';
export type { InteractionConfig, InteractionCursor, ObjectTransform } from './events/InteractionTypes';
export type {
  ObjectHoveredPayload,
  ObjectUnhoveredPayload,
  ObjectSelectedPayload,
  ObjectReleasedPayload,
  ObjectMovedPayload,
  ObjectCreatedPayload,
  ObjectDestroyedPayload,
} from './events/InteractionEvents';
