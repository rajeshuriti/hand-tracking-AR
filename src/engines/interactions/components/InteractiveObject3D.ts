import type { IInteractable } from '../interfaces/IInteractable';

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
  isInteractable = true;

  physicsBodyId?: string;
  ownerPlayerId?: string;
  aiGenerated?: boolean;
  metadata: Record<string, unknown> = {};

  private onChangeCallback: (() => void) | null = null;
  private onDestroyCallback: (() => void) | null = null;

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

  onDestroy(cb: () => void): void {
    this.onDestroyCallback = cb;
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
    if (this.isSelected) return;
    this.isHovered = true;
    this.onChangeCallback?.();
  }

  unhover(): void {
    this.isHovered = false;
    this.scale = [...this.baseScale];
    this.onChangeCallback?.();
  }

  move(position: [number, number, number]): void {
    this.position = position;
    this.onChangeCallback?.();
  }

  destroy(): void {
    this.isHovered = false;
    this.isSelected = false;
    this.onDestroyCallback?.();
  }
}
