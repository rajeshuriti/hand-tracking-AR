import { useCallback } from 'react';
import { useGestureStore } from '../stores/gestureStore';
import { GestureType } from '../types/gestures';
import type { Handedness } from '../types/hand';

export function useGesture() {
  const leftGesture = useGestureStore((s) => s.leftGesture);
  const rightGesture = useGestureStore((s) => s.rightGesture);
  const history = useGestureStore((s) => s.history);

  const isGestureActive = useCallback(
    (type: GestureType, handedness?: Handedness): boolean => {
      if (handedness === 'Left' || handedness === undefined) {
        if (leftGesture.type === type && leftGesture.type !== GestureType.NONE) return true;
      }
      if (handedness === 'Right' || handedness === undefined) {
        if (rightGesture.type === type && rightGesture.type !== GestureType.NONE) return true;
      }
      return false;
    },
    [leftGesture, rightGesture],
  );

  return {
    leftGesture,
    rightGesture,
    history,
    isGestureActive,
  };
}
