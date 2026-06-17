export interface PhysicsConfig {
  gravity: [number, number, number];
  restitution: number;
  friction: number;
  linearDamping: number;
  angularDamping: number;
  ccdEnabled: boolean;
  grabStiffness: number;
  grabDamping: number;
  throwMultiplier: number;
  throwAngularMultiplier: number;
  maxThrowSpeed: number;
  velocityHistorySize: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: [0, -9.81, 0],
  restitution: 0.3,
  friction: 0.7,
  linearDamping: 0.5,
  angularDamping: 0.5,
  ccdEnabled: true,
  grabStiffness: 20,
  grabDamping: 5,
  throwMultiplier: 8,
  throwAngularMultiplier: 2,
  maxThrowSpeed: 15,
  velocityHistorySize: 6,
};
