import { ObjectManager } from '../managers/ObjectManager';
import { SelectionManager } from '../managers/SelectionManager';
import {
  InteractionState,
  DEFAULT_INTERACTION_CONFIG,
} from '../events/InteractionTypes';
import type { InteractionConfig, InteractionCursor } from '../events/InteractionTypes';
import type { GestureResult } from '../../../types/gestures';
import { GestureType, GestureState } from '../../../types/gestures';
import { HandLandmark } from '../../../types/hand';
import type { HandData } from '../../../types/hand';
import { eventBus } from '../../../services/EventBus';

interface GrabState {
  objectId: string;
  grabOffset: [number, number, number];
  lastPosition: [number, number, number];
}

export class HandInteractionController {
  private objectManager: ObjectManager;
  private selectionManager: SelectionManager;
  private config: InteractionConfig;
  private state: InteractionState = InteractionState.IDLE;
  private grabState: GrabState | null = null;
  private smoothedCursor: [number, number, number] = [0, 0, 0];

  constructor(
    objectManager: ObjectManager,
    selectionManager: SelectionManager,
    config: Partial<InteractionConfig> = {},
  ) {
    this.objectManager = objectManager;
    this.selectionManager = selectionManager;
    this.config = { ...DEFAULT_INTERACTION_CONFIG, ...config };
  }

  processGesture(gesture: GestureResult, hand: HandData | undefined): void {
    if (!hand) return;

    const cursor = this.getCursorPosition(hand);
    if (!cursor) return;

    this.smoothCursor(cursor);

    if (gesture.type === GestureType.PINCH) {
      this.handlePinch(gesture, cursor);
    } else {
      this.handleNonPinch(cursor);
    }
  }

  private handlePinch(gesture: GestureResult, cursor: InteractionCursor): void {
    if (gesture.state === GestureState.START) {
      this.onPinchStart(cursor);
    } else if (gesture.state === GestureState.HOLD) {
      this.onPinchHold();
    } else if (gesture.state === GestureState.END) {
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
      this.grabState = {
        objectId: nearest.id,
        grabOffset: [
          nearest.position[0] - this.smoothedCursor[0],
          nearest.position[1] - this.smoothedCursor[1],
          nearest.position[2] - this.smoothedCursor[2],
        ],
        lastPosition: [...nearest.position],
      };
      this.state = InteractionState.GRABBING;
    } else {
      this.state = InteractionState.SELECTING;
    }
  }

  private onPinchHold(): void {
    if (this.state !== InteractionState.GRABBING || !this.grabState) return;

    const obj = this.objectManager.getById(this.grabState.objectId);
    if (!obj) {
      this.grabState = null;
      this.state = InteractionState.IDLE;
      return;
    }

    const targetX = this.smoothedCursor[0] + this.grabState.grabOffset[0];
    const targetY = this.smoothedCursor[1] + this.grabState.grabOffset[1];
    const targetZ = this.smoothedCursor[2] + this.grabState.grabOffset[2];

    const lerpedX = this.lerp(obj.position[0], targetX, this.config.lerpSpeed);
    const lerpedY = this.lerp(obj.position[1], targetY, this.config.lerpSpeed);
    const lerpedZ = this.lerp(obj.position[2], targetZ, this.config.lerpSpeed);

    const newPos: [number, number, number] = [lerpedX, lerpedY, lerpedZ];
    obj.move(newPos);
    this.grabState.lastPosition = newPos;

    eventBus.emit('interaction:object:moved', {
      objectId: obj.id,
      transform: {
        position: newPos,
        rotation: obj.rotation,
        scale: obj.scale,
      },
    });
  }

  private onPinchEnd(): void {
    if (this.state === InteractionState.GRABBING) {
      this.selectionManager.releaseObject();
      this.grabState = null;
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

  private getCursorPosition(hand: HandData): InteractionCursor | null {
    if (this.config.cursorMode === 'index_tip') {
      const tip = hand.landmarks[HandLandmark.INDEX_FINGER_TIP];
      if (!tip) return null;
      return { x: tip.x, y: tip.y, z: tip.z, handedness: hand.handedness };
    }

    const thumb = hand.landmarks[HandLandmark.THUMB_TIP];
    const index = hand.landmarks[HandLandmark.INDEX_FINGER_TIP];
    if (!thumb || !index) return null;

    return {
      x: (thumb.x + index.x) / 2,
      y: (thumb.y + index.y) / 2,
      z: (thumb.z + index.z) / 2,
      handedness: hand.handedness,
    };
  }

  private smoothCursor(cursor: InteractionCursor): void {
    const alpha = 0.3;
    this.smoothedCursor[0] = this.lerp(this.smoothedCursor[0], cursor.x, alpha);
    this.smoothedCursor[1] = this.lerp(this.smoothedCursor[1], cursor.y, alpha);
    this.smoothedCursor[2] = this.lerp(this.smoothedCursor[2], cursor.z, alpha);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  getState(): InteractionState {
    return this.state;
  }

  getSmoothedCursor(): [number, number, number] {
    return [...this.smoothedCursor] as [number, number, number];
  }

  getGrabState(): GrabState | null {
    return this.grabState;
  }

  reset(): void {
    this.selectionManager.clearSelection();
    this.grabState = null;
    this.state = InteractionState.IDLE;
    this.smoothedCursor = [0, 0, 0];
  }
}
