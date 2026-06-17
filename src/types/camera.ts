export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  frameRate: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  width: 1280,
  height: 720,
  facingMode: 'user',
  frameRate: 30,
};

export const CameraStatus = {
  IDLE: 'IDLE',
  REQUESTING: 'REQUESTING',
  ACTIVE: 'ACTIVE',
  ERROR: 'ERROR',
  STOPPED: 'STOPPED',
} as const;

export type CameraStatus = (typeof CameraStatus)[keyof typeof CameraStatus];
