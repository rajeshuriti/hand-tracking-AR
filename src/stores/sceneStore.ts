import { create } from 'zustand';
import type { SceneObject, SceneConfig } from '../types/scene';
import { DEFAULT_SCENE_CONFIG } from '../types/scene';

interface SceneState {
  config: SceneConfig;
  objects: Map<string, SceneObject>;
  selectedObjectId: string | null;
  isReady: boolean;

  setConfig: (config: Partial<SceneConfig>) => void;
  addObject: (object: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  selectObject: (id: string | null) => void;
  setReady: (ready: boolean) => void;
  reset: () => void;
}

const initialState = {
  config: DEFAULT_SCENE_CONFIG,
  objects: new Map<string, SceneObject>(),
  selectedObjectId: null,
  isReady: false,
};

export const useSceneStore = create<SceneState>()((set) => ({
  ...initialState,

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),

  addObject: (object) =>
    set((s) => {
      const next = new Map(s.objects);
      next.set(object.id, object);
      return { objects: next };
    }),

  removeObject: (id) =>
    set((s) => {
      const next = new Map(s.objects);
      next.delete(id);
      return { objects: next, selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId };
    }),

  updateObject: (id, updates) =>
    set((s) => {
      const existing = s.objects.get(id);
      if (!existing) return s;
      const next = new Map(s.objects);
      next.set(id, { ...existing, ...updates });
      return { objects: next };
    }),

  selectObject: (id) => set({ selectedObjectId: id }),
  setReady: (ready) => set({ isReady: ready }),
  reset: () => set(initialState),
}));
