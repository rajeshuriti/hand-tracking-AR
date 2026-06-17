import type { IInteractable } from '../interfaces/IInteractable';
import type { Handedness } from '../../../types/hand';
import { eventBus } from '../../../services/EventBus';

export class SelectionManager {
  private hoveredObject: IInteractable | null = null;
  private selectedObject: IInteractable | null = null;
  private selectingHand: Handedness | null = null;

  hoverObject(object: IInteractable, handedness: Handedness): void {
    if (this.hoveredObject === object) return;
    this.unhoverObject();
    this.hoveredObject = object;
    object.hover();
    eventBus.emit('interaction:object:hovered', {
      objectId: object.id,
      handedness,
    });
  }

  unhoverObject(): void {
    if (!this.hoveredObject) return;
    const id = this.hoveredObject.id;
    this.hoveredObject.unhover();
    this.hoveredObject = null;
    eventBus.emit('interaction:object:unhovered', { objectId: id });
  }

  selectObject(object: IInteractable, handedness: Handedness): void {
    if (this.selectedObject === object) return;
    this.releaseObject();
    this.selectedObject = object;
    this.selectingHand = handedness;
    object.select();
    eventBus.emit('interaction:object:selected', {
      objectId: object.id,
      handedness,
    });
  }

  releaseObject(): void {
    if (!this.selectedObject) return;
    const obj = this.selectedObject;
    obj.deselect();
    this.selectedObject = null;
    this.selectingHand = null;
    eventBus.emit('interaction:object:released', {
      objectId: obj.id,
      finalPosition: obj.position,
    });
  }

  getHoveredObject(): IInteractable | null {
    return this.hoveredObject;
  }

  getSelectedObject(): IInteractable | null {
    return this.selectedObject;
  }

  getSelectingHand(): Handedness | null {
    return this.selectingHand;
  }

  clearSelection(): void {
    this.unhoverObject();
    this.releaseObject();
  }
}
