import { useEffect, useState } from "react";

import { defaultPersonaMode, normalizePersonaModeId, type PersonaModeId } from "./persona-modes";

const STORAGE_KEY = "uhd.active-persona-mode";

export function useActivePersonaMode() {
  const [activeModeId, setActiveModeId] = useState<PersonaModeId>(defaultPersonaMode);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setActiveModeId(normalizePersonaModeId(stored));
    } catch {
      setActiveModeId(defaultPersonaMode);
    }
  }, []);

  const setMode = (nextModeId: PersonaModeId) => {
    setActiveModeId(nextModeId);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextModeId);
    } catch {
      // Ignore storage failures in restrictive contexts.
    }
  };

  return {
    activeModeId,
    setMode,
  };
}
