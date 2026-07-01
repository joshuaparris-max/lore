import { useEffect } from 'react';
import { useGameStore, __setForcedD20 } from '../state/gameStore';
import { ORACLE_INTERACTABLE_ID } from '../data/oracleDialogue';

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
      /** Simulate the player standing next to the Oracle (no walking needed). */
      approachOracle: () => void;
      /** Simulate the player leaving the Oracle. */
      leaveOracle: () => void;
      /** Force the next d20 face; pass null to restore real randomness. */
      forceD20: (value: number | null) => void;
      /** The interactable id the `E` handler checks against. */
      oracleId: string;
    };
  }
}

export default function TestBridge(): null {
  useEffect(() => {
    window.__DRIFTERS_TEST__ = {
      store: useGameStore,
      approachOracle: () => useGameStore.getState().setNearbyInteractable(ORACLE_INTERACTABLE_ID),
      leaveOracle: () => useGameStore.getState().setNearbyInteractable(null),
      forceD20: (value) => __setForcedD20(value),
      oracleId: ORACLE_INTERACTABLE_ID,
    };
    return () => {
      __setForcedD20(null);
      delete window.__DRIFTERS_TEST__;
    };
  }, []);

  return null;
}
