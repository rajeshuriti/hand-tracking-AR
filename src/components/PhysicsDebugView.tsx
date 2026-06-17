import { usePhysicsStore } from '../engines/physics/stores/PhysicsStore';

const styles = {
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 3,
    fontSize: 11,
  },
  label: { color: '#888' },
  value: { color: '#fff' },
  enabled: { color: '#51cf66' },
  disabled: { color: '#ff6b6b' },
  grabbed: { color: '#ffcc00' },
};

function formatVec(v: [number, number, number]): string {
  return `${v[0].toFixed(1)}, ${v[1].toFixed(1)}, ${v[2].toFixed(1)}`;
}

export function PhysicsDebugView() {
  const physicsEnabled = usePhysicsStore((s) => s.physicsEnabled);
  const activeBodies = usePhysicsStore((s) => s.activeBodies);
  const collisionCount = usePhysicsStore((s) => s.collisionCount);
  const grabbedObjectId = usePhysicsStore((s) => s.grabbedObjectId);
  const grabbedVelocity = usePhysicsStore((s) => s.grabbedVelocity);
  const gravity = usePhysicsStore((s) => s.gravity);

  return (
    <>
      <div style={styles.row}>
        <span style={styles.label}>Physics</span>
        <span style={physicsEnabled ? styles.enabled : styles.disabled}>
          {physicsEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Bodies</span>
        <span style={styles.value}>{activeBodies}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Collisions</span>
        <span style={styles.value}>{collisionCount}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Grabbed</span>
        <span style={grabbedObjectId ? styles.grabbed : { color: '#666' }}>
          {grabbedObjectId ?? '—'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Velocity</span>
        <span style={{ color: '#aaa', fontSize: 10 }}>
          {formatVec(grabbedVelocity)}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Gravity</span>
        <span style={{ color: '#aaa', fontSize: 10 }}>
          {formatVec(gravity)}
        </span>
      </div>
    </>
  );
}
