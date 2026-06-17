import type { HandData, Handedness } from '../../types/hand';
import type {
  GestureResult,
  GestureEngineConfig,
  GestureHistoryEntry,
} from '../../types/gestures';
import { GestureType, GestureState, DEFAULT_GESTURE_CONFIG } from '../../types/gestures';
import { eventBus } from '../../services/EventBus';
import { classifyGesture } from './recognizers';

// ── Per-hand state machine ──────────────────────────────────────────

interface HandTracker {
  currentType: GestureType;
  state: GestureState;
  confidence: number;
  peakConfidence: number;
  metrics: Record<string, number>;
  startTime: number;
  lastUpdateTime: number;
  // Debounce: candidate must win N consecutive frames to promote
  candidateType: GestureType;
  candidateFrames: number;
  candidateConfidence: number;
  candidateMetrics: Record<string, number>;
}

function createTracker(): HandTracker {
  return {
    currentType: GestureType.NONE,
    state: GestureState.IDLE,
    confidence: 0,
    peakConfidence: 0,
    metrics: {},
    startTime: 0,
    lastUpdateTime: 0,
    candidateType: GestureType.NONE,
    candidateFrames: 0,
    candidateConfidence: 0,
    candidateMetrics: {},
  };
}

// ── Ring buffer for gesture history ─────────────────────────────────

class HistoryRing {
  private buffer: GestureHistoryEntry[];
  private capacity: number;
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<GestureHistoryEntry>(capacity);
  }

  push(entry: GestureHistoryEntry): void {
    this.buffer[this.head] = entry;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  toArray(): GestureHistoryEntry[] {
    if (this.count === 0) return [];
    const result: GestureHistoryEntry[] = [];
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[(start + i) % this.capacity]);
    }
    return result;
  }

  recent(n: number): GestureHistoryEntry[] {
    const all = this.toArray();
    return all.slice(-n);
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
  }
}

// ── GestureEngine ───────────────────────────────────────────────────

export class GestureEngine {
  private config: GestureEngineConfig;
  private trackers = new Map<Handedness, HandTracker>();
  private history: HistoryRing;

  constructor(config: Partial<GestureEngineConfig> = {}) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
    this.history = new HistoryRing(this.config.historySize);
  }

  processHands(hands: HandData[]): GestureResult[] {
    const activeHandedness = new Set<Handedness>(hands.map((h) => h.handedness));
    const results: GestureResult[] = [];

    for (const hand of hands) {
      const result = this.processHand(hand);
      if (result) results.push(result);
    }

    // Emit END for hands that disappeared while mid-gesture
    for (const [handedness, tracker] of this.trackers) {
      if (!activeHandedness.has(handedness) && tracker.currentType !== GestureType.NONE) {
        this.endGesture(tracker, handedness);
      }
    }

    return results;
  }

  getHistory(): GestureHistoryEntry[] {
    return this.history.toArray();
  }

  getRecentHistory(n: number): GestureHistoryEntry[] {
    return this.history.recent(n);
  }

  getActiveGesture(handedness: Handedness): GestureResult | null {
    const tracker = this.trackers.get(handedness);
    if (!tracker || tracker.currentType === GestureType.NONE) return null;
    return this.buildResult(tracker, handedness);
  }

  reset(): void {
    for (const [handedness, tracker] of this.trackers) {
      if (tracker.currentType !== GestureType.NONE) {
        this.endGesture(tracker, handedness);
      }
    }
    this.trackers.clear();
    this.history.clear();
  }

  // ── Internals ───────────────────────────────────────────────────

  private processHand(hand: HandData): GestureResult | null {
    const classification = classifyGesture(hand.landmarks);
    const tracker = this.getOrCreateTracker(hand.handedness);
    const now = hand.timestamp;

    const classifiedType = classification.confidence >= this.config.minConfidence
      ? classification.type
      : GestureType.NONE;

    // ── Debounce: accumulate consecutive frames ──

    if (classifiedType === tracker.candidateType) {
      tracker.candidateFrames++;
      tracker.candidateConfidence = Math.max(tracker.candidateConfidence, classification.confidence);
      tracker.candidateMetrics = classification.metrics;
    } else {
      tracker.candidateType = classifiedType;
      tracker.candidateFrames = 1;
      tracker.candidateConfidence = classification.confidence;
      tracker.candidateMetrics = classification.metrics;
    }

    const promoted = tracker.candidateFrames >= this.config.debounceFrames;

    // ── State transitions ──

    if (promoted && tracker.candidateType !== tracker.currentType) {
      return this.transitionTo(tracker, hand.handedness, tracker.candidateType, tracker.candidateConfidence, tracker.candidateMetrics, now);
    }

    // ── Ongoing gesture: update confidence and check START → HOLD ──

    if (tracker.currentType !== GestureType.NONE) {
      tracker.confidence = classification.type === tracker.currentType
        ? classification.confidence
        : tracker.confidence * 0.9;
      tracker.peakConfidence = Math.max(tracker.peakConfidence, tracker.confidence);
      tracker.metrics = classification.type === tracker.currentType
        ? classification.metrics
        : tracker.metrics;
      tracker.lastUpdateTime = now;

      if (tracker.state === GestureState.START && now - tracker.startTime >= this.config.holdThresholdMs) {
        tracker.state = GestureState.HOLD;
        const result = this.buildResult(tracker, hand.handedness);
        eventBus.emit('gesture:hold', result);
        return result;
      }

      return this.buildResult(tracker, hand.handedness);
    }

    return null;
  }

  private transitionTo(
    tracker: HandTracker,
    handedness: Handedness,
    newType: GestureType,
    confidence: number,
    metrics: Record<string, number>,
    now: number,
  ): GestureResult | null {
    let previous: GestureResult | null = null;

    // End the current gesture if one is active
    if (tracker.currentType !== GestureType.NONE) {
      previous = this.buildResult(tracker, handedness);
      this.endGesture(tracker, handedness);
    }

    // Start the new gesture (or go idle)
    if (newType === GestureType.NONE) {
      tracker.currentType = GestureType.NONE;
      tracker.state = GestureState.IDLE;
      tracker.confidence = 0;
      tracker.peakConfidence = 0;
      tracker.metrics = {};
      return null;
    }

    tracker.currentType = newType;
    tracker.state = GestureState.START;
    tracker.confidence = confidence;
    tracker.peakConfidence = confidence;
    tracker.metrics = metrics;
    tracker.startTime = now;
    tracker.lastUpdateTime = now;

    const result = this.buildResult(tracker, handedness);
    eventBus.emit('gesture:start', result);

    if (previous) {
      eventBus.emit('gesture:changed', { previous, current: result, timestamp: now });
    }

    return result;
  }

  private endGesture(tracker: HandTracker, handedness: Handedness): void {
    if (tracker.currentType === GestureType.NONE) return;

    const endResult = this.buildResult(tracker, handedness);
    endResult.state = GestureState.END;

    this.history.push({
      type: tracker.currentType,
      handedness,
      startTime: tracker.startTime,
      endTime: tracker.lastUpdateTime,
      peakConfidence: tracker.peakConfidence,
    });

    eventBus.emit('gesture:end', endResult);

    tracker.currentType = GestureType.NONE;
    tracker.state = GestureState.IDLE;
    tracker.confidence = 0;
    tracker.peakConfidence = 0;
    tracker.metrics = {};
  }

  private buildResult(tracker: HandTracker, handedness: Handedness): GestureResult {
    return {
      type: tracker.currentType,
      state: tracker.state,
      confidence: tracker.confidence,
      handedness,
      timestamp: tracker.lastUpdateTime,
      durationMs: tracker.lastUpdateTime - tracker.startTime,
      metrics: tracker.metrics,
    };
  }

  private getOrCreateTracker(handedness: Handedness): HandTracker {
    let tracker = this.trackers.get(handedness);
    if (!tracker) {
      tracker = createTracker();
      this.trackers.set(handedness, tracker);
    }
    return tracker;
  }
}
