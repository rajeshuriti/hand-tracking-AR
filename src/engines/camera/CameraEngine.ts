import type { CameraConfig } from '../../types/camera';
import { DEFAULT_CAMERA_CONFIG, CameraStatus } from '../../types/camera';
import { eventBus } from '../../services/EventBus';
import { useAppStore } from '../../stores/appStore';

export class CameraEngine {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: CameraConfig;
  private animationFrameId: number | null = null;
  private onFrame: ((video: HTMLVideoElement, timestamp: number) => void) | null = null;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
  }

  async start(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    useAppStore.getState().setCameraStatus(CameraStatus.REQUESTING);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          facingMode: this.config.facingMode,
          frameRate: { ideal: this.config.frameRate },
        },
        audio: false,
      });

      videoElement.srcObject = this.stream;
      await videoElement.play();

      useAppStore.getState().setCameraStatus(CameraStatus.ACTIVE);
      eventBus.emit('camera:started', {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      });

      this.startFrameLoop();
    } catch (err) {
      const message = this.describeError(err);
      useAppStore.getState().setCameraStatus(CameraStatus.ERROR);
      useAppStore.getState().setError(message);
      eventBus.emit('camera:error', { error: message });
      throw new Error(message);
    }
  }

  private describeError(err: unknown): string {
    if (!(err instanceof DOMException)) {
      return err instanceof Error ? err.message : 'Camera access failed';
    }
    switch (err.name) {
      case 'NotAllowedError':
        return 'Camera permission denied. Click the camera icon in your browser\'s address bar to allow access, then try again.';
      case 'NotFoundError':
        return 'No camera found. Please connect a webcam and try again.';
      case 'NotReadableError':
      case 'AbortError':
        return 'Camera is in use by another application. Close it and try again.';
      case 'OverconstrainedError':
        return 'Camera does not support the requested resolution. Try a different camera.';
      default:
        return `Camera error: ${err.message}`;
    }
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    useAppStore.getState().setCameraStatus(CameraStatus.STOPPED);
    eventBus.emit('camera:stopped', undefined);
  }

  setFrameCallback(callback: (video: HTMLVideoElement, timestamp: number) => void): void {
    this.onFrame = callback;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  isActive(): boolean {
    return useAppStore.getState().cameraStatus === CameraStatus.ACTIVE;
  }

  private startFrameLoop(): void {
    const loop = (timestamp: number) => {
      if (this.videoElement && this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.onFrame?.(this.videoElement, timestamp);
        eventBus.emit('camera:frame', { timestamp });
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
}
