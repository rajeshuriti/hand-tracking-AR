import { useState } from 'react';
import { useHandTrackingStore } from '../stores/handTrackingStore';
import { HandLandmark, LANDMARK_NAMES, FINGERTIP_LANDMARKS } from '../types/hand';
import type { HandData, Landmark } from '../types/hand';

const fmt = (n: number) => n.toFixed(3);

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#00ff88' : pct >= 50 ? '#ffcc00' : '#ff4444';

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 3, background: '#222', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.15s' }} />
      </div>
    </div>
  );
}

function LandmarkRow({ index, landmark }: { index: number; landmark: Landmark }) {
  const name = LANDMARK_NAMES[index as keyof typeof LANDMARK_NAMES] ?? `#${index}`;
  const isTip = (FINGERTIP_LANDMARKS as readonly number[]).includes(index);

  return (
    <tr style={{ fontSize: 10, color: isTip ? '#00d4ff' : '#aaa' }}>
      <td style={{ paddingRight: 8, whiteSpace: 'nowrap' }}>{name}</td>
      <td style={{ paddingRight: 6, fontFamily: 'monospace', textAlign: 'right' }}>{fmt(landmark.x)}</td>
      <td style={{ paddingRight: 6, fontFamily: 'monospace', textAlign: 'right' }}>{fmt(landmark.y)}</td>
      <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{fmt(landmark.z)}</td>
    </tr>
  );
}

function HandSection({ hand, color }: { hand: HandData; color: string }) {
  const [expanded, setExpanded] = useState(false);

  const wrist = hand.landmarks[HandLandmark.WRIST];
  const indexTip = hand.landmarks[HandLandmark.INDEX_FINGER_TIP];

  return (
    <div style={{
      marginTop: 8,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ color, fontWeight: 700, fontSize: 12 }}>
          {hand.handedness} Hand
        </span>
        <span style={{ color: '#666', fontSize: 10 }}>
          21 landmarks
        </span>
      </div>

      <ConfidenceBar value={hand.confidence} label="Detection" />
      <ConfidenceBar value={hand.presenceConfidence} label="Presence" />

      <div style={{ marginTop: 6, fontSize: 10, color: '#888' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Wrist</span>
          <span style={{ fontFamily: 'monospace', color: '#ccc' }}>
            ({fmt(wrist.x)}, {fmt(wrist.y)}, {fmt(wrist.z)})
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Index Tip</span>
          <span style={{ fontFamily: 'monospace', color: '#ccc' }}>
            ({fmt(indexTip.x)}, {fmt(indexTip.y)}, {fmt(indexTip.z)})
          </span>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          marginTop: 6,
          width: '100%',
          padding: '3px 0',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          color: '#888',
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        {expanded ? 'Hide' : 'Show'} All Landmarks
      </button>

      {expanded && (
        <div style={{ marginTop: 6, maxHeight: 200, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: 9, color: '#555', borderBottom: '1px solid #222' }}>
                <th style={{ textAlign: 'left', paddingBottom: 3 }}>Joint</th>
                <th style={{ textAlign: 'right', paddingBottom: 3 }}>X</th>
                <th style={{ textAlign: 'right', paddingBottom: 3 }}>Y</th>
                <th style={{ textAlign: 'right', paddingBottom: 3 }}>Z</th>
              </tr>
            </thead>
            <tbody>
              {hand.landmarks.map((lm, i) => (
                <LandmarkRow key={i} index={i} landmark={lm} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HandDebugView() {
  const hands = useHandTrackingStore((s) => s.hands);
  const fps = useHandTrackingStore((s) => s.fps);
  const processingTimeMs = useHandTrackingStore((s) => s.processingTimeMs);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2,
        fontSize: 11,
      }}>
        <span style={{ color: '#888' }}>Hands Detected</span>
        <span style={{ color: hands.length > 0 ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
          {hands.length}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2,
        fontSize: 11,
      }}>
        <span style={{ color: '#888' }}>Tracking FPS</span>
        <span style={{
          color: fps >= 25 ? '#00ff88' : fps >= 15 ? '#ffcc00' : '#ff4444',
          fontWeight: 600,
        }}>
          {fps}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2,
        fontSize: 11,
      }}>
        <span style={{ color: '#888' }}>Processing</span>
        <span style={{
          color: processingTimeMs < 20 ? '#00ff88' : processingTimeMs < 40 ? '#ffcc00' : '#ff4444',
          fontFamily: 'monospace',
          fontWeight: 600,
        }}>
          {processingTimeMs.toFixed(1)}ms
        </span>
      </div>

      {hands.map((hand) => (
        <HandSection
          key={hand.handedness}
          hand={hand}
          color={hand.handedness === 'Left' ? '#00d4ff' : '#ff6b9d'}
        />
      ))}

      {hands.length === 0 && (
        <div style={{
          marginTop: 8,
          padding: 8,
          textAlign: 'center',
          color: '#555',
          fontSize: 11,
          fontStyle: 'italic',
        }}>
          No hands detected
        </div>
      )}
    </div>
  );
}
