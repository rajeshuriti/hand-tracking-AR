import type { IInteractable } from '../interfaces/IInteractable';
import { eventBus } from '../../../services/EventBus';

export class ObjectManager {
  private objects = new Map<string, IInteractable>();

  register(object: IInteractable): void {
    this.objects.set(object.id, object);
    eventBus.emit('interaction:object:created', {
      objectId: object.id,
      type: object.name,
      position: object.position,
    });
  }

  remove(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    obj.destroy();
    this.objects.delete(id);
    eventBus.emit('interaction:object:destroyed', { objectId: id });
  }

  getById(id: string): IInteractable | undefined {
    return this.objects.get(id);
  }

  getAll(): IInteractable[] {
    return [...this.objects.values()];
  }

  getInteractable(): IInteractable[] {
    return this.getAll().filter((o) => o.isInteractable);
  }

  getNearest(
    x: number,
    y: number,
    z: number,
    maxDistance: number,
  ): IInteractable | null {
    let nearest: IInteractable | null = null;
    let nearestDist = maxDistance;

    for (const obj of this.objects.values()) {
      if (!obj.isInteractable) continue;
      const dx = obj.position[0] - x;
      const dy = obj.position[1] - y;
      const dz = obj.position[2] - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = obj;
      }
    }

    return nearest;
  }

  get count(): number {
    return this.objects.size;
  }

  clear(): void {
    for (const obj of this.objects.values()) {
      obj.destroy();
    }
    this.objects.clear();
  }
}
