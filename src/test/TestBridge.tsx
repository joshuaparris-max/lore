import { useEffect } from 'react';
import { useGameStore, __setForcedD20 } from '../state/gameStore';

const ORACLE_ID = 'oracle';

/**
 * Test-only bridge for Playwright.
 *
 * Mounted ONLY when the URL carries `?e2e=1` (see App.tsx), so it never attaches
 * in a normal user session. It gives the test runner a deterministic handle on
 * game state — enough to skip the hard-to-automate 3D bits (pointer-lock + WASD
 * walking) while still exercising the *real* dialogue/skill-check/reputation UI
 * and the real `E`-to-interact keyboard handler.
 */
declare global {
  interface Window {
    __DRIFTERS_TEST__?: {
      /** The live Zustand store (getState / setState / subscribe). */
      store: typeof useGameStore;
      /** Simulate the player standing next to any interactable (no walking needed). */
      approach: (interactableId: string) => void;
      /** Convenience: stand next to the Oracle. */
      approachOracle: () => void;
      /** Simulate the player leaving all interactables. */
      leaveOracle: () => void;
      /** Force the next d20 face; pass null to restore real randomness. */
      forceD20: (value: number | null) => void;
      /** The Oracle interactable id the `E` handler checks against. */
      oracleId: string;
    };
  }
}

export default function TestBridge(): null {
  useEffect(() => {
    window.__DRIFTERS_TEST__ = {
      store: useGameStore,
      approach: (id) => useGameStore.getState().setNearbyInteractable(id),
      approachOracle: () => useGameStore.getState().setNearbyInteractable(ORACLE_ID),
      leaveOracle: () => useGameStore.getState().setNearbyInteractable(null),
      forceD20: (value) => __setForcedD20(value),
      oracleId: ORACLE_ID,
    };
    return () => {
      __setForcedD20(null);
      delete window.__DRIFTERS_TEST__;
    };
  }, []);

  return null;
}
