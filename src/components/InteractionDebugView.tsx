import { useInteractionStore } from '../stores/interactionStore';
import { useGestureStore } from '../stores/gestureStore';
import { useHandTrackingStore } from '../stores/handTrackingStore';

const styles = {
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
    fontSize: 11,
  },
  label: { color: '#888' },
  value: { color: '#fff' },
};

function formatPos(pos: [number, number, number]): string {
  return `${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}`;
}

export function InteractionDebugView() {
  const isGrabbed = useInteractionStore((s) => s.isGrabbed);
  const cursorPos = useInteractionStore((s) => s.cursorPosition);
  const handsCount = useHandTrackingStore((s) => s.hands.length);

  const rightGesture = useGestureStore((s) => s.rightGesture);
  const leftGesture = useGestureStore((s) => s.leftGesture);
  const activeGesture = rightGesture.type !== 'NONE' ? rightGesture : leftGesture;

  const dist = Math.sqrt(cursorPos[0] ** 2 + cursorPos[1] ** 2).toFixed(2);

  return (
    <>
      <div style={styles.row}>
        <span style={styles.label}>Sphere</span>
        <span style={{ color: isGrabbed ? '#44dd88' : '#4488ff' }}>
          {isGrabbed ? 'GRABBED' : 'IDLE'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Hands</span>
        <span style={{ color: handsCount > 0 ? '#51cf66' : '#666' }}>
          {handsCount}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Gesture</span>
        <span style={styles.value}>
          {activeGesture.type !== 'NONE'
            ? `${activeGesture.type} (${activeGesture.state})`
            : '—'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Cursor</span>
        <span style={{ color: '#aaa', fontSize: 10 }}>{formatPos(cursorPos)}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Dist to sphere</span>
        <span style={{ color: Number(dist) < 1.0 ? '#51cf66' : '#ff6b6b', fontSize: 10 }}>
          {dist}
        </span>
      </div>
    </>
  );
}
