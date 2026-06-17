import { create } from 'zustand';
import { CameraStatus } from '../types/camera';

interface AppState {
  initialized: boolean;
  cameraStatus: CameraStatus;
  debugMode: boolean;
  error: string | null;

  setInitialized: (value: boolean) => void;
  setCameraStatus: (status: CameraStatus) => void;
  toggleDebugMode: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  initialized: false,
  cameraStatus: CameraStatus.IDLE,
  debugMode: import.meta.env.DEV,
  error: null,
};

export const useAppStore = create<AppState>()((set) => ({
  ...initialState,

  setInitialized: (value) => set({ initialized: value }),
  setCameraStatus: (status) => set({ cameraStatus: status }),
  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
