# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spatial Hand Tracking Platform — a browser-based hand tracking system that transforms hand gestures into interactions with 3D digital objects. Inspired by Apple Vision Pro / Meta Quest spatial computing. Long-term goal: browser-native spatial operating system.

**Status:** Early stage — architecture and tech stack are defined but source code has not been scaffolded yet.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **State:** Zustand
- **3D:** Three.js via React Three Fiber + Drei
- **Hand Tracking:** MediaPipe Tasks Vision
- **Physics:** Rapier Physics
- **Animation:** Framer Motion
- **AI:** OpenAI, Anthropic Claude, Google Gemini APIs
- **Real-time:** Socket.IO
- **Backend:** ASP.NET Core Web API + PostgreSQL

## Architecture

Data flows top-down through a pipeline of engines, connected by an event bus:

```
Camera Engine → Hand Tracking Engine → Gesture Engine → Event Bus → [Scene | Objects | UI] → Physics Engine → AI Layer
```

Each engine is a self-contained module under `src/engines/`. The event bus decouples producers (camera, tracking, gestures) from consumers (scene, objects, UI).

## Planned Project Structure

```
src/
  app/           — App shell, routing
  engines/       — Core engine modules (camera, handTracking, gestures, interactions, physics, scene, ai)
  components/    — React components
  hooks/         — Custom React hooks
  pages/         — Page-level components
  services/      — External service integrations
  stores/        — Zustand state stores
  types/         — TypeScript type definitions
  utils/         — Shared utilities
  shared/        — Cross-cutting shared code
```

## Performance Constraints

- Target 60+ FPS
- Hand detection latency < 20ms
- Gesture recognition < 50ms
- Object interaction delay < 30ms

These constraints mean hot paths (camera frame processing, landmark detection, gesture state machines) must avoid allocations and unnecessary re-renders.
