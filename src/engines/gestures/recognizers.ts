import type { Landmark } from '../../types/hand';
import { HandLandmark } from '../../types/hand';
import type { IGesture, GestureClassification } from '../../types/gestures';
import { GestureType } from '../../types/gestures';
import { distance, analyzeFingers } from './math';

// ── Pinch ───────────────────────────────────────────────────────────

class PinchGesture implements IGesture {
  readonly type = GestureType.PINCH;
  readonly displayName = 'Pinch';

  recognize(landmarks: Landmark[]): GestureClassification {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const pinchDist = distance(thumbTip, indexTip);

    const indexMcp = landmarks[HandLandmark.INDEX_FINGER_MCP];
    const palmScale = distance(landmarks[HandLandmark.WRIST], indexMcp);
    if (palmScale === 0) return this.none();

    const normalizedDist = pinchDist / palmScale;
    const pinchScore = Math.max(0, 1 - normalizedDist / 0.35);

    const otherFingers = analyzeFingers(landmarks);
    const othersCurled = (otherFingers.middle.curl + otherFingers.ring.curl + otherFingers.pinky.curl) / 3;

    const confidence = pinchScore * 0.7 + othersCurled * 0.3;

    return {
      type: this.type,
      confidence: Math.min(1, confidence),
      metrics: { pinchDist: normalizedDist, pinchScore, othersCurled },
    };
  }

  private none(): GestureClassification {
    return { type: this.type, confidence: 0, metrics: {} };
  }
}

// ── Open Palm ───────────────────────────────────────────────────────

class OpenPalmGesture implements IGesture {
  readonly type = GestureType.OPEN_PALM;
  readonly displayName = 'Open Palm';

  recognize(landmarks: Landmark[]): GestureClassification {
    const fingers = analyzeFingers(landmarks);
    const extensions = [
      fingers.index.extension,
      fingers.middle.extension,
      fingers.ring.extension,
      fingers.pinky.extension,
    ];
    const avgExtension = extensions.reduce((a, b) => a + b, 0) / extensions.length;
    const minExtension = Math.min(...extensions);

    const thumbExtended = 1 - fingers.thumbCurl;

    const spreadScore = this.measureSpread(landmarks);

    const confidence = avgExtension * 0.4 + minExtension * 0.25 + thumbExtended * 0.15 + spreadScore * 0.2;

    return {
      type: this.type,
      confidence: Math.min(1, confidence),
      metrics: { avgExtension, minExtension, thumbExtended, spreadScore },
    };
  }

  private measureSpread(landmarks: Landmark[]): number {
    const tips = [
      HandLandmark.INDEX_FINGER_TIP,
      HandLandmark.MIDDLE_FINGER_TIP,
      HandLandmark.RING_FINGER_TIP,
      HandLandmark.PINKY_TIP,
    ];
    let totalDist = 0;
    for (let i = 0; i < tips.length - 1; i++) {
      totalDist += distance(landmarks[tips[i]], landmarks[tips[i + 1]]);
    }
    const palmScale = distance(landmarks[HandLandmark.WRIST], landmarks[HandLandmark.MIDDLE_FINGER_MCP]);
    if (palmScale === 0) return 0;
    const normalizedSpread = totalDist / (palmScale * 3);
    return Math.min(1, Math.max(0, normalizedSpread));
  }
}

// ── Fist ────────────────────────────────────────────────────────────

class FistGesture implements IGesture {
  readonly type = GestureType.FIST;
  readonly displayName = 'Fist';

  recognize(landmarks: Landmark[]): GestureClassification {
    const fingers = analyzeFingers(landmarks);
    const curls = [
      fingers.index.curl,
      fingers.middle.curl,
      fingers.ring.curl,
      fingers.pinky.curl,
    ];
    const avgCurl = curls.reduce((a, b) => a + b, 0) / curls.length;
    const minCurl = Math.min(...curls);

    const thumbCurl = fingers.thumbCurl;

    const tightness = this.measureTightness(landmarks);

    const confidence = avgCurl * 0.35 + minCurl * 0.25 + thumbCurl * 0.15 + tightness * 0.25;

    return {
      type: this.type,
      confidence: Math.min(1, confidence),
      metrics: { avgCurl, minCurl, thumbCurl, tightness },
    };
  }

  private measureTightness(landmarks: Landmark[]): number {
    const tips = [
      HandLandmark.INDEX_FINGER_TIP,
      HandLandmark.MIDDLE_FINGER_TIP,
      HandLandmark.RING_FINGER_TIP,
      HandLandmark.PINKY_TIP,
    ];
    const wrist = landmarks[HandLandmark.WRIST];
    const palmScale = distance(wrist, landmarks[HandLandmark.MIDDLE_FINGER_MCP]);
    if (palmScale === 0) return 0;
    let totalDist = 0;
    for (const tip of tips) {
      totalDist += distance(landmarks[tip], wrist);
    }
    const avgDist = totalDist / tips.length;
    return Math.max(0, 1 - (avgDist / palmScale - 0.8) / 0.8);
  }
}

// ── Point ───────────────────────────────────────────────────────────

class PointGesture implements IGesture {
  readonly type = GestureType.POINT;
  readonly displayName = 'Point';

  recognize(landmarks: Landmark[]): GestureClassification {
    const fingers = analyzeFingers(landmarks);

    const indexExtension = fingers.index.extension;
    const othersCurled = (fingers.middle.curl + fingers.ring.curl + fingers.pinky.curl) / 3;
    const thumbCurl = fingers.thumbCurl;

    const separation = this.indexSeparation(landmarks);

    const confidence =
      indexExtension * 0.35 +
      othersCurled * 0.3 +
      thumbCurl * 0.1 +
      separation * 0.25;

    return {
      type: this.type,
      confidence: Math.min(1, confidence),
      metrics: { indexExtension, othersCurled, thumbCurl, separation },
    };
  }

  private indexSeparation(landmarks: Landmark[]): number {
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const palmScale = distance(landmarks[HandLandmark.WRIST], landmarks[HandLandmark.MIDDLE_FINGER_MCP]);
    if (palmScale === 0) return 0;
    const sep = distance(indexTip, middleTip) / palmScale;
    return Math.min(1, Math.max(0, sep / 0.5));
  }
}

// ── Victory ─────────────────────────────────────────────────────────

class VictoryGesture implements IGesture {
  readonly type = GestureType.VICTORY;
  readonly displayName = 'Victory';

  recognize(landmarks: Landmark[]): GestureClassification {
    const fingers = analyzeFingers(landmarks);

    const indexExtension = fingers.index.extension;
    const middleExtension = fingers.middle.extension;
    const bothExtended = (indexExtension + middleExtension) / 2;

    const othersCurled = (fingers.ring.curl + fingers.pinky.curl) / 2;

    const vSpread = this.measureVSpread(landmarks);

    const confidence =
      bothExtended * 0.35 +
      othersCurled * 0.3 +
      vSpread * 0.2 +
      Math.min(indexExtension, middleExtension) * 0.15;

    return {
      type: this.type,
      confidence: Math.min(1, confidence),
      metrics: { indexExtension, middleExtension, othersCurled, vSpread },
    };
  }

  private measureVSpread(landmarks: Landmark[]): number {
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const palmScale = distance(landmarks[HandLandmark.WRIST], landmarks[HandLandmark.MIDDLE_FINGER_MCP]);
    if (palmScale === 0) return 0;
    const spread = distance(indexTip, middleTip) / palmScale;
    return Math.min(1, Math.max(0, spread / 0.6));
  }
}

// ── Registry ────────────────────────────────────────────────────────

export const GESTURE_REGISTRY: readonly IGesture[] = [
  new PinchGesture(),
  new OpenPalmGesture(),
  new FistGesture(),
  new PointGesture(),
  new VictoryGesture(),
];

export function classifyGesture(landmarks: Landmark[]): GestureClassification {
  if (landmarks.length < 21) {
    return { type: GestureType.NONE, confidence: 0, metrics: {} };
  }

  let best: GestureClassification = { type: GestureType.NONE, confidence: 0, metrics: {} };

  for (const gesture of GESTURE_REGISTRY) {
    const result = gesture.recognize(landmarks);
    if (result.confidence > best.confidence) {
      best = result;
    }
  }

  return best;
}
