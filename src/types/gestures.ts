import type { Landmark, Handedness } from './hand';

// ── Gesture classification ──────────────────────────────────────────

export const GestureType = {
  NONE: 'NONE',
  OPEN_PALM: 'OPEN_PALM',
  FIST: 'FIST',
  PINCH: 'PINCH',
  POINT: 'POINT',
  VICTORY: 'VICTORY',
} as const;

export type GestureType = (typeof GestureType)[keyof typeof GestureType];

// ── State machine ───────────────────────────────────────────────────

export const GestureState = {
  IDLE: 'IDLE',
  START: 'START',
  HOLD: 'HOLD',
  END: 'END',
} as const;

export type GestureState = (typeof GestureState)[keyof typeof GestureState];

// ── IGesture interface — contract for every recognizer ──────────────

export interface IGesture {
  readonly type: GestureType;
  readonly displayName: string;
  recognize(landmarks: Landmark[]): GestureClassification;
}

export interface GestureClassification {
  type: GestureType;
  confidence: number;
  metrics: Record<string, number>;
}

// ── Results and events ──────────────────────────────────────────────

export interface GestureResult {
  type: GestureType;
  state: GestureState;
  confidence: number;
  handedness: Handedness;
  timestamp: number;
  durationMs: number;
  metrics: Record<string, number>;
}

export interface GestureTransition {
  previous: GestureResult;
  current: GestureResult;
  timestamp: number;
}

// ── History ─────────────────────────────────────────────────────────

export interface GestureHistoryEntry {
  type: GestureType;
  handedness: Handedness;
  startTime: number;
  endTime: number;
  peakConfidence: number;
}

// ── Engine config ───────────────────────────────────────────────────

export interface GestureEngineConfig {
  minConfidence: number;
  debounceFrames: number;
  holdThresholdMs: number;
  historySize: number;
}

export const DEFAULT_GESTURE_CONFIG: GestureEngineConfig = {
  minConfidence: 0.55,
  debounceFrames: 3,
  holdThresholdMs: 250,
  historySize: 50,
};
