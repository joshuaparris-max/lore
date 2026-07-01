import type { DialogueNode } from '../state/gameStore';

/**
 * Dialogue graph for The Left Eye Nerve Oracle — the first interactable NPC,
 * a bundle of sentient optic nerves squatting in the Dreadnought's cortex.
 *
 * Node ids used elsewhere:
 *   - 'oracle-intro'   : entry point (see DreadnoughtCortex `E` handler)
 *   - 'oracle-success' / 'oracle-failure' carry the reputation payoff via onEnter.
 */
export const ORACLE_INTRO_NODE_ID = 'oracle-intro';

/** Stable id for the Oracle interactable — shared by the 3D object, the
 *  proximity check, and (in tests) the deterministic "approach" helper. */
export const ORACLE_INTERACTABLE_ID = 'left-eye-nerve-oracle';

export const oracleDialogue: DialogueNode[] = [
  {
    id: ORACLE_INTRO_NODE_ID,
    speaker: 'The Left Eye Nerve Oracle',
    body:
      'A knot of twitching optic nerves unspools from the ceiling meat and blinks '
      + 'a bloodshot hologram to life — one enormous, deeply unimpressed eyeball.\n\n'
      + '"Ah. A drifter. You smell of budget ectoplasm and unpaid tram fares. '
      + 'I am the Left Eye Nerve Oracle, sole legitimate optic authority of this '
      + 'slumbering leviathan. Do NOT bring up the Right Eye. We are not on speaking '
      + 'terms, and it owes me forty ganglia."',
    choices: [
      {
        id: 'ask-lore',
        label: 'So... what exactly is this enormous thing we\'re all standing inside?',
        nextNodeId: 'oracle-lore',
      },
      {
        id: 'persuade',
        label: '(Persuasion) Convince the Oracle you\'re worthy of the Cult\'s secrets.',
        nextNodeId: 'oracle-success',
        check: {
          ability: 'charisma',
          dc: 13,
          proficient: true,
          failureNodeId: 'oracle-failure',
        },
      },
      {
        id: 'leave-intro',
        label: 'I\'ll blink back later. (Leave)',
        nextNodeId: null,
      },
    ],
  },
  {
    id: 'oracle-lore',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      '"You\'re standing on the inside of a god\'s migraine, mote. This is an Astral '
      + 'Dreadnought — a mile-long apex predator of the space between spaces — currently '
      + 'sleeping off what I can only describe as a truly catastrophic millennium. '
      + 'Some enterprising parasites (you would call them \'citizens\') built a city '
      + 'across its nervous system. We in the Cult of the Left Eye simply intend to '
      + 'seize the optic nerve, and thus the steering wheel. Modest goals. Great dental plan."',
    choices: [
      {
        id: 'back-to-intro',
        label: 'Back to your... charming introduction.',
        nextNodeId: ORACLE_INTRO_NODE_ID,
      },
      {
        id: 'leave-lore',
        label: 'That is quite enough revelation for one afternoon. (Leave)',
        nextNodeId: null,
      },
    ],
  },
  {
    id: 'oracle-success',
    speaker: 'The Left Eye Nerve Oracle',
    // Reputation payoff fires automatically the instant this node opens.
    onEnter: { factionId: 'cult-of-the-left-eye', delta: 2 },
    body:
      '"...Well. You\'re either sincere or a very confident liar, and the Cult adores '
      + 'both. Consider yourself pupil-adjacent. Do try not to blink at anything '
      + 'that blinks back — it\'s considered a marriage proposal on this deck."',
    choices: [
      {
        id: 'leave-success',
        label: 'An honour, o glistening one. (Leave)',
        nextNodeId: null,
      },
    ],
  },
  {
    id: 'oracle-failure',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: 'cult-of-the-left-eye', delta: -1 },
    body:
      '"No. No, I don\'t think so. You have the charisma of a damp sock in a mortuary. '
      + 'The optic nerve stays firmly out of your grubby little hands. Now shoo, before '
      + 'I have you reclassified as earwax."',
    choices: [
      {
        id: 'leave-failure',
        label: 'Rude, but noted. (Leave)',
        nextNodeId: null,
      },
    ],
  },
];
