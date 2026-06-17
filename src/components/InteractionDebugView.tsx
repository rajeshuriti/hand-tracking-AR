import { useInteractionStore } from '../stores/interactionStore';
import { useGestureStore } from '../stores/gestureStore';

const styles = {
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
    fontSize: 11,
  },
  label: { color: '#888' },
  value: { color: '#fff' },
  stateIdle: { color: '#666' },
  stateHover: { color: '#88bbff' },
  stateSelect: { color: '#ffcc00' },
  stateGrab: { color: '#ff6b6b' },
};

const stateColors: Record<string, React.CSSProperties> = {
  IDLE: styles.stateIdle,
  HOVERING: styles.stateHover,
  SELECTING: styles.stateSelect,
  GRABBING: styles.stateGrab,
};

function formatPos(pos: [number, number, number]): string {
  return `${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}`;
}

export function InteractionDebugView() {
  const hoveredObjectId = useInteractionStore((s) => s.hoveredObjectId);
  const selectedObjectId = useInteractionStore((s) => s.selectedObjectId);
  const objectCount = useInteractionStore((s) => s.objectCount);
  const interactionState = useInteractionStore((s) => s.interactionState);
  const cursorPos = useInteractionStore((s) => s.cursorPosition);

  const rightGesture = useGestureStore((s) => s.rightGesture);
  const leftGesture = useGestureStore((s) => s.leftGesture);

  const activeGesture = rightGesture.type !== 'NONE' ? rightGesture : leftGesture;

  return (
    <>
      <div style={styles.row}>
        <span style={styles.label}>State</span>
        <span style={stateColors[interactionState] ?? styles.value}>
          {interactionState}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Objects</span>
        <span style={styles.value}>{objectCount}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Hovered</span>
        <span style={hoveredObjectId ? styles.stateHover : styles.stateIdle}>
          {hoveredObjectId ?? '—'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Selected</span>
        <span style={selectedObjectId ? styles.stateSelect : styles.stateIdle}>
          {selectedObjectId ?? '—'}
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
    </>
  );
}
