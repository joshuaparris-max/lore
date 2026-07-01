import { useEffect, type CSSProperties } from 'react';
import {
  useGameStore,
  type AbilityName,
  type SkillCheckResult,
} from '../state/gameStore';

/**
 * DOM overlays that sit on top of the 3D canvas:
 *   - InteractionPrompt : the "Press E to commune..." hint when near the Oracle.
 *   - DialogueOverlay   : the conversation panel + d20 roll breakdown.
 *
 * These are pure views over the Zustand store — no local narrative state.
 */

const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);
const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const ABILITY_LABELS: Record<AbilityName, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

/* ------------------------------------------------------------------ */
/* "Press E" prompt                                                    */
/* ------------------------------------------------------------------ */

export function InteractionPrompt(): JSX.Element | null {
  const nearbyId = useGameStore((s) => s.nearbyInteractableId);
  const inDialogue = useGameStore((s) => s.activeDialogueNodeId !== null);

  // Only prompt when something is in reach and we're not already talking.
  if (!nearbyId || inDialogue) return null;

  return (
    <div data-testid="interaction-prompt" style={promptStyle}>
      Press <kbd style={kbdStyle}>E</kbd> to commune with the Left Eye Nerve Oracle
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Roll breakdown                                                      */
/* ------------------------------------------------------------------ */

function RollBreakdown({ result }: { result: SkillCheckResult }): JSX.Element {
  const rollColor = result.criticalSuccess
    ? '#7dff9b'
    : result.criticalFailure
      ? '#ff6b6b'
      : '#ffffff';

  return (
    <div data-testid="roll-breakdown" style={rollPanelStyle}>
      <div style={rollHeaderStyle}>
        {ABILITY_LABELS[result.ability]} Check
        {result.criticalSuccess && ' — NATURAL 20!'}
        {result.criticalFailure && ' — NATURAL 1!'}
      </div>
      <ul style={rollListStyle}>
        <li style={rowStyle}>
          <span>d20 roll</span>
          <span data-testid="roll-d20" style={{ color: rollColor, fontWeight: 700 }}>{result.roll}</span>
        </li>
        <li style={rowStyle}>
          <span>Ability modifier</span>
          <span data-testid="roll-modifier">{signed(result.modifier)}</span>
        </li>
        {result.proficiencyBonus > 0 && (
          <li style={rowStyle}>
            <span>Proficiency bonus</span>
            <span data-testid="roll-proficiency">{signed(result.proficiencyBonus)}</span>
          </li>
        )}
        <li style={{ ...rowStyle, ...rollTotalStyle }}>
          <span>Total</span>
          <span data-testid="roll-total">{result.total}</span>
        </li>
        <li style={rowStyle}>
          <span>DC</span>
          <span data-testid="roll-dc">{result.dc}</span>
        </li>
      </ul>
      <div
        data-testid="roll-result"
        style={{ ...rollResultStyle, color: result.success ? '#7dff9b' : '#ff6b6b' }}
      >
        {result.success ? 'SUCCESS' : 'FAILURE'}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialogue panel                                                      */
/* ------------------------------------------------------------------ */

export function DialogueOverlay(): JSX.Element | null {
  const nodeId = useGameStore((s) => s.activeDialogueNodeId);
  const nodes = useGameStore((s) => s.dialogueNodes);
  const lastResult = useGameStore((s) => s.lastCheckResult);
  const reputation = useGameStore((s) => s.reputation);
  const chooseDialogueOption = useGameStore((s) => s.chooseDialogueOption);
  const endDialogue = useGameStore((s) => s.endDialogue);

  // Release the mouse whenever a conversation is open so buttons are clickable.
  useEffect(() => {
    if (nodeId !== null && document.pointerLockElement) document.exitPointerLock();
  }, [nodeId]);

  if (nodeId === null) return null;
  const node = nodes[nodeId];
  if (!node) return null;

  const cultRep = reputation['cult-of-the-left-eye'] ?? 0;

  return (
    <div style={backdropStyle}>
      <div data-testid="dialogue-overlay" style={panelStyle}>
        <div data-testid="dialogue-speaker" style={speakerStyle}>{node.speaker}</div>

        {/* Body preserves the authored line breaks. */}
        <p data-testid="dialogue-body" style={bodyStyle}>{node.body}</p>

        {lastResult && <RollBreakdown result={lastResult} />}

        <div data-testid="dialogue-choices" style={choicesStyle}>
          {node.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              data-testid={`choice-${choice.id}`}
              style={choiceButtonStyle}
              onClick={() => chooseDialogueOption(choice)}
            >
              {choice.label}
              {choice.check && (
                <span style={checkTagStyle}>
                  {titleCase(choice.check.ability)} DC {choice.check.dc}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={footerStyle}>
          <span>
            Cult of the Left Eye:&nbsp;
            <strong data-testid="rep-cult" style={{ color: cultRep >= 0 ? '#7dff9b' : '#ff6b6b' }}>
              {signed(cultRep)}
            </strong>
          </span>
          <button type="button" data-testid="dialogue-close" style={closeButtonStyle} onClick={endDialogue}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (inline to keep the slice self-contained)                    */
/* ------------------------------------------------------------------ */

const promptStyle: CSSProperties = {
  position: 'absolute',
  bottom: '12%',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 18px',
  background: 'rgba(10, 4, 6, 0.8)',
  border: '1px solid #4fc3ff',
  borderRadius: 8,
  color: '#e6f7ff',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  pointerEvents: 'none',
  letterSpacing: 0.3,
};

const kbdStyle: CSSProperties = {
  padding: '2px 8px',
  margin: '0 2px',
  background: '#4fc3ff',
  color: '#001018',
  borderRadius: 4,
  fontWeight: 700,
};

const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '0 0 4vh',
  background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 45%)',
  pointerEvents: 'none', // let the backdrop pass clicks; the panel re-enables them
};

const panelStyle: CSSProperties = {
  pointerEvents: 'auto',
  width: 'min(760px, 92vw)',
  maxHeight: '80vh',
  overflowY: 'auto',
  background: 'rgba(14, 8, 12, 0.96)',
  border: '1px solid #7a2b3f',
  borderRadius: 12,
  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  padding: 24,
  color: '#f2e9ec',
  fontFamily: 'system-ui, sans-serif',
};

const speakerStyle: CSSProperties = {
  color: '#7fdfff',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: 8,
};

const bodyStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.55,
  fontSize: 16,
  margin: '0 0 16px',
};

const choicesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const choiceButtonStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  textAlign: 'left',
  padding: '12px 14px',
  background: 'rgba(122, 43, 63, 0.25)',
  border: '1px solid #7a2b3f',
  borderRadius: 8,
  color: '#f2e9ec',
  fontSize: 15,
  cursor: 'pointer',
};

const checkTagStyle: CSSProperties = {
  flexShrink: 0,
  padding: '3px 8px',
  background: '#4fc3ff',
  color: '#001018',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const rollPanelStyle: CSSProperties = {
  margin: '0 0 16px',
  padding: 14,
  background: 'rgba(0, 16, 24, 0.6)',
  border: '1px solid #2f6d86',
  borderRadius: 8,
};

const rollHeaderStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: '#7fdfff',
  marginBottom: 8,
};

const rollListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
};

// Each breakdown row: label on the left, value on the right.
const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};

const rollTotalStyle: CSSProperties = {
  borderTop: '1px solid #2f6d86',
  marginTop: 4,
  paddingTop: 6,
  fontWeight: 700,
};

const rollResultStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: 2,
  textAlign: 'center',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 18,
  paddingTop: 14,
  borderTop: '1px solid #33232b',
  fontSize: 14,
};

const closeButtonStyle: CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid #7a2b3f',
  borderRadius: 6,
  color: '#f2e9ec',
  cursor: 'pointer',
};
