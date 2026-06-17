import type { Handedness } from '../../../types/hand';

export const InteractionState = {
  IDLE: 'IDLE',
  HOVERING: 'HOVERING',
  SELECTING: 'SELECTING',
  GRABBING: 'GRABBING',
} as const;

export type InteractionState = (typeof InteractionState)[keyof typeof InteractionState];

export interface InteractionConfig {
  maxInteractionDistance: number;
  lerpSpeed: number;
  hoverScaleMultiplier: number;
  cursorMode: 'index_tip' | 'pinch_midpoint';
  worldScale: number;
}

export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  maxInteractionDistance: 0.8,
  lerpSpeed: 0.15,
  hoverScaleMultiplier: 1.08,
  cursorMode: 'pinch_midpoint',
  worldScale: 5,
};

export interface InteractionCursor {
  x: number;
  y: number;
  z: number;
  handedness: Handedness;
}

export interface ObjectTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
