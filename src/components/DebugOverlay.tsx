import { useAppStore } from '../stores/appStore';
import { HandDebugView } from './HandDebugView';
import { GestureDebugView } from './GestureDebugView';
import { InteractionDebugView } from './InteractionDebugView';

const styles = {
  container: {
    position: 'fixed' as const,
    top: 12,
    left: 12,
    background: 'rgba(0, 0, 0, 0.85)',
    color: '#e0e0e0',
    padding: '12px 16px',
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    zIndex: 1000,
    minWidth: 260,
    maxWidth: 320,
    maxHeight: 'calc(100vh - 24px)',
    overflowY: 'auto' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#00d4ff',
    fontWeight: 700 as const,
    fontSize: 13,
    marginBottom: 8,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 6,
  },
  section: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  sectionTitle: {
    color: '#aaa',
    fontWeight: 600 as const,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
    fontSize: 11,
  },
  label: { color: '#888' },
  value: { color: '#fff' },
};

export function DebugOverlay() {
  const debugMode = useAppStore((s) => s.debugMode);
  const cameraStatus = useAppStore((s) => s.cameraStatus);
  const error = useAppStore((s) => s.error);

  if (!debugMode) return null;

  return (
    <div style={styles.container}>
      <div style={styles.title}>Debug Panel</div>

      <div style={styles.row}>
        <span style={styles.label}>Camera</span>
        <span style={styles.value}>{cameraStatus}</span>
      </div>

      {error && (
        <div style={{ marginTop: 4, color: '#ff4444', fontSize: 10 }}>
          {error}
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Hand Tracking</div>
        <HandDebugView />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Gestures</div>
        <GestureDebugView />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Interaction</div>
        <InteractionDebugView />
      </div>
    </div>
  );
}
