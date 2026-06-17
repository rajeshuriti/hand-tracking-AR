import { create } from 'zustand';
import type { HandData, Landmark, Handedness } from '../types/hand';

interface HandTrackingState {
  hands: HandData[];
  isTracking: boolean;
  fps: number;
  processingTimeMs: number;

  setHands: (hands: HandData[]) => void;
  setTracking: (tracking: boolean) => void;
  setFps: (fps: number) => void;
  setProcessingTime: (ms: number) => void;
  reset: () => void;
}

const initialState = {
  hands: [] as HandData[],
  isTracking: false,
  fps: 0,
  processingTimeMs: 0,
};

export const useHandTrackingStore = create<HandTrackingState>()((set) => ({
  ...initialState,

  setHands: (hands) => set({ hands }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  setFps: (fps) => set({ fps }),
  setProcessingTime: (ms) => set({ processingTimeMs: ms }),
  reset: () => set(initialState),
}));

export function getHand(handedness: Handedness): HandData | undefined {
  return useHandTrackingStore.getState().hands.find((h) => h.handedness === handedness);
}

export function getLandmark(handedness: Handedness, index: number): Landmark | undefined {
  const hand = getHand(handedness);
  return hand?.landmarks[index];
}
