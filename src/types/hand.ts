export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandData {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  handedness: Handedness;
  confidence: number;
  presenceConfidence: number;
  timestamp: number;
}

export type Handedness = 'Left' | 'Right';

export const HandLandmark = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export type HandLandmark = (typeof HandLandmark)[keyof typeof HandLandmark];

export const LANDMARK_NAMES: Record<HandLandmark, string> = {
  [HandLandmark.WRIST]: 'Wrist',
  [HandLandmark.THUMB_CMC]: 'Thumb CMC',
  [HandLandmark.THUMB_MCP]: 'Thumb MCP',
  [HandLandmark.THUMB_IP]: 'Thumb IP',
  [HandLandmark.THUMB_TIP]: 'Thumb Tip',
  [HandLandmark.INDEX_FINGER_MCP]: 'Index MCP',
  [HandLandmark.INDEX_FINGER_PIP]: 'Index PIP',
  [HandLandmark.INDEX_FINGER_DIP]: 'Index DIP',
  [HandLandmark.INDEX_FINGER_TIP]: 'Index Tip',
  [HandLandmark.MIDDLE_FINGER_MCP]: 'Middle MCP',
  [HandLandmark.MIDDLE_FINGER_PIP]: 'Middle PIP',
  [HandLandmark.MIDDLE_FINGER_DIP]: 'Middle DIP',
  [HandLandmark.MIDDLE_FINGER_TIP]: 'Middle Tip',
  [HandLandmark.RING_FINGER_MCP]: 'Ring MCP',
  [HandLandmark.RING_FINGER_PIP]: 'Ring PIP',
  [HandLandmark.RING_FINGER_DIP]: 'Ring DIP',
  [HandLandmark.RING_FINGER_TIP]: 'Ring Tip',
  [HandLandmark.PINKY_MCP]: 'Pinky MCP',
  [HandLandmark.PINKY_PIP]: 'Pinky PIP',
  [HandLandmark.PINKY_DIP]: 'Pinky DIP',
  [HandLandmark.PINKY_TIP]: 'Pinky Tip',
};

export const FINGERTIP_LANDMARKS: HandLandmark[] = [
  HandLandmark.THUMB_TIP,
  HandLandmark.INDEX_FINGER_TIP,
  HandLandmark.MIDDLE_FINGER_TIP,
  HandLandmark.RING_FINGER_TIP,
  HandLandmark.PINKY_TIP,
];

export const LANDMARK_COUNT = 21;

export interface HandTrackingResult {
  hands: HandData[];
  timestamp: number;
  processingTimeMs: number;
}
