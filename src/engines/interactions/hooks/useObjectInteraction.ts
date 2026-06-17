import { useRef, useCallback, useEffect } from 'react';
import { ObjectManager } from '../managers/ObjectManager';
import { SelectionManager } from '../managers/SelectionManager';
import { HandInteractionController } from '../controllers/HandInteractionController';
import type { IInteractable } from '../interfaces/IInteractable';
import type { InteractionConfig } from '../events/InteractionTypes';
import { useInteractionStore } from '../../../stores/interactionStore';
import { useGestureStore } from '../../../stores/gestureStore';
import { useHandTrackingStore } from '../../../stores/handTrackingStore';
import { GestureType } from '../../../types/gestures';
import { eventBus } from '../../../services/EventBus';

export function useObjectInteraction(config?: Partial<InteractionConfig>) {
  const objectManagerRef = useRef<ObjectManager>(new ObjectManager());
  const selectionManagerRef = useRef<SelectionManager>(new SelectionManager());
  const controllerRef = useRef<HandInteractionController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new HandInteractionController(
      objectManagerRef.current,
      selectionManagerRef.current,
      config,
    );
  }

  useEffect(() => {
    const unsubHover = eventBus.on('interaction:object:hovered', (payload) => {
      useInteractionStore.getState().setHovered(payload.objectId);
    });
    const unsubUnhover = eventBus.on('interaction:object:unhovered', () => {
      useInteractionStore.getState().setHovered(null);
    });
    const unsubSelect = eventBus.on('interaction:object:selected', (payload) => {
      useInteractionStore.getState().setSelected(payload.objectId);
    });
    const unsubRelease = eventBus.on('interaction:object:released', () => {
      useInteractionStore.getState().setSelected(null);
    });

    return () => {
      unsubHover();
      unsubUnhover();
      unsubSelect();
      unsubRelease();
    };
  }, []);

  const processFrame = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    const hands = useHandTrackingStore.getState().hands;
    const gestureState = useGestureStore.getState();

    const gestures = [
      { gesture: gestureState.rightGesture, hand: hands.find((h) => h.handedness === 'Right') },
      { gesture: gestureState.leftGesture, hand: hands.find((h) => h.handedness === 'Left') },
    ];

    for (const { gesture, hand } of gestures) {
      if (gesture.type !== GestureType.NONE) {
        controller.processGesture(gesture, hand);
        break;
      }
    }

    if (gestures.every(({ gesture }) => gesture.type === GestureType.NONE)) {
      const anyHand = hands[0];
      if (anyHand) {
        const tip = anyHand.landmarks[8];
        if (tip) {
          const nearest = objectManagerRef.current.getNearest(tip.x, tip.y, tip.z, 0.3);
          if (nearest) {
            selectionManagerRef.current.hoverObject(nearest, anyHand.handedness);
          } else {
            selectionManagerRef.current.unhoverObject();
          }
        }
      } else {
        selectionManagerRef.current.unhoverObject();
      }
    }

    const store = useInteractionStore.getState();
    store.setInteractionState(controller.getState());
    store.setObjectCount(objectManagerRef.current.count);
    store.setCursorPosition(controller.getSmoothedCursor());
  }, []);

  const registerObject = useCallback((object: IInteractable) => {
    objectManagerRef.current.register(object);
  }, []);

  const removeObject = useCallback((id: string) => {
    objectManagerRef.current.remove(id);
  }, []);

  const getObjectById = useCallback((id: string) => {
    return objectManagerRef.current.getById(id);
  }, []);

  const spawnObject = useCallback(
    (object: IInteractable) => {
      registerObject(object);
    },
    [registerObject],
  );

  const reset = useCallback(() => {
    controllerRef.current?.reset();
    objectManagerRef.current.clear();
    useInteractionStore.getState().reset();
  }, []);

  const hoveredObjectId = useInteractionStore((s) => s.hoveredObjectId);
  const selectedObjectId = useInteractionStore((s) => s.selectedObjectId);
  const objectCount = useInteractionStore((s) => s.objectCount);
  const interactionState = useInteractionStore((s) => s.interactionState);

  return {
    processFrame,
    registerObject,
    removeObject,
    getObjectById,
    spawnObject,
    reset,
    hoveredObjectId,
    selectedObjectId,
    objectCount,
    interactionState,
    objectManager: objectManagerRef.current,
    selectionManager: selectionManagerRef.current,
  };
}
