import { useEffect } from 'react';
import DreadnoughtCortex from './components/DreadnoughtCortex';
import { DialogueOverlay, InteractionPrompt, RoomLabel } from './components/DialogueOverlay';
import TestBridge from './test/TestBridge';
import { useGameStore } from './state/gameStore';
import { allDialogue } from './data/dialogues';

/** True only when the app is opened with `?e2e=1` — gates the test bridge. */
const isE2E = (): boolean =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e');

/**
 * Root of the playable slice: the 3D Cortex fills the viewport, with the
 * dialogue UI + interaction prompt layered on top as absolutely-positioned DOM.
 */
export default function App(): JSX.Element {
  const registerDialogueNodes = useGameStore((s) => s.registerDialogueNodes);

  // Load every NPC's conversation graph into the store once, on mount.
  useEffect(() => {
    registerDialogueNodes(allDialogue);
  }, [registerDialogueNodes]);

  return (
    <div
      data-testid="game-root"
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <DreadnoughtCortex />
      <RoomLabel />
      <InteractionPrompt />
      <DialogueOverlay />
      {isE2E() && <TestBridge />}
    </div>
  );
}
