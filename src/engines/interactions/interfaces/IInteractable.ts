export interface IInteractable {
  readonly id: string;
  readonly name: string;

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];

  isHovered: boolean;
  isSelected: boolean;
  isInteractable: boolean;

  baseColor: string;
  baseScale: [number, number, number];

  // Future extension points
  physicsBodyId?: string;
  ownerPlayerId?: string;
  aiGenerated?: boolean;
  metadata: Record<string, unknown>;

  select(): void;
  deselect(): void;
  hover(): void;
  unhover(): void;
  move(position: [number, number, number]): void;
  destroy(): void;
}
