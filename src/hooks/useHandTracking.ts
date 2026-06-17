import { useRef, useCallback, useEffect } from 'react';
import { CameraEngine } from '../engines/camera';
import { HandTrackingService } from '../engines/handTracking';
import { GestureEngine } from '../engines/gestures';
import { useHandTrackingStore, getHand, getLandmark } from '../stores/handTrackingStore';
import { useGestureStore } from '../stores/gestureStore';
import { eventBus } from '../services/EventBus';
import type { Handedness } from '../types/hand';
import { GestureType } from '../types/gestures';

export function useHandTracking() {
  const cameraRef = useRef<CameraEngine | null>(null);
  const serviceRef = useRef<HandTrackingService | null>(null);
  const gestureRef = useRef<GestureEngine | null>(null);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTracking = useHandTrackingStore((s) => s.isTracking);
  const hands = useHandTrackingStore((s) => s.hands);
  const fps = useHandTrackingStore((s) => s.fps);
  const processingTimeMs = useHandTrackingStore((s) => s.processingTimeMs);

  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    const camera = new CameraEngine();
    const service = new HandTrackingService();
    const gestures = new GestureEngine();

    cameraRef.current = camera;
    serviceRef.current = service;
    gestureRef.current = gestures;

    await service.initialize();

    camera.setFrameCallback((video, timestamp) => {
      const result = service.processFrame(video, timestamp);
      if (result) {
        const htStore = useHandTrackingStore.getState();
        htStore.setHands(result.hands);
        htStore.setProcessingTime(result.processingTimeMs);

        const gestureResults = gestures.processHands(result.hands);
        const gStore = useGestureStore.getState();

        for (const gr of gestureResults) {
          gStore.setGesture(gr);
        }

        // Clear gestures for hands that have no active gesture result
        const activeHands = new Set(gestureResults.filter((g) => g.type !== GestureType.NONE).map((g) => g.handedness));
        if (!activeHands.has('Left')) gStore.clearGesture('Left');
        if (!activeHands.has('Right')) gStore.clearGesture('Right');

        gStore.setHistory(gestures.getHistory());
      }
    });

    fpsTimerRef.current = setInterval(() => {
      const svc = serviceRef.current;
      if (svc) {
        useHandTrackingStore.getState().setFps(svc.fps);
      }
    }, 1000);

    await camera.start(videoElement);
    useHandTrackingStore.getState().setTracking(true);
    eventBus.emit('app:initialized', undefined);
  }, []);

  const stop = useCallback(() => {
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
    cameraRef.current?.stop();
    serviceRef.current?.destroy();
    gestureRef.current?.reset();
    cameraRef.current = null;
    serviceRef.current = null;
    gestureRef.current = null;
    useHandTrackingStore.getState().setTracking(false);
    useHandTrackingStore.getState().reset();
    useGestureStore.getState().reset();
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  const getHandByHandedness = useCallback(
    (handedness: Handedness) => getHand(handedness),
    [],
  );

  const getLandmarkByIndex = useCallback(
    (handedness: Handedness, index: number) => getLandmark(handedness, index),
    [],
  );

  return {
    start,
    stop,
    isTracking,
    hands,
    fps,
    processingTimeMs,
    getHand: getHandByHandedness,
    getLandmark: getLandmarkByIndex,
  };
}
