# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spatial Hand Tracking Platform — a browser-based hand tracking system that transforms hand gestures into interactions with 3D digital objects. Inspired by Apple Vision Pro / Meta Quest spatial computing. Long-term goal: browser-native spatial operating system.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Type-check (tsc -b) then Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Tech Stack

- **Frontend:** React 19 + TypeScript 6 + Vite 8
- **State:** Zustand
- **3D:** Three.js via React Three Fiber + Drei
- **Hand Tracking:** MediaPipe Tasks Vision (HandLandmarker, GPU delegate)
- **Physics:** Rapier via @react-three/rapier (WASM, CCD, sleeping, collision detection)
- **Future:** Framer Motion, Socket.IO, ASP.NET Core backend

## Architecture

Data flows top-down through a pipeline, connected by a singleton event bus:

```
CameraEngine → HandTrackingService → GestureEngine → InteractionEngine → PhysicsEngine → EventBus → [Scene | UI]
```

### Separation of concerns

- **Services/Engines** (`src/engines/`) are plain TypeScript classes — no React, no direct store writes. They publish results exclusively through EventBus.
- **Stores** (`src/stores/`) are Zustand stores. Four stores: `handTrackingStore` (hand data, FPS, processing time), `gestureStore` (active gestures, history), `interactionStore` (hovered/selected object, interaction state, object count), `PhysicsStore` (active bodies, grabbed object, collisions, gravity). Hooks bridge engine output to stores.
- **EventBus** (`src/services/EventBus.ts`) is a typed pub/sub. Event types are defined in `src/types/events.ts`.
- **Hooks** (`src/hooks/`) bridge services to React. `useHandTracking` wires the tracking pipeline; `useGesture` provides gesture API; `useObjectInteraction` provides object interaction API; `usePhysics` / `useGrabPhysics` provide physics API.
- **Components** (`src/components/`) are HTML-overlay UI (debug panel, camera feed, FPS monitor, hand debug, gesture debug, interaction debug, physics debug).

### Service → Hook → Store → Component data flow

Services process frames and emit events. The `useHandTracking` hook listens to engine output and writes to Zustand stores. React components subscribe via selectors. The R3F `HandVisualization` reads store state inside `useFrame` — zero allocations per frame, no React re-renders.

## TypeScript Conventions

- **No `enum` keyword.** TypeScript 6 with `erasableSyntaxOnly` forbids runtime enums. Use `as const` objects with derived union types instead.
- **No constructor parameter properties.** `private` / `readonly` params in constructors are forbidden — declare fields explicitly.
- Strict mode is enabled.

## Key Files

| File | Purpose |
|------|---------|
| `src/engines/camera/CameraEngine.ts` | Webcam init, permission handling, rAF frame loop |
| `src/engines/handTracking/HandTrackingService.ts` | MediaPipe HandLandmarker, hand gained/lost detection |
| `src/engines/gestures/GestureEngine.ts` | Gesture state machine: frame-count debounce, START→HOLD transitions, history ring buffer |
| `src/engines/gestures/recognizers.ts` | IGesture implementations (Pinch, OpenPalm, Fist, Point, Victory) with weighted confidence scoring |
| `src/engines/gestures/math.ts` | Landmark geometry helpers: finger curl/extension, angles, distances |
| `src/engines/scene/HandVisualization.tsx` | R3F hand skeleton: zero-alloc useFrame loop, confidence opacity, tiered joint sizes |
| `src/services/EventBus.ts` | Typed singleton event bus |
| `src/hooks/useHandTracking.ts` | Full tracking API: start/stop, hands, fps, getHand(), getLandmark() |
| `src/hooks/useGesture.ts` | Gesture API: leftGesture, rightGesture, history, isGestureActive() |
| `src/stores/handTrackingStore.ts` | Hand data, FPS, processing time + getHand/getLandmark helpers |
| `src/stores/gestureStore.ts` | Active gestures per hand, gesture history |
| `src/stores/interactionStore.ts` | Hovered/selected object IDs, interaction state, cursor position |
| `src/engines/interactions/interfaces/IInteractable.ts` | Contract for interactable objects (select, hover, move, destroy) |
| `src/engines/interactions/managers/ObjectManager.ts` | Object registry with spatial nearest-object search |
| `src/engines/interactions/managers/SelectionManager.ts` | Single-selection state: hover, select, release |
| `src/engines/interactions/controllers/HandInteractionController.ts` | Core: PINCH → find nearest → grab → move (lerp) → release |
| `src/engines/interactions/components/InteractiveObject3D.ts` | IInteractable implementation with change callbacks |
| `src/engines/interactions/components/InteractiveCube.tsx` | R3F cube with hover glow, select highlight, useFrame movement |
| `src/engines/interactions/components/InteractiveSphere.tsx` | R3F sphere with same visual feedback |
| `src/engines/interactions/components/ObjectSpawner.tsx` | Renders InteractiveCube/Sphere; `useObjectSpawner` for spawn API |
| `src/engines/interactions/components/InteractionScene.tsx` | R3F scene integration: Physics wrapper, spawns objects, runs interaction + physics frame loop |
| `src/engines/interactions/hooks/useObjectInteraction.ts` | Full interaction API: spawn, register, remove, processFrame |
| `src/engines/physics/components/PhysicsCube.tsx` | RigidBody + CuboidCollider cube, collision events, physics sync |
| `src/engines/physics/components/PhysicsSphere.tsx` | RigidBody + BallCollider sphere, collision events, physics sync |
| `src/engines/physics/components/PhysicsGround.tsx` | Fixed RigidBody ground plane |
| `src/engines/physics/hooks/usePhysics.ts` | Body registry, applyForce, applyImpulse, setVelocity |
| `src/engines/physics/hooks/useGrabPhysics.ts` | Grab (kinematicPosition), velocity tracking, throw on release |
| `src/engines/physics/stores/PhysicsStore.ts` | Active bodies, grabbed object, collision count, gravity |
| `src/engines/physics/interfaces/IPhysicsConfig.ts` | PhysicsConfig with gravity, restitution, damping, throw params |
| `src/engines/physics/events/PhysicsEvents.ts` | Physics event payloads (body, collision, throw) |
| `src/components/InteractionDebugView.tsx` | Interaction state, hovered/selected IDs, object count, cursor pos |
| `src/components/PhysicsDebugView.tsx` | Physics enabled, active bodies, collisions, grabbed object, velocity |
| `src/components/GestureDebugView.tsx` | Active gesture state badges, confidence, metrics, history timeline |
| `src/components/HandDebugView.tsx` | Per-hand confidence bars, landmark positions, expandable landmark table |
| `src/types/gestures.ts` | IGesture interface, GestureClassification, GestureResult, GestureHistoryEntry, config |
| `src/types/events.ts` | EventMap — single source of truth for all event names and payloads |

## Gesture Engine Architecture

### IGesture interface

Every gesture recognizer implements `IGesture { type, displayName, recognize(landmarks) → GestureClassification }`. The `GESTURE_REGISTRY` array holds all recognizer instances. `classifyGesture()` runs all recognizers and returns the highest-confidence match.

### State machine (per hand)

```
IDLE → START → HOLD → END → IDLE
            ↗               ↗
     (debounce threshold)  (type changed or hand lost)
```

- **Frame-count debounce**: A new gesture must win N consecutive frames (`debounceFrames`, default 3) before promoting from candidate to active. Prevents jitter.
- **HOLD transition**: After `holdThresholdMs` (default 250ms) in START, auto-transitions to HOLD.
- **Confidence scoring**: Weighted combination of finger curl/extension ratios, palm-normalized distances, and spread metrics. Each gesture produces `metrics: Record<string, number>` for debug introspection.
- **History ring buffer**: Completed gestures (with startTime, endTime, peakConfidence) stored in a fixed-size ring buffer. Accessible via `getHistory()` / `getRecentHistory(n)`.

### Event bus events (gesture)

| Event | Payload | When |
|-------|---------|------|
| `gesture:start` | `GestureResult` | Gesture promoted from candidate after debounce |
| `gesture:hold` | `GestureResult` | START → HOLD transition |
| `gesture:end` | `GestureResult` | Gesture ended (type changed or hand lost) |
| `gesture:changed` | `GestureTransition` | Direct transition from one gesture to another (has `previous` + `current`) |

## Object Interaction Engine

### IInteractable interface

All interactive 3D objects implement `IInteractable { id, name, position, rotation, scale, isHovered, isSelected, isInteractable, select(), deselect(), hover(), unhover(), move(pos), destroy() }`. Includes future extension points: `physicsBodyId`, `ownerPlayerId`, `aiGenerated`.

### Interaction lifecycle

```
Hand visible → Cursor (pinch midpoint or index tip) → Find nearest object within maxDistance
  ↓
PINCH_START → Select nearest → Grab (store offset)
  ↓
PINCH_HOLD → Move object (lerp smoothing, grab offset preserved)
  ↓
PINCH_END → Release object
```

### Managers

- **ObjectManager**: Registry of all `IInteractable` objects. `getNearest(x,y,z,maxDist)` does linear scan (fast for 100s of objects). `register()` / `remove()` emit `interaction:object:created` / `interaction:object:destroyed`.
- **SelectionManager**: Single-hovered + single-selected object state. Emits `interaction:object:hovered` / `unhovered` / `selected` / `released`. Auto-deselects previous before selecting new.
- **HandInteractionController**: Reads gesture state + hand landmarks per frame, drives ObjectManager + SelectionManager. Smoothed cursor (EMA α=0.3), lerp movement (configurable `lerpSpeed`).

### Visual feedback

- **Hovered**: Slight scale increase (1.08×), blue tint + emissive glow
- **Selected/Grabbed**: Yellow color, strong emissive, normal scale
- **Released**: Returns to base color and scale

### InteractionScene (R3F integration)

`<InteractionScene />` is placed inside `<Canvas>`. It wraps content in `<Physics>`, spawns initial objects (20 cubes + 20 spheres), runs `processFrame()` inside `useFrame`, drives the physics grab system, and provides `InteractionContext` for external spawn control.

### Event bus events (interaction)

| Event | Payload | When |
|-------|---------|------|
| `interaction:object:hovered` | `{ objectId, handedness }` | Cursor enters object proximity |
| `interaction:object:unhovered` | `{ objectId }` | Cursor leaves object proximity |
| `interaction:object:selected` | `{ objectId, handedness }` | PINCH_START near an object |
| `interaction:object:released` | `{ objectId, finalPosition }` | PINCH_END or gesture change |
| `interaction:object:moved` | `{ objectId, transform }` | Each frame during grab |
| `interaction:object:created` | `{ objectId, type, position }` | Object registered |
| `interaction:object:destroyed` | `{ objectId }` | Object removed |

### Configuration

```ts
{
  maxInteractionDistance: 0.3,  // scene units
  lerpSpeed: 0.15,             // movement smoothing
  hoverScaleMultiplier: 1.08,  // hover visual feedback
  cursorMode: 'pinch_midpoint' // or 'index_tip'
}
```

## Physics Engine

### Rapier integration

All objects are wrapped in `<RigidBody>` with explicit colliders (`CuboidCollider` for cubes, `BallCollider` for spheres). The scene is wrapped in `<Physics gravity={[0, -9.81, 0]}>`. A fixed `<RigidBody type="fixed">` ground plane prevents objects from falling infinitely.

### Grab → Throw lifecycle

```
PINCH_START → Body type: dynamic → kinematicPosition (disable gravity, zero velocity)
  ↓
PINCH_HOLD → setNextKinematicTranslation (follow hand + grab offset)
           → Record velocity samples (weighted ring buffer, 6 samples)
  ↓
PINCH_END → Body type: kinematic → dynamic (re-enable gravity)
          → Apply throw velocity (weighted average × throwMultiplier)
          → Apply angular velocity (cross-product spin)
          → Emit physics:body:thrown if speed > 1.5
```

### Velocity tracking

During grab, `useGrabPhysics` records timestamped hand positions in a ring buffer (`velocityHistorySize`, default 6). On release, velocity is computed as a recency-weighted average — recent samples contribute more. Speed is clamped to `maxThrowSpeed` (default 15) and scaled by `throwMultiplier` (default 8).

### Collision system

Both `PhysicsCube` and `PhysicsSphere` register `onCollisionEnter` / `onCollisionExit` handlers that emit `physics:collision:started` / `physics:collision:ended` through EventBus with contact point and object IDs. Collision count is tracked in `PhysicsStore`.

### Physics configuration

```ts
{
  gravity: [0, -9.81, 0],
  restitution: 0.3,          // bounciness (spheres: +0.2)
  friction: 0.7,             // surface friction (spheres: -0.2)
  linearDamping: 0.5,        // velocity decay
  angularDamping: 0.5,       // spin decay (spheres: ×0.5)
  ccdEnabled: true,          // continuous collision detection
  grabStiffness: 20,         // spring constraint (future)
  grabDamping: 5,            // spring damping (future)
  throwMultiplier: 8,        // release velocity amplifier
  throwAngularMultiplier: 2, // release spin amplifier
  maxThrowSpeed: 15,         // velocity cap
  velocityHistorySize: 6,    // samples for throw calculation
}
```

### Event bus events (physics)

| Event | Payload | When |
|-------|---------|------|
| `physics:body:registered` | `{ objectId, mass, isDynamic }` | RigidBody reported ready |
| `physics:body:removed` | `{ objectId }` | Body unregistered |
| `physics:body:grabbed` | `{ objectId, handedness }` | PINCH_START on physics object |
| `physics:body:released` | `{ objectId, velocity }` | PINCH_END, body goes dynamic |
| `physics:body:thrown` | `{ objectId, velocity, angularVelocity, speed }` | Release with speed > 1.5 |
| `physics:collision:started` | `{ objectIdA, objectIdB, contactPoint, impactForce }` | Rapier contact begin |
| `physics:collision:ended` | `{ objectIdA, objectIdB }` | Rapier contact end |
| `physics:paused` | void | Physics simulation paused |
| `physics:resumed` | void | Physics simulation resumed |

## Debug Mode

Toggle with `Ctrl+Shift+D`. Shows: camera status, hand tracking (confidence bars, landmark positions, expandable 21-landmark table, processing time, FPS), gesture state (active gesture with state badge, confidence, duration, metrics, history timeline with peak confidence), interaction state (hovered/selected object IDs, object count, cursor position), physics state (enabled, active bodies, collision count, grabbed object, velocity, gravity). Enabled by default in dev.

## Performance Constraints

- Target 60+ FPS
- Hand detection latency < 20ms
- Gesture recognition < 50ms
- Support 200+ physics bodies

Hot paths must avoid allocations and re-renders. `HandVisualization` uses pre-allocated `THREE.Vector3` pools. Gesture recognizers use direct landmark array indexing with no intermediate objects. Physics runs in Rapier WASM with CCD and sleeping for stability.
