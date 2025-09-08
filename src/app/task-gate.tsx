"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type TaskGate = {
  busy: boolean;
  // Queues the task to run exclusively. Returns the task result.
  runExclusive<T>(fn: () => Promise<T>): Promise<T>;
  // Attempts to run now; if busy, returns null and does not queue.
  tryRunExclusive<T>(fn: () => Promise<T>): Promise<T> | null;
  // Clears any queued tasks (does not cancel the currently running one).
  cancelAll(): void;
};

const TaskGateContext = createContext<TaskGate | undefined>(undefined);

export function TaskGateProvider({ children }: { children: React.ReactNode }) {
  const waiters = useRef<Array<() => void>>([]);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);

  const acquire = useCallback((): Promise<void> => {
    if (!locked.current) {
      locked.current = true;
      setBusy(true);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      waiters.current.push(() => {
        locked.current = true;
        setBusy(true);
        resolve();
      });
    });
  }, []);

  const release = useCallback(() => {
    const next = waiters.current.shift();
    if (next) {
      // Hand off lock to the next waiter; busy stays true
      next();
    } else {
      locked.current = false;
      setBusy(false);
    }
  }, []);

  const runExclusive = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }, [acquire, release]);

  const tryRunExclusive = useCallback(<T,>(fn: () => Promise<T>): Promise<T> | null => {
    if (locked.current) return null;
    return runExclusive(fn);
  }, [runExclusive]);

  const cancelAll = useCallback(() => {
    waiters.current = [];
    // Do not change busy here; current task will release and set appropriately
  }, []);

  const value = useMemo<TaskGate>(() => ({ busy, runExclusive, tryRunExclusive, cancelAll }), [busy, runExclusive, tryRunExclusive, cancelAll]);

  return <TaskGateContext.Provider value={value}>{children}</TaskGateContext.Provider>;
}

export function useTaskGate(): TaskGate {
  const ctx = useContext(TaskGateContext);
  if (!ctx) throw new Error("useTaskGate must be used within TaskGateProvider");
  return ctx;
}
