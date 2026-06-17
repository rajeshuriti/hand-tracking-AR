import { create } from 'zustand';

interface PhysicsStoreState {
  physicsEnabled: boolean;
  debugEnabled: boolean;
  activeBodies: number;
  grabbedObjectId: string | null;
  collisionCount: number;
  gravity: [number, number, number];
  grabbedVelocity: [number, number, number];

  setPhysicsEnabled: (enabled: boolean) => void;
  setDebugEnabled: (enabled: boolean) => void;
  setActiveBodies: (count: number) => void;
  setGrabbedObjectId: (id: string | null) => void;
  incrementCollisions: () => void;
  resetCollisions: () => void;
  setGravity: (g: [number, number, number]) => void;
  setGrabbedVelocity: (v: [number, number, number]) => void;
  reset: () => void;
}

const initialState = {
  physicsEnabled: true,
  debugEnabled: false,
  activeBodies: 0,
  grabbedObjectId: null as string | null,
  collisionCount: 0,
  gravity: [0, -9.81, 0] as [number, number, number],
  grabbedVelocity: [0, 0, 0] as [number, number, number],
};

export const usePhysicsStore = create<PhysicsStoreState>()((set) => ({
  ...initialState,

  setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
  setDebugEnabled: (enabled) => set({ debugEnabled: enabled }),
  setActiveBodies: (count) => set({ activeBodies: count }),
  setGrabbedObjectId: (id) => set({ grabbedObjectId: id }),
  incrementCollisions: () => set((s) => ({ collisionCount: s.collisionCount + 1 })),
  resetCollisions: () => set({ collisionCount: 0 }),
  setGravity: (g) => set({ gravity: g }),
  setGrabbedVelocity: (v) => set({ grabbedVelocity: v }),
  reset: () => set(initialState),
}));
