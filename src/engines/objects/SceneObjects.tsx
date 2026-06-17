import { useSceneStore } from '../../stores/sceneStore';
import { InteractiveObject } from './InteractiveObject';

export function SceneObjects() {
  const objects = useSceneStore((s) => s.objects);

  return (
    <group>
      {[...objects.values()].map((obj) => (
        <InteractiveObject key={obj.id} data={obj} />
      ))}
    </group>
  );
}
