import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHandTrackingStore } from '../../stores/handTrackingStore';
import { FINGERTIP_LANDMARKS, LANDMARK_COUNT } from '../../types/hand';

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17],             // palm
];

const SCALE = 2;
const JOINT_RADIUS = 0.008;
const TIP_RADIUS = 0.014;
const WRIST_RADIUS = 0.012;

const HAND_COLORS = {
  0: { joint: 0x00d4ff, line: 0x00aacc, emissive: 0x003344 },
  1: { joint: 0xff6b9d, line: 0xcc5588, emissive: 0x330011 },
} as const;

const fingertipSet = new Set(FINGERTIP_LANDMARKS);

function HandSkeleton({ handIndex }: { handIndex: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const jointRefs = useRef<THREE.Mesh[]>([]);
  const lineRef = useRef<THREE.LineSegments>(null);

  // Pre-allocate reusable vectors — never create in the render loop
  const vecPool = useMemo(() => Array.from({ length: LANDMARK_COUNT }, () => new THREE.Vector3()), []);

  const colors = HAND_COLORS[handIndex as 0 | 1] ?? HAND_COLORS[0];

  const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: colors.joint,
    emissive: colors.emissive,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
  }), [colors]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: colors.line,
    transparent: true,
    opacity: 0.6,
  }), [colors]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CONNECTIONS.length * 6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const jointGeo = useMemo(() => new THREE.SphereGeometry(JOINT_RADIUS, 10, 10), []);
  const tipGeo = useMemo(() => new THREE.SphereGeometry(TIP_RADIUS, 12, 12), []);
  const wristGeo = useMemo(() => new THREE.SphereGeometry(WRIST_RADIUS, 10, 10), []);

  useFrame(() => {
    const hands = useHandTrackingStore.getState().hands;
    const hand = hands[handIndex];
    const group = groupRef.current;
    if (!group) return;

    if (!hand) {
      group.visible = false;
      return;
    }

    group.visible = true;

    const confidence = hand.confidence;
    jointMaterial.opacity = 0.3 + confidence * 0.7;
    lineMaterial.opacity = 0.2 + confidence * 0.5;

    // Convert all landmarks to 3D space using pre-allocated vectors
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      const lm = hand.landmarks[i];
      vecPool[i].set(
        (lm.x - 0.5) * SCALE,
        -(lm.y - 0.5) * SCALE,
        -lm.z * SCALE,
      );
    }

    // Update joint positions
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      const mesh = jointRefs.current[i];
      if (mesh) {
        mesh.position.copy(vecPool[i]);
      }
    }

    // Update bone lines
    const attr = lineGeometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const [a, b] = CONNECTIONS[i];
      const va = vecPool[a];
      const vb = vecPool[b];
      const off = i * 6;
      arr[off] = va.x;     arr[off + 1] = va.y;     arr[off + 2] = va.z;
      arr[off + 3] = vb.x; arr[off + 4] = vb.y; arr[off + 5] = vb.z;
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: LANDMARK_COUNT }, (_, i) => {
        const geo = i === 0 ? wristGeo : fingertipSet.has(i as never) ? tipGeo : jointGeo;
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) jointRefs.current[i] = el; }}
            geometry={geo}
            material={jointMaterial}
          />
        );
      })}
      <lineSegments ref={lineRef} geometry={lineGeometry} material={lineMaterial} />
    </group>
  );
}

export function HandVisualization() {
  return (
    <group>
      <HandSkeleton handIndex={0} />
      <HandSkeleton handIndex={1} />
    </group>
  );
}
