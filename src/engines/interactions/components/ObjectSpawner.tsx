import { useMemo, useCallback } from 'react';
import { InteractiveObject3D } from './InteractiveObject3D';
import { InteractiveCube } from './InteractiveCube';
import { InteractiveSphere } from './InteractiveSphere';
import { generateId } from '../../../utils/generateId';

const COLORS = ['#4488ff', '#ff6b9d', '#44ddaa', '#ff922b', '#cc5de8', '#339af0', '#51cf66'];

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface SpawnerProps {
  objects: InteractiveObject3D[];
  onSpawn: (object: InteractiveObject3D) => void;
}

export function useObjectSpawner(onRegister: (obj: InteractiveObject3D) => void) {
  const spawnCube = useCallback(
    (position?: [number, number, number]) => {
      const pos = position ?? [
        randomInRange(-2, 2),
        randomInRange(0.5, 2.5),
        randomInRange(-2, 1),
      ];
      const obj = new InteractiveObject3D(
        generateId('cube'),
        'Cube',
        pos as [number, number, number],
        randomColor(),
      );
      onRegister(obj);
      return obj;
    },
    [onRegister],
  );

  const spawnSphere = useCallback(
    (position?: [number, number, number]) => {
      const pos = position ?? [
        randomInRange(-2, 2),
        randomInRange(0.5, 2.5),
        randomInRange(-2, 1),
      ];
      const obj = new InteractiveObject3D(
        generateId('sphere'),
        'Sphere',
        pos as [number, number, number],
        randomColor(),
      );
      onRegister(obj);
      return obj;
    },
    [onRegister],
  );

  const spawnRandom = useCallback(
    (position?: [number, number, number]) => {
      return Math.random() > 0.5 ? spawnCube(position) : spawnSphere(position);
    },
    [spawnCube, spawnSphere],
  );

  return { spawnCube, spawnSphere, spawnRandom };
}

export function ObjectSpawner({ objects }: SpawnerProps) {
  const cubes = useMemo(() => objects.filter((o) => o.name === 'Cube'), [objects]);
  const spheres = useMemo(() => objects.filter((o) => o.name === 'Sphere'), [objects]);

  return (
    <group>
      {cubes.map((obj) => (
        <InteractiveCube key={obj.id} interactable={obj} />
      ))}
      {spheres.map((obj) => (
        <InteractiveSphere key={obj.id} interactable={obj} />
      ))}
    </group>
  );
}
