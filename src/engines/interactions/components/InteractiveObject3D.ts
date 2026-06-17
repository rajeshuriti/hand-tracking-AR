import type { IInteractable } from '../interfaces/IInteractable';
import type { Handedness } from '../../../types/hand';

export class InteractiveObject3D implements IInteractable {
  readonly id: string;
  readonly name: string;

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  baseColor: string;
  baseScale: [number, number, number];

  isHovered = false;
  isSelected = false;
  isGrabbed = false;
  isInteractable = true;

  physicsBodyId?: string;
  ownerPlayerId?: string;
  aiGenerated?: boolean;
  metadata: Record<string, unknown> = {};

  private onChangeCallback: (() => void) | null = null;
  private onDestroyCallback: (() => void) | null = null;
  private onGrabStartCallback: ((handedness: Handedness) => void) | null = null;
  private onGrabUpdateCallback: ((pos: [number, number, number], rot: [number, number, number]) => void) | null = null;
  private onGrabEndCallback: (() => void) | null = null;

  constructor(
    id: string,
    name: string,
    position: [number, number, number],
    color: string,
    scale: [number, number, number] = [1, 1, 1],
  ) {
    this.id = id;
    this.name = name;
    this.position = [...position];
    this.rotation = [0, 0, 0];
    this.scale = [...scale];
    this.baseColor = color;
    this.baseScale = [...scale];
  }

  onChange(cb: () => void): void {
    this.onChangeCallback = cb;
  }

  onDestroyEvent(cb: () => void): void {
    this.onDestroyCallback = cb;
  }

  setGrabStartCallback(cb: (handedness: Handedness) => void): void {
    this.onGrabStartCallback = cb;
  }

  setGrabUpdateCallback(cb: (pos: [number, number, number], rot: [number, number, number]) => void): void {
    this.onGrabUpdateCallback = cb;
  }

  setGrabEndCallback(cb: () => void): void {
    this.onGrabEndCallback = cb;
  }

  select(): void {
    this.isSelected = true;
    this.isHovered = false;
    this.onChangeCallback?.();
  }

  deselect(): void {
    this.isSelected = false;
    this.scale = [...this.baseScale];
    this.onChangeCallback?.();
  }

  hover(): void {
    if (this.isSelected || this.isGrabbed) return;
    this.isHovered = true;
    this.onHoverEnter?.();
    this.onChangeCallback?.();
  }

  unhover(): void {
    if (!this.isHovered) return;
    this.isHovered = false;
    this.scale = [...this.baseScale];
    this.onHoverExit?.();
    this.onChangeCallback?.();
  }

  move(position: [number, number, number]): void {
    this.position = position;
    this.onChangeCallback?.();
  }

  rotate(rotation: [number, number, number]): void {
    this.rotation = rotation;
    this.onChangeCallback?.();
  }

  destroy(): void {
    this.isHovered = false;
    this.isSelected = false;
    this.isGrabbed = false;
    this.onDestroyCallback?.();
  }

  onGrabStart(handedness: Handedness): void {
    this.isGrabbed = true;
    this.isSelected = true;
    this.isHovered = false;
    this.onGrabStartCallback?.(handedness);
    this.onChangeCallback?.();
  }

  onGrabUpdate(position: [number, number, number], rotation: [number, number, number]): void {
    this.position = position;
    this.rotation = rotation;
    this.onGrabUpdateCallback?.(position, rotation);
    this.onChangeCallback?.();
  }

  onGrabEnd(): void {
    this.isGrabbed = false;
    this.isSelected = false;
    this.onGrabEndCallback?.();
    this.onChangeCallback?.();
  }

  onHoverEnter(): void {}
  onHoverExit(): void {}
}
