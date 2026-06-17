import { useGestureStore } from '../stores/gestureStore';
import { GestureType, GestureState } from '../types/gestures';
import type { GestureResult, GestureHistoryEntry } from '../types/gestures';

const GESTURE_COLORS: Record<GestureType, string> = {
  [GestureType.NONE]: '#555',
  [GestureType.PINCH]: '#ff6b6b',
  [GestureType.OPEN_PALM]: '#51cf66',
  [GestureType.FIST]: '#ff922b',
  [GestureType.POINT]: '#339af0',
  [GestureType.VICTORY]: '#cc5de8',
};

const STATE_LABELS: Record<GestureState, string> = {
  [GestureState.IDLE]: '—',
  [GestureState.START]: 'START',
  [GestureState.HOLD]: 'HOLD',
  [GestureState.END]: 'END',
};

function StateBadge({ state }: { state: GestureState }) {
  const bg = state === GestureState.START ? '#1a3a1a'
    : state === GestureState.HOLD ? '#3a3a1a'
    : state === GestureState.END ? '#3a1a1a'
    : '#1a1a1a';
  const color = state === GestureState.START ? '#51cf66'
    : state === GestureState.HOLD ? '#ffcc00'
    : state === GestureState.END ? '#ff6b6b'
    : '#555';

  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 700,
      background: bg,
      color,
      letterSpacing: 0.5,
    }}>
      {STATE_LABELS[state]}
    </span>
  );
}

function ActiveGesture({ gesture, label }: { gesture: GestureResult; label: string }) {
  if (gesture.type === GestureType.NONE) return null;

  const color = GESTURE_COLORS[gesture.type];
  const pct = Math.round(gesture.confidence * 100);

  return (
    <div style={{
      marginTop: 6,
      padding: '6px 8px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 5,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color, fontWeight: 700, fontSize: 11 }}>{label}: {gesture.type}</span>
        <StateBadge state={gesture.state} />
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#888' }}>
        <span>Confidence: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{pct}%</span></span>
        <span>Duration: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{Math.round(gesture.durationMs)}ms</span></span>
      </div>

      {Object.keys(gesture.metrics).length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
          {Object.entries(gesture.metrics).map(([key, val]) => (
            <span key={key} style={{ fontSize: 9, color: '#666' }}>
              {key}: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{val.toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryEntry({ entry }: { entry: GestureHistoryEntry }) {
  const color = GESTURE_COLORS[entry.type];
  const duration = entry.endTime - entry.startTime;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 0',
      fontSize: 10,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      <span style={{ color: '#ccc', minWidth: 70 }}>{entry.type}</span>
      <span style={{ color: '#666' }}>{entry.handedness[0]}</span>
      <span style={{ color: '#888', fontFamily: 'monospace', marginLeft: 'auto' }}>
        {Math.round(duration)}ms
      </span>
      <span style={{ color: '#555', fontFamily: 'monospace', fontSize: 9 }}>
        {Math.round(entry.peakConfidence * 100)}%
      </span>
    </div>
  );
}

export function GestureDebugView() {
  const leftGesture = useGestureStore((s) => s.leftGesture);
  const rightGesture = useGestureStore((s) => s.rightGesture);
  const history = useGestureStore((s) => s.history);

  const hasActive = leftGesture.type !== GestureType.NONE || rightGesture.type !== GestureType.NONE;
  const recentHistory = history.slice(-8);

  return (
    <div>
      {hasActive ? (
        <>
          <ActiveGesture gesture={leftGesture} label="Left" />
          <ActiveGesture gesture={rightGesture} label="Right" />
        </>
      ) : (
        <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic', padding: '4px 0' }}>
          No active gestures
        </div>
      )}

      {recentHistory.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            fontSize: 9,
            color: '#555',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 4,
          }}>
            Recent ({history.length})
          </div>
          {recentHistory.map((entry, i) => (
            <HistoryEntry key={`${entry.startTime}-${i}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
