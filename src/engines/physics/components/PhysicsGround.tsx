import { RigidBody, CuboidCollider } from '@react-three/rapier';

interface Props {
  visible?: boolean;
  size?: number;
}

export function PhysicsGround({ visible = true, size = 20 }: Props) {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]} name="ground">
      <CuboidCollider args={[size / 2, 0.5, size / 2]} />
      {visible && (
        <mesh receiveShadow>
          <boxGeometry args={[size, 1, size]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.9}
            metalness={0.05}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </RigidBody>
  );
}
