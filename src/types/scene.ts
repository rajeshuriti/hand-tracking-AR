import type * as THREE from 'three';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  scale: THREE.Vector3Tuple;
  color: string;
  interactive: boolean;
  metadata?: Record<string, unknown>;
}

export type SceneObjectType = 'box' | 'sphere' | 'cylinder' | 'plane' | 'custom';

export interface SceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  showGrid: boolean;
  showAxes: boolean;
  cameraPosition: THREE.Vector3Tuple;
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: '#0a0a0f',
  ambientLightIntensity: 0.4,
  showGrid: true,
  showAxes: false,
  cameraPosition: [0, 2, 5],
};
