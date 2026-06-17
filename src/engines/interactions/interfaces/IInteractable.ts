import type { Handedness } from '../../../types/hand';

export interface IInteractable {
  readonly id: string;
  readonly name: string;

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];

  isHovered: boolean;
  isSelected: boolean;
  isGrabbed: boolean;
  isInteractable: boolean;

  baseColor: string;
  baseScale: [number, number, number];

  physicsBodyId?: string;
  ownerPlayerId?: string;
  aiGenerated?: boolean;
  metadata: Record<string, unknown>;

  select(): void;
  deselect(): void;
  hover(): void;
  unhover(): void;
  move(position: [number, number, number]): void;
  rotate(rotation: [number, number, number]): void;
  destroy(): void;

  onGrabStart?(handedness: Handedness): void;
  onGrabUpdate?(position: [number, number, number], rotation: [number, number, number]): void;
  onGrabEnd?(): void;

  onHoverEnter?(): void;
  onHoverExit?(): void;
}
