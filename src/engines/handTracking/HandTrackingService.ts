import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandData, HandTrackingResult, Landmark, Handedness } from '../../types/hand';
import { eventBus } from '../../services/EventBus';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface HandTrackingConfig {
  maxHands: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  minPresenceConfidence: number;
  delegate: 'GPU' | 'CPU';
}

const DEFAULT_CONFIG: HandTrackingConfig = {
  maxHands: 2,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  minPresenceConfidence: 0.5,
  delegate: 'GPU',
};

export class HandTrackingService {
  private landmarker: HandLandmarker | null = null;
  private config: HandTrackingConfig;
  private lastTimestamp = -1;
  private frameCount = 0;
  private fpsInterval: ReturnType<typeof setInterval> | null = null;
  private previousHandedness = new Set<Handedness>();
  private latestResult: HandTrackingResult | null = null;
  private _fps = 0;

  constructor(config: Partial<HandTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: this.config.delegate,
      },
      numHands: this.config.maxHands,
      minHandDetectionConfidence: this.config.minDetectionConfidence,
      minHandPresenceConfidence: this.config.minPresenceConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
      runningMode: 'VIDEO',
    });

    this.startFpsCounter();
    eventBus.emit('hand:tracking:started', undefined);
  }

  processFrame(video: HTMLVideoElement, timestamp: number): HandTrackingResult | null {
    if (!this.landmarker) return null;

    const roundedTimestamp = Math.round(timestamp);
    if (roundedTimestamp <= this.lastTimestamp) return null;
    this.lastTimestamp = roundedTimestamp;

    const start = performance.now();
    const raw = this.landmarker.detectForVideo(video, roundedTimestamp);
    const processingTimeMs = performance.now() - start;

    const hands: HandData[] = raw.landmarks.map((landmarks, i) => {
      const handedness = this.resolveHandedness(raw, i);
      const confidence = raw.handednesses[i]?.[0]?.score ?? 0;
      return {
        landmarks: landmarks as Landmark[],
        worldLandmarks: (raw.worldLandmarks[i] ?? []) as Landmark[],
        handedness,
        confidence,
        presenceConfidence: confidence,
        timestamp: roundedTimestamp,
      };
    });

    this.frameCount++;

    const result: HandTrackingResult = { hands, timestamp: roundedTimestamp, processingTimeMs };
    this.latestResult = result;

    this.detectTransitions(hands, roundedTimestamp);

    eventBus.emit('hand:landmarks', { hands, timestamp: roundedTimestamp });

    if (hands.length > 0) {
      eventBus.emit('hand:updated', result);
    }

    return result;
  }

  getLatestResult(): HandTrackingResult | null {
    return this.latestResult;
  }

  get fps(): number {
    return this._fps;
  }

  isReady(): boolean {
    return this.landmarker !== null;
  }

  destroy(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
    this.landmarker?.close();
    this.landmarker = null;
    this.lastTimestamp = -1;
    this.frameCount = 0;
    this._fps = 0;
    this.previousHandedness.clear();
    this.latestResult = null;
    eventBus.emit('hand:tracking:stopped', undefined);
  }

  private detectTransitions(currentHands: HandData[], timestamp: number): void {
    const currentSet = new Set<Handedness>(currentHands.map((h) => h.handedness));

    for (const handedness of currentSet) {
      if (!this.previousHandedness.has(handedness)) {
        const hand = currentHands.find((h) => h.handedness === handedness)!;
        eventBus.emit('hand:gained', { hand });
      }
    }

    for (const handedness of this.previousHandedness) {
      if (!currentSet.has(handedness)) {
        eventBus.emit('hand:lost', { handedness, timestamp });
      }
    }

    if (currentHands.length > 0 && this.previousHandedness.size === 0) {
      eventBus.emit('hand:detected', {
        hands: currentHands,
        timestamp,
        processingTimeMs: this.latestResult?.processingTimeMs ?? 0,
      });
    }

    this.previousHandedness = currentSet;
  }

  private resolveHandedness(
    result: ReturnType<HandLandmarker['detectForVideo']>,
    index: number,
  ): Handedness {
    const category = result.handednesses[index]?.[0]?.categoryName;
    return category === 'Left' ? 'Left' : 'Right';
  }

  private startFpsCounter(): void {
    this.fpsInterval = setInterval(() => {
      this._fps = this.frameCount;
      this.frameCount = 0;
    }, 1000);
  }
}
