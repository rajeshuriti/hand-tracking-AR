import { create } from 'zustand';

interface InteractionStoreState {
  isGrabbed: boolean;
  cursorPosition: [number, number, number];

  setGrabbed: (grabbed: boolean) => void;
  setCursorPosition: (pos: [number, number, number]) => void;
  reset: () => void;
}

const initialState = {
  isGrabbed: false,
  cursorPosition: [0, 0, 0] as [number, number, number],
};

export const useInteractionStore = create<InteractionStoreState>()((set) => ({
  ...initialState,

  setGrabbed: (grabbed) => set({ isGrabbed: grabbed }),
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
  reset: () => set(initialState),
}));
