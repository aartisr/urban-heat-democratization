/**
 * Reusable React hooks for common patterns
 * Extracted from component logic for maximum reusability
 */

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import type { CityMapData, CityMapOverlay } from "./types";

/**
 * Hook for managing filter state with persistence
 */
export function useFilterState(
  initialValue: string,
  storageKey?: string
): [string, (value: string) => void] {
  const [value, setValue] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      return stored || initialValue;
    }
    return initialValue;
  });

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (storageKey) {
        localStorage.setItem(storageKey, newValue);
      }
    },
    [storageKey]
  );

  return [value, handleChange];
}

/**
 * Hook for managing toggle state
 */
export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setExplicit = useCallback((v: boolean) => setValue(v), []);

  return [value, toggle, setExplicit];
}

/**
 * Hook for managing selected item from a list
 */
export function useSelection<T>(items: T[], getKey: (item: T) => string, initialKey?: string) {
  const [selectedKey, setSelectedKey] = useState(initialKey);

  const selectedItem = useMemo(() => {
    if (!selectedKey) return null;
    return items.find((item) => getKey(item) === selectedKey) || null;
  }, [items, selectedKey, getKey]);

  const select = useCallback((item: T) => {
    setSelectedKey(getKey(item));
  }, [getKey]);

  const clear = useCallback(() => {
    setSelectedKey(undefined);
  }, []);

  return { selectedItem, selectedKey, select, clear };
}

/**
 * Hook for filtering a list with memoization
 */
export function useFilteredList<T>(
  items: T[],
  predicate: (item: T) => boolean,
  dependencies: unknown[] = []
): T[] {
  return useMemo(() => items.filter(predicate), [items, predicate, ...dependencies]);
}

/**
 * Hook for debounced state updates
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook for managing async data loading
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
  dependencies: unknown[] = []
) {
  const [state, setState] = useState<{ loading: boolean; data: T | null; error: Error | null }>({
    loading: immediate,
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ loading: false, data: response, error: null });
    } catch (error) {
      setState({ loading: false, data: null, error: error as Error });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return { ...state, execute };
}

/**
 * Hook for managing form state
 */
export function useFormState<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
      setIsDirty(true);
    },
    []
  );

  const setValue = useCallback((name: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setIsDirty(false);
  }, [initialValues]);

  return { values, isDirty, handleChange, setValue, reset };
}

/**
 * Hook for managing pagination
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  return { paginatedItems, currentPage, totalPages, goToPage };
}

/**
 * Hook for managing undo/redo state
 */
export function useUndoRedo<T>(initialValue: T) {
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const push = useCallback((value: T) => {
    setHistory((prev) => [...prev.slice(0, currentIndex + 1), value]);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) setCurrentIndex((prev) => prev - 1);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) setCurrentIndex((prev) => prev + 1);
  }, [canRedo]);

  const reset = useCallback(() => {
    setHistory([initialValue]);
    setCurrentIndex(0);
  }, [initialValue]);

  return { current, canUndo, canRedo, push, undo, redo, reset };
}

/**
 * Hook for managing viewport size
 */
export function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/**
 * Hook for media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
      return () => mediaQueryList.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Hook for local storage synchronization
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("Failed to save to local storage:", error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Hook for previous value reference
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
