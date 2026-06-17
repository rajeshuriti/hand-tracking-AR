import type { IInteractable } from '../interfaces/IInteractable';
import type { Handedness } from '../../../types/hand';
import { eventBus } from '../../../services/EventBus';

interface VelocitySample {
  position: [number, number, number];
  timestamp: number;
}

export interface GrabConfig {
  positionLerpSpeed: number;
  rotationLerpSpeed: number;
  velocityHistorySize: number;
  maxGrabDistance: number;
}

export const DEFAULT_GRAB_CONFIG: GrabConfig = {
  positionLerpSpeed: 0.25,
  rotationLerpSpeed: 0.15,
  velocityHistorySize: 8,
  maxGrabDistance: 0.8,
};

export interface GrabState {
  objectId: string;
  handedness: Handedness;
  grabOffsetPos: [number, number, number];
  grabOffsetRot: [number, number, number];
  startTime: number;
  startPosition: [number, number, number];
  currentPosition: [number, number, number];
  currentRotation: [number, number, number];
}

export interface GrabReleaseData {
  objectId: string;
  handedness: Handedness;
  velocity: [number, number, number];
  durationMs: number;
  finalPosition: [number, number, number];
  finalRotation: [number, number, number];
}

export class GrabManager {
  private activeGrab: GrabState | null = null;
  private config: GrabConfig;
  private velocityHistory: VelocitySample[] = [];
  private lastRelease: GrabReleaseData | null = null;

  constructor(config: Partial<GrabConfig> = {}) {
    this.config = { ...DEFAULT_GRAB_CONFIG, ...config };
  }

  grab(
    object: IInteractable,
    handPosition: [number, number, number],
    handRotation: [number, number, number],
    handedness: Handedness,
  ): void {
    if (this.activeGrab) {
      this.release(object);
    }

    const grabOffsetPos: [number, number, number] = [
      object.position[0] - handPosition[0],
      object.position[1] - handPosition[1],
      object.position[2] - handPosition[2],
    ];

    const grabOffsetRot: [number, number, number] = [
      object.rotation[0] - handRotation[0],
      object.rotation[1] - handRotation[1],
      object.rotation[2] - handRotation[2],
    ];

    this.activeGrab = {
      objectId: object.id,
      handedness,
      grabOffsetPos,
      grabOffsetRot,
      startTime: performance.now(),
      startPosition: [...object.position] as [number, number, number],
      currentPosition: [...object.position] as [number, number, number],
      currentRotation: [...object.rotation] as [number, number, number],
    };

    this.velocityHistory = [{ position: [...handPosition] as [number, number, number], timestamp: performance.now() }];

    object.onGrabStart?.(handedness);

    eventBus.emit('interaction:grab:started', {
      objectId: object.id,
      handedness,
      position: object.position,
      rotation: object.rotation,
    });
  }

  updateGrab(
    handPosition: [number, number, number],
    handRotation: [number, number, number],
    object: IInteractable,
  ): { position: [number, number, number]; rotation: [number, number, number] } | null {
    if (!this.activeGrab) return null;

    // handPosition is already smoothed by the controller — apply offset directly
    const targetX = handPosition[0] + this.activeGrab.grabOffsetPos[0];
    const targetY = handPosition[1] + this.activeGrab.grabOffsetPos[1];
    const targetZ = handPosition[2] + this.activeGrab.grabOffsetPos[2];

    const targetRotX = handRotation[0] + this.activeGrab.grabOffsetRot[0];
    const targetRotY = handRotation[1] + this.activeGrab.grabOffsetRot[1];
    const targetRotZ = handRotation[2] + this.activeGrab.grabOffsetRot[2];

    const lp = this.config.positionLerpSpeed;
    const lr = this.config.rotationLerpSpeed;

    const pos: [number, number, number] = [
      this.activeGrab.currentPosition[0] + (targetX - this.activeGrab.currentPosition[0]) * lp,
      this.activeGrab.currentPosition[1] + (targetY - this.activeGrab.currentPosition[1]) * lp,
      this.activeGrab.currentPosition[2] + (targetZ - this.activeGrab.currentPosition[2]) * lp,
    ];

    const rot: [number, number, number] = [
      this.activeGrab.currentRotation[0] + (targetRotX - this.activeGrab.currentRotation[0]) * lr,
      this.activeGrab.currentRotation[1] + (targetRotY - this.activeGrab.currentRotation[1]) * lr,
      this.activeGrab.currentRotation[2] + (targetRotZ - this.activeGrab.currentRotation[2]) * lr,
    ];

    this.activeGrab.currentPosition = pos;
    this.activeGrab.currentRotation = rot;

    this.recordVelocitySample(handPosition);

    object.onGrabUpdate?.(pos, rot);

    const velocity = this.computeVelocity();
    eventBus.emit('interaction:grab:updated', {
      objectId: this.activeGrab.objectId,
      handedness: this.activeGrab.handedness,
      position: pos,
      rotation: rot,
      velocity,
    });

    return { position: pos, rotation: rot };
  }

  release(object: IInteractable | null = null): GrabReleaseData | null {
    if (!this.activeGrab) return null;

    const velocity = this.computeVelocity();
    const now = performance.now();
    const durationMs = now - this.activeGrab.startTime;

    const data: GrabReleaseData = {
      objectId: this.activeGrab.objectId,
      handedness: this.activeGrab.handedness,
      velocity,
      durationMs,
      finalPosition: [...this.activeGrab.currentPosition] as [number, number, number],
      finalRotation: [...this.activeGrab.currentRotation] as [number, number, number],
    };

    object?.onGrabEnd?.();

    eventBus.emit('interaction:grab:ended', {
      objectId: data.objectId,
      handedness: data.handedness,
      finalPosition: data.finalPosition,
      finalRotation: data.finalRotation,
      velocity: data.velocity,
      durationMs: data.durationMs,
    });

    this.lastRelease = data;
    this.activeGrab = null;
    this.velocityHistory = [];

    return data;
  }

  transferToHand(
    newHandedness: Handedness,
    newHandPosition: [number, number, number],
    newHandRotation: [number, number, number],
    object: IInteractable,
  ): boolean {
    if (!this.activeGrab) return false;

    const fromHand = this.activeGrab.handedness;
    if (fromHand === newHandedness) return false;

    this.activeGrab.grabOffsetPos = [
      this.activeGrab.currentPosition[0] - newHandPosition[0],
      this.activeGrab.currentPosition[1] - newHandPosition[1],
      this.activeGrab.currentPosition[2] - newHandPosition[2],
    ];

    this.activeGrab.grabOffsetRot = [
      this.activeGrab.currentRotation[0] - newHandRotation[0],
      this.activeGrab.currentRotation[1] - newHandRotation[1],
      this.activeGrab.currentRotation[2] - newHandRotation[2],
    ];

    this.activeGrab.handedness = newHandedness;
    this.velocityHistory = [{ position: [...newHandPosition] as [number, number, number], timestamp: performance.now() }];

    eventBus.emit('interaction:grab:transferred', {
      objectId: this.activeGrab.objectId,
      fromHand,
      toHand: newHandedness,
      position: this.activeGrab.currentPosition,
    });

    object.onGrabEnd?.();
    object.onGrabStart?.(newHandedness);

    return true;
  }

  isGrabbing(): boolean {
    return this.activeGrab !== null;
  }

  getGrabbedObjectId(): string | null {
    return this.activeGrab?.objectId ?? null;
  }

  getActiveGrab(): Readonly<GrabState> | null {
    return this.activeGrab;
  }

  getHandedness(): Handedness | null {
    return this.activeGrab?.handedness ?? null;
  }

  getVelocity(): [number, number, number] {
    return this.computeVelocity();
  }

  getLastRelease(): GrabReleaseData | null {
    return this.lastRelease;
  }

  consumeLastRelease(): GrabReleaseData | null {
    const data = this.lastRelease;
    this.lastRelease = null;
    return data;
  }

  reset(): void {
    this.activeGrab = null;
    this.velocityHistory = [];
    this.lastRelease = null;
  }

  private recordVelocitySample(position: [number, number, number]): void {
    this.velocityHistory.push({
      position: [...position] as [number, number, number],
      timestamp: performance.now(),
    });
    if (this.velocityHistory.length > this.config.velocityHistorySize) {
      this.velocityHistory.shift();
    }
  }

  private computeVelocity(): [number, number, number] {
    if (this.velocityHistory.length < 2) return [0, 0, 0];

    let vx = 0;
    let vy = 0;
    let vz = 0;
    let totalWeight = 0;

    for (let i = 1; i < this.velocityHistory.length; i++) {
      const dt = (this.velocityHistory[i].timestamp - this.velocityHistory[i - 1].timestamp) / 1000;
      if (dt <= 0) continue;

      const weight = i / this.velocityHistory.length;
      vx += ((this.velocityHistory[i].position[0] - this.velocityHistory[i - 1].position[0]) / dt) * weight;
      vy += ((this.velocityHistory[i].position[1] - this.velocityHistory[i - 1].position[1]) / dt) * weight;
      vz += ((this.velocityHistory[i].position[2] - this.velocityHistory[i - 1].position[2]) / dt) * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return [0, 0, 0];
    return [vx / totalWeight, vy / totalWeight, vz / totalWeight];
  }
}
