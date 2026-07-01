import type { DialogueNode } from '../state/gameStore';

/**
 * Gurgle, Purveyor of Viscera — the Bile Markets merchant. All node ids are
 * prefixed `gurgle-` so they never collide in the global dialogue registry.
 * Reputation rides on the Bile Merchants' Guild.
 */
const GUILD = 'bile-merchants-guild';

export const gurgleDialogue: DialogueNode[] = [
  {
    id: 'gurgle-intro',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `A barrel-shaped creature with too many elbows leans over a stall glistening `
      + `with wares you'd rather not identify. It beams, wetly.\n\n`
      + `"Welcome, welcome, fresh meat — figuratively! Mostly! Gurgle's got the `
      + `finest offal this side of the pancreas. Buy something before it evolves."`,
    choices: [
      { id: 'wares', label: 'Show me what you\'re selling.', nextNodeId: 'gurgle-wares' },
      {
        id: 'haggle',
        label: 'Haggle Gurgle down to a fair price.',
        nextNodeId: 'gurgle-haggle-success',
        check: { ability: 'charisma', dc: 14, proficient: true, failureNodeId: 'gurgle-haggle-fail' },
      },
      { id: 'market', label: 'What is this place, exactly?', nextNodeId: 'gurgle-market' },
      {
        id: 'inspect',
        label: 'Squint at that suspicious jar and appraise it.',
        nextNodeId: 'gurgle-inspect-success',
        check: { ability: 'intelligence', dc: 13, proficient: true, failureNodeId: 'gurgle-inspect-fail' },
      },
      { id: 'gossip', label: 'Heard anything about the Oracle upstairs?', nextNodeId: 'gurgle-gossip' },
      { id: 'leave', label: 'I\'m just browsing. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-wares',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"Feast your eyes — I have three — on the merchandise! Bottled second-thoughts, `
      + `a still-warm opinion, and a spleen that plays a little tune if you frighten `
      + `it. Also cheese. Don't ask which of these is the cheese."`,
    choices: [
      { id: 'buy', label: 'I\'ll take the musical spleen.', nextNodeId: 'gurgle-buy' },
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'On second thought... (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-buy',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"EXCELLENT choice! It only plays sea shanties and it's terrified of Tuesdays. `
      + `A bargain at any price, which is fortunate, because I haven't decided on one `
      + `yet. Come back when I've stopped weeping about parting with it."`,
    choices: [
      { id: 'back-wares', label: 'Show me the other wares.', nextNodeId: 'gurgle-wares' },
      { id: 'leave', label: 'A pleasure, Gurgle. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-market',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"The Bile Markets! Built in a fold of the beast's stomach lining, so the `
      + `rent's cheap and the acid's free. When the Dreadnought digests, we call it `
      + `'a sale.' Everything must go, usually into a vat. What else, friend?"`,
    choices: [
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'Cosy. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-gossip',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"The Oracle? Oh, that twitchy eyeball owes me for a crate of premium tears — `
      + `great for pastry. Between us, the whole Cult's just squabbling optic nerves `
      + `and grand ambitions. Bad for the soul, GREAT for my sales."`,
    choices: [
      { id: 'more-gossip', label: 'Tell me more of this delicious drama.', nextNodeId: 'gurgle-gossip2' },
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'Juicy. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-gossip2',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"Word is the Cult wants to STEER the beast. Imagine! If they crash us into a `
      + `nicer dimension, property values SOAR. If they crash us into a worse one, `
      + `well — I sell disaster supplies too. I win either way. I love it here."`,
    choices: [
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'Terrifyingly savvy. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-haggle-success',
    speaker: 'Gurgle, Purveyor of Viscera',
    onEnter: { factionId: GUILD, delta: 2 },
    body:
      `"...Fine! FINE. You drive a hard bargain and I respect it enormously. Half `
      + `price, and I'll throw in a complimentary regret. The Guild likes a haggler `
      + `— you've got a friend in the offal trade now."`,
    choices: [
      { id: 'back-intro', label: 'Pleasure doing business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'Ta! (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-haggle-fail',
    speaker: 'Gurgle, Purveyor of Viscera',
    onEnter: { factionId: GUILD, delta: -1 },
    body:
      `"You offered me a button and a firm handshake. A BUTTON. Get out of my stall `
      + `before I price YOU by the pound. The Guild will hear about this insult."`,
    choices: [
      { id: 'back-intro', label: 'Let\'s pretend that didn\'t happen.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'Worth a shot. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-inspect-success',
    speaker: 'Gurgle, Purveyor of Viscera',
    onEnter: { factionId: GUILD, delta: 1 },
    body:
      `"Sharp eye! That jar's a genuine pickled premonition — worth a fortune, and `
      + `you spotted it in a heartbeat. Tell you what, I like a customer who knows `
      + `their viscera. Consider yourself Guild-adjacent."`,
    choices: [
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'I do have a gift. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'gurgle-inspect-fail',
    speaker: 'Gurgle, Purveyor of Viscera',
    body:
      `"You picked it up, sniffed it, and declared it 'probably jam.' It is now `
      + `bonded to your hand and mildly psychic. No refunds on curses, friend."`,
    choices: [
      { id: 'back-intro', label: 'Back to business.', nextNodeId: 'gurgle-intro' },
      { id: 'leave', label: 'I\'ll keep the psychic jam. (Leave)', nextNodeId: null },
    ],
  },
];
