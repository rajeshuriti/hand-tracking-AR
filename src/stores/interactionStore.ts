import { create } from 'zustand';
import { InteractionState } from '../engines/interactions/events/InteractionTypes';

interface InteractionStoreState {
  hoveredObjectId: string | null;
  selectedObjectId: string | null;
  objectCount: number;
  interactionState: InteractionState;
  cursorPosition: [number, number, number];

  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setObjectCount: (count: number) => void;
  setInteractionState: (state: InteractionState) => void;
  setCursorPosition: (pos: [number, number, number]) => void;
  reset: () => void;
}

const initialState = {
  hoveredObjectId: null as string | null,
  selectedObjectId: null as string | null,
  objectCount: 0,
  interactionState: InteractionState.IDLE as InteractionState,
  cursorPosition: [0, 0, 0] as [number, number, number],
};

export const useInteractionStore = create<InteractionStoreState>()((set) => ({
  ...initialState,

  setHovered: (id) => set({ hoveredObjectId: id }),
  setSelected: (id) => set({ selectedObjectId: id }),
  setObjectCount: (count) => set({ objectCount: count }),
  setInteractionState: (state) => set({ interactionState: state }),
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
  reset: () => set(initialState),
}));
