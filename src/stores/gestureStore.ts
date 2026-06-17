import { create } from 'zustand';
import type { GestureResult, GestureHistoryEntry } from '../types/gestures';
import { GestureType, GestureState } from '../types/gestures';
import type { Handedness } from '../types/hand';

interface GestureStoreState {
  leftGesture: GestureResult;
  rightGesture: GestureResult;
  history: GestureHistoryEntry[];

  setGesture: (result: GestureResult) => void;
  clearGesture: (handedness: Handedness) => void;
  setHistory: (entries: GestureHistoryEntry[]) => void;
  reset: () => void;
}

const noGesture = (handedness: Handedness): GestureResult => ({
  type: GestureType.NONE,
  state: GestureState.IDLE,
  confidence: 0,
  handedness,
  timestamp: 0,
  durationMs: 0,
  metrics: {},
});

const initialState = {
  leftGesture: noGesture('Left'),
  rightGesture: noGesture('Right'),
  history: [] as GestureHistoryEntry[],
};

export const useGestureStore = create<GestureStoreState>()((set) => ({
  ...initialState,

  setGesture: (result) =>
    set(result.handedness === 'Left' ? { leftGesture: result } : { rightGesture: result }),

  clearGesture: (handedness) =>
    set(handedness === 'Left' ? { leftGesture: noGesture('Left') } : { rightGesture: noGesture('Right') }),

  setHistory: (entries) => set({ history: entries }),

  reset: () => set(initialState),
}));
