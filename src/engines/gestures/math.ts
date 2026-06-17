import type { Landmark } from '../../types/hand';
import { HandLandmark } from '../../types/hand';

export function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y, abz = a.z - b.z;
  const cbx = c.x - b.x, cby = c.y - b.y, cbz = c.z - b.z;
  const dot = abx * cbx + aby * cby + abz * cbz;
  const magAB = Math.sqrt(abx * abx + aby * aby + abz * abz);
  const magCB = Math.sqrt(cbx * cbx + cby * cby + cbz * cbz);
  if (magAB === 0 || magCB === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magAB * magCB))));
}

const DEG = 180 / Math.PI;

export function fingerCurl(landmarks: Landmark[], mcp: number, pip: number, dip: number, tip: number): number {
  const angle1 = angleBetween(landmarks[mcp], landmarks[pip], landmarks[dip]) * DEG;
  const angle2 = angleBetween(landmarks[pip], landmarks[dip], landmarks[tip]) * DEG;
  const avgAngle = (angle1 + angle2) / 2;
  return Math.min(1, Math.max(0, (180 - avgAngle) / 120));
}

export function fingerExtension(landmarks: Landmark[], mcp: number, pip: number, tip: number): number {
  const tipToMcp = distance(landmarks[tip], landmarks[mcp]);
  const pipToMcp = distance(landmarks[pip], landmarks[mcp]);
  if (pipToMcp === 0) return 0;
  const ratio = tipToMcp / pipToMcp;
  return Math.min(1, Math.max(0, (ratio - 0.8) / 1.2));
}

export interface FingerState {
  curl: number;
  extension: number;
}

export function analyzeFingers(landmarks: Landmark[]): {
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  thumbCurl: number;
} {
  return {
    index: {
      curl: fingerCurl(landmarks, HandLandmark.INDEX_FINGER_MCP, HandLandmark.INDEX_FINGER_PIP, HandLandmark.INDEX_FINGER_DIP, HandLandmark.INDEX_FINGER_TIP),
      extension: fingerExtension(landmarks, HandLandmark.INDEX_FINGER_MCP, HandLandmark.INDEX_FINGER_PIP, HandLandmark.INDEX_FINGER_TIP),
    },
    middle: {
      curl: fingerCurl(landmarks, HandLandmark.MIDDLE_FINGER_MCP, HandLandmark.MIDDLE_FINGER_PIP, HandLandmark.MIDDLE_FINGER_DIP, HandLandmark.MIDDLE_FINGER_TIP),
      extension: fingerExtension(landmarks, HandLandmark.MIDDLE_FINGER_MCP, HandLandmark.MIDDLE_FINGER_PIP, HandLandmark.MIDDLE_FINGER_TIP),
    },
    ring: {
      curl: fingerCurl(landmarks, HandLandmark.RING_FINGER_MCP, HandLandmark.RING_FINGER_PIP, HandLandmark.RING_FINGER_DIP, HandLandmark.RING_FINGER_TIP),
      extension: fingerExtension(landmarks, HandLandmark.RING_FINGER_MCP, HandLandmark.RING_FINGER_PIP, HandLandmark.RING_FINGER_TIP),
    },
    pinky: {
      curl: fingerCurl(landmarks, HandLandmark.PINKY_MCP, HandLandmark.PINKY_PIP, HandLandmark.PINKY_DIP, HandLandmark.PINKY_TIP),
      extension: fingerExtension(landmarks, HandLandmark.PINKY_MCP, HandLandmark.PINKY_PIP, HandLandmark.PINKY_TIP),
    },
    thumbCurl: fingerCurl(landmarks, HandLandmark.THUMB_CMC, HandLandmark.THUMB_MCP, HandLandmark.THUMB_IP, HandLandmark.THUMB_TIP),
  };
}
