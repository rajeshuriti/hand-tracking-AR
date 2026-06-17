import { ObjectManager } from '../managers/ObjectManager';
import { SelectionManager } from '../managers/SelectionManager';
import { GrabManager } from '../managers/GrabManager';
import type { GrabConfig } from '../managers/GrabManager';
import {
  InteractionState,
  DEFAULT_INTERACTION_CONFIG,
} from '../events/InteractionTypes';
import type { InteractionConfig, InteractionCursor } from '../events/InteractionTypes';
import type { GestureResult } from '../../../types/gestures';
import { GestureType, GestureState } from '../../../types/gestures';
import { HandLandmark } from '../../../types/hand';
import type { HandData, Landmark } from '../../../types/hand';
import { computeHandRotation } from '../../gestures/math';
import { eventBus } from '../../../services/EventBus';

export class HandInteractionController {
  private objectManager: ObjectManager;
  private selectionManager: SelectionManager;
  private grabManager: GrabManager;
  private config: InteractionConfig;
  private state: InteractionState = InteractionState.IDLE;
  private smoothedCursor: [number, number, number] = [0, 0, 0];
  private lastHandRotation: [number, number, number] = [0, 0, 0];

  constructor(
    objectManager: ObjectManager,
    selectionManager: SelectionManager,
    config: Partial<InteractionConfig> = {},
    grabConfig: Partial<GrabConfig> = {},
  ) {
    this.objectManager = objectManager;
    this.selectionManager = selectionManager;
    this.config = { ...DEFAULT_INTERACTION_CONFIG, ...config };
    this.grabManager = new GrabManager({
      maxGrabDistance: this.config.maxInteractionDistance,
      ...grabConfig,
    });
  }

  processGesture(gesture: GestureResult, hand: HandData | undefined): void {
    if (!hand) return;

    const cursor = this.getCursorPosition(hand);
    if (!cursor) return;

    this.smoothCursor(cursor);
    this.lastHandRotation = computeHandRotation(hand.landmarks);

    if (gesture.type === GestureType.PINCH) {
      this.handlePinch(gesture, cursor);
    } else {
      this.handleNonPinch(cursor);
    }
  }

  processSecondHand(gesture: GestureResult, hand: HandData | undefined): void {
    if (!hand || !this.grabManager.isGrabbing()) return;
    if (gesture.type !== GestureType.PINCH) return;
    if (this.grabManager.getHandedness() === hand.handedness) return;

    if (gesture.state === GestureState.START) {
      const cursor = this.getCursorPosition(hand);
      if (!cursor) return;

      const grabbedId = this.grabManager.getGrabbedObjectId();
      if (!grabbedId) return;

      const obj = this.objectManager.getById(grabbedId);
      if (!obj) return;

      const handRot = computeHandRotation(hand.landmarks);
      this.grabManager.transferToHand(
        hand.handedness,
        [cursor.x, cursor.y, cursor.z],
        handRot,
        obj,
      );
    }
  }

  private handlePinch(gesture: GestureResult, cursor: InteractionCursor): void {
    if (gesture.state === GestureState.START && this.state !== InteractionState.GRABBING) {
      this.onPinchStart(cursor);
    }
    if (
      (gesture.state === GestureState.START || gesture.state === GestureState.HOLD) &&
      this.state === InteractionState.GRABBING
    ) {
      this.onPinchHold();
    }
    if (gesture.state === GestureState.END) {
      this.onPinchEnd();
    }
  }

  private handleNonPinch(cursor: InteractionCursor): void {
    if (this.state === InteractionState.GRABBING) {
      this.onPinchEnd();
    } else if (this.state === InteractionState.SELECTING) {
      this.selectionManager.releaseObject();
      this.state = InteractionState.IDLE;
    }

    this.updateHover(cursor);
  }

  private onPinchStart(cursor: InteractionCursor): void {
    const nearest = this.objectManager.getNearest(
      this.smoothedCursor[0],
      this.smoothedCursor[1],
      this.smoothedCursor[2],
      this.config.maxInteractionDistance,
    );

    if (nearest) {
      this.selectionManager.selectObject(nearest, cursor.handedness);
      this.grabManager.grab(
        nearest,
        this.smoothedCursor,
        this.lastHandRotation,
        cursor.handedness,
      );
      this.state = InteractionState.GRABBING;
    } else {
      this.state = InteractionState.SELECTING;
    }
  }

  private onPinchHold(): void {
    if (this.state !== InteractionState.GRABBING || !this.grabManager.isGrabbing()) return;

    const grabbedId = this.grabManager.getGrabbedObjectId();
    if (!grabbedId) {
      this.state = InteractionState.IDLE;
      return;
    }

    const obj = this.objectManager.getById(grabbedId);
    if (!obj) {
      this.grabManager.release(null);
      this.state = InteractionState.IDLE;
      return;
    }

    const result = this.grabManager.updateGrab(
      this.smoothedCursor,
      this.lastHandRotation,
      obj,
    );

    if (result) {
      obj.move(result.position);
      obj.rotate(result.rotation);

      eventBus.emit('interaction:object:moved', {
        objectId: obj.id,
        transform: {
          position: result.position,
          rotation: result.rotation,
          scale: obj.scale,
        },
      });
    }
  }

  private onPinchEnd(): void {
    if (this.state === InteractionState.GRABBING && this.grabManager.isGrabbing()) {
      const grabbedId = this.grabManager.getGrabbedObjectId();
      const obj = grabbedId ? this.objectManager.getById(grabbedId) : null;
      this.grabManager.release(obj ?? null);
      this.selectionManager.releaseObject();
    }
    this.state = InteractionState.IDLE;
  }

  private updateHover(cursor: InteractionCursor): void {
    const nearest = this.objectManager.getNearest(
      this.smoothedCursor[0],
      this.smoothedCursor[1],
      this.smoothedCursor[2],
      this.config.maxInteractionDistance,
    );

    if (nearest) {
      this.selectionManager.hoverObject(nearest, cursor.handedness);
      if (this.state === InteractionState.IDLE) {
        this.state = InteractionState.HOVERING;
      }
    } else {
      this.selectionManager.unhoverObject();
      if (this.state === InteractionState.HOVERING) {
        this.state = InteractionState.IDLE;
      }
    }
  }

  private landmarkToWorld(lm: Landmark): { x: number; y: number; z: number } {
    const s = this.config.worldScale;
    return {
      x: (lm.x - 0.5) * s,
      y: -(lm.y - 0.5) * s,
      z: -lm.z * s,
    };
  }

  private getCursorPosition(hand: HandData): InteractionCursor | null {
    if (this.config.cursorMode === 'index_tip') {
      const tip = this.landmarkToWorld(hand.landmarks[HandLandmark.INDEX_FINGER_TIP]);
      return { x: tip.x, y: tip.y, z: tip.z, handedness: hand.handedness };
    }

    const thumb = this.landmarkToWorld(hand.landmarks[HandLandmark.THUMB_TIP]);
    const index = this.landmarkToWorld(hand.landmarks[HandLandmark.INDEX_FINGER_TIP]);

    return {
      x: (thumb.x + index.x) / 2,
      y: (thumb.y + index.y) / 2,
      z: (thumb.z + index.z) / 2,
      handedness: hand.handedness,
    };
  }

  private smoothCursor(cursor: InteractionCursor): void {
    const alpha = 0.3;
    this.smoothedCursor[0] += (cursor.x - this.smoothedCursor[0]) * alpha;
    this.smoothedCursor[1] += (cursor.y - this.smoothedCursor[1]) * alpha;
    this.smoothedCursor[2] += (cursor.z - this.smoothedCursor[2]) * alpha;
  }

  getState(): InteractionState {
    return this.state;
  }

  getSmoothedCursor(): [number, number, number] {
    return [...this.smoothedCursor] as [number, number, number];
  }

  getGrabManager(): GrabManager {
    return this.grabManager;
  }

  getHandRotation(): [number, number, number] {
    return [...this.lastHandRotation] as [number, number, number];
  }

  reset(): void {
    this.selectionManager.clearSelection();
    this.grabManager.reset();
    this.state = InteractionState.IDLE;
    this.smoothedCursor = [0, 0, 0];
    this.lastHandRotation = [0, 0, 0];
  }
}
