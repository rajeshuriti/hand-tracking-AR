import { useEffect } from 'react';
import type { EventName, EventHandler } from '../types/events';
import { eventBus } from '../services/EventBus';

export function useEventBus<T extends EventName>(event: T, handler: EventHandler<T>): void {
  useEffect(() => {
    return eventBus.on(event, handler);
  }, [event, handler]);
}
