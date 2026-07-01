import type { DialogueNode } from '../state/gameStore';

/**
 * The Weeping Sinus Warden — melancholic guardian of the foggy Sinus. Node ids
 * are prefixed `sinus-` for global uniqueness. Reputation rides on the Order of
 * the Weeping Sinus.
 */
const ORDER = 'order-of-the-weeping-sinus';

export const wardenDialogue: DialogueNode[] = [
  {
    id: 'sinus-intro',
    speaker: 'The Weeping Sinus Warden',
    body:
      `A tall, dripping figure in sodden robes turns toward you. Everything here is `
      + `damp. The Warden sniffles, monumentally.\n\n`
      + `"Oh. A visitor. How... moving. Welcome to the Weeping Sinus, where the beast's `
      + `sorrows collect and I, fool that I am, keep watch over the puddles. Mind the `
      + `mucus. It has opinions."`,
    choices: [
      { id: 'why', label: 'Why is everything — and everyone — crying?', nextNodeId: 'sinus-why' },
      {
        id: 'comfort',
        label: 'Offer the Warden some heartfelt comfort.',
        nextNodeId: 'sinus-comfort-success',
        check: { ability: 'charisma', dc: 13, proficient: true, failureNodeId: 'sinus-comfort-fail' },
      },
      { id: 'lore', label: 'What is this Sinus, really?', nextNodeId: 'sinus-lore' },
      {
        id: 'sense',
        label: 'Quietly sense the true source of the sorrow.',
        nextNodeId: 'sinus-sense-success',
        check: { ability: 'wisdom', dc: 12, failureNodeId: 'sinus-sense-fail' },
      },
      { id: 'escape', label: 'Is there a dry way out of here?', nextNodeId: 'sinus-escape' },
      { id: 'leave', label: 'I\'ll leave you to your... damp. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-why',
    speaker: 'The Weeping Sinus Warden',
    body:
      `"The Dreadnought dreams, and dreaming, it grieves — for the dimensions it ate, `
      + `for the ones it never will. The tears drain here. I've been standing in the `
      + `beast's feelings for four hundred years. My robes will never be the same."`,
    choices: [
      { id: 'back-intro', label: 'That\'s... a lot to hold.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'Bleak. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-lore',
    speaker: 'The Weeping Sinus Warden',
    body:
      `"The Sinus is the beast's great sorrow-drain, and the Order keeps it from `
      + `overflowing into the Cortex — the Oracle would NEVER stop complaining about `
      + `the damp. We are unloved, unthanked, and extremely moist. It is a calling."`,
    choices: [
      { id: 'more-lore', label: 'What happens if it overflows?', nextNodeId: 'sinus-lore2' },
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'Understood. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-lore2',
    speaker: 'The Weeping Sinus Warden',
    body:
      `"If it overflows? The whole city gets the beast's grief at once. Last time, an `
      + `entire district spent a decade writing sad poetry. We do NOT want a repeat. `
      + `The rhyming alone was a war crime."`,
    choices: [
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'I\'ll help however I can. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-escape',
    speaker: 'The Weeping Sinus Warden',
    body:
      `"A dry way out? In the SINUS? You optimist. Back to the Cortex is your best `
      + `bet — follow the least-sobbing corridor. Take a towel. Take two. Take my `
      + `towel, I've given up."`,
    choices: [
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'Thanks for the towel. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-comfort-success',
    speaker: 'The Weeping Sinus Warden',
    onEnter: { factionId: ORDER, delta: 2 },
    body:
      `"...You know, no one has ever asked how I'M doing. That's — give me a moment — `
      + `that's the kindest thing to happen in this puddle in centuries. The Order `
      + `remembers kindness, drifter. You have a friend among the damp."`,
    choices: [
      { id: 'back-intro', label: 'Any time, Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'Chin up. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-comfort-fail',
    speaker: 'The Weeping Sinus Warden',
    onEnter: { factionId: ORDER, delta: -1 },
    body:
      `"You patted my shoulder, said 'there there,' and got mucus on your sleeve, and `
      + `then made THAT face. I saw it. The Order saw it. Go dry off somewhere else."`,
    choices: [
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'Sorry, Warden. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-sense-success',
    speaker: 'The Weeping Sinus Warden',
    onEnter: { factionId: ORDER, delta: 1 },
    body:
      `"...You feel it too. Beneath the grief, there's a rhythm — the beast isn't only `
      + `sad, it's DREAMING toward something. Few sense that. You have the stillness `
      + `the Order prizes. Keep listening, quiet one."`,
    choices: [
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'I\'ll keep listening. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sinus-sense-fail',
    speaker: 'The Weeping Sinus Warden',
    body:
      `"You closed your eyes, hummed, and then loudly announced you 'sensed a strong `
      + `vibe of wet.' Yes. It is a sinus. Astonishing work, oracle of the obvious."`,
    choices: [
      { id: 'back-intro', label: 'Back to the Warden.', nextNodeId: 'sinus-intro' },
      { id: 'leave', label: 'A strong vibe of wet, indeed. (Leave)', nextNodeId: null },
    ],
  },
];
