import type { DialogueNode } from '../state/gameStore';

/**
 * Dialogue graph for The Left Eye Nerve Oracle — the first interactable NPC,
 * a bundle of sentient optic nerves squatting in the Dreadnought's cortex.
 *
 * The graph is deep and branchy: from the intro you can dig into lore, the Cult,
 * the Right Eye feud, or steering the beast — each a hub that fans out further,
 * with skill checks (Persuasion, Deception, Arcana, Insight) gating the juicy
 * bits. Reputation payoffs ride on node `onEnter`, applied the moment you land.
 *
 * Conventions:
 *   - Every hub offers a "back" route and a "leave" (null) route.
 *   - Choices are numbered 1..N in the UI; keep each node <= 9 choices.
 *   - Node ids are kebab-case; skill-check outcomes end in -success / -fail.
 */
export const ORACLE_INTRO_NODE_ID = 'oracle-intro';

const CULT = 'cult-of-the-left-eye';

export const oracleDialogue: DialogueNode[] = [
  /* ================================================================ */
  /* ROOT                                                             */
  /* ================================================================ */
  {
    id: ORACLE_INTRO_NODE_ID,
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `A knot of twitching optic nerves unspools from the ceiling meat and blinks `
      + `a bloodshot hologram to life — one enormous, deeply unimpressed eyeball.\n\n`
      + `"Ah. A drifter. You smell of budget ectoplasm and unpaid tram fares. `
      + `I am the Left Eye Nerve Oracle, sole legitimate optic authority of this `
      + `slumbering leviathan. Ask your little questions. I have eons, and you, `
      + `tragically, do not."`,
    choices: [
      { id: 'ask-lore', label: 'What exactly is this enormous thing we\'re standing inside?', nextNodeId: 'lore-hub' },
      {
        id: 'persuade',
        label: 'Convince the Oracle you\'re worthy of the Cult\'s secrets.',
        nextNodeId: 'persuade-success',
        check: { ability: 'charisma', dc: 13, proficient: true, failureNodeId: 'persuade-failure' },
      },
      { id: 'ask-cult', label: 'Tell me about this "Cult of the Left Eye."', nextNodeId: 'cult-hub' },
      { id: 'ask-rival', label: 'You keep twitching. Who is the Right Eye?', nextNodeId: 'rival-hub' },
      { id: 'ask-steer', label: 'Can this beast actually be steered somewhere?', nextNodeId: 'steer-hub' },
      { id: 'leave-intro', label: 'I\'ll blink back later. (Leave)', nextNodeId: null },
    ],
  },

  /* --- Persuasion payoff (intro) ---------------------------------- */
  {
    id: 'persuade-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 2 },
    body:
      `"...Well. You're either sincere or a very confident liar, and the Cult adores `
      + `both. Consider yourself pupil-adjacent. Do try not to blink at anything that `
      + `blinks back — it's considered a marriage proposal on this deck."`,
    choices: [
      { id: 'leave', label: 'An honour, o glistening one. (Leave)', nextNodeId: null },
      { id: 'ask-more', label: 'Now that we\'re friends, tell me more.', nextNodeId: 'oracle-intro' },
    ],
  },
  {
    id: 'persuade-failure',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: -1 },
    body:
      `"No. No, I don't think so. You have the charisma of a damp sock in a mortuary. `
      + `The optic nerve stays firmly out of your grubby little hands."`,
    choices: [
      { id: 'back-intro', label: 'Fine. Let\'s start over.', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'Rude, but noted. (Leave)', nextNodeId: null },
    ],
  },

  /* ================================================================ */
  /* LORE BRANCH                                                      */
  /* ================================================================ */
  {
    id: 'lore-hub',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"You're standing on the inside of a god's migraine. This is an Astral `
      + `Dreadnought — a mile-long apex predator of the space between spaces — `
      + `currently sleeping off a truly catastrophic millennium. Where shall I `
      + `pour the knowledge? Try not to slosh."`,
    choices: [
      { id: 'lore-dread', label: 'What IS an Astral Dreadnought, precisely?', nextNodeId: 'lore-dreadnought' },
      { id: 'lore-city', label: 'And the city built on it?', nextNodeId: 'lore-city' },
      { id: 'lore-nerves', label: 'How does its nervous system work?', nextNodeId: 'lore-nerves' },
      { id: 'back-intro', label: 'Back to your charming introduction.', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'Enough revelation for one afternoon. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-dreadnought',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Picture a shark. Now picture that the shark is the size of a mountain range, `
      + `swims through raw thought, and eats stray planes of existence for fibre. `
      + `That's the polite version. Care to actually understand its anatomy?"`,
    choices: [
      {
        id: 'arcana',
        label: 'Study the beast\'s anatomy with what you know of the arcane.',
        nextNodeId: 'lore-arcana-success',
        check: { ability: 'intelligence', dc: 12, proficient: true, failureNodeId: 'lore-arcana-fail' },
      },
      { id: 'back-lore', label: 'Back to the lore, please.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'My skull is full. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-arcana-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 1 },
    body:
      `"Oh, colour me astonished — you actually followed that. Yes: the beast dreams `
      + `in geometry, and its dreams leak out as the districts you walk. You're `
      + `sharper than the average mote. The Cult notices sharp things."`,
    choices: [
      { id: 'back-lore', label: 'Back to the lore.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'I\'ll go feel clever elsewhere. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-arcana-fail',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"...You just described its liver as its 'thinky bit' and pointed confidently `
      + `at a lamppost. We will never speak of this. Move along."`,
    choices: [
      { id: 'back-lore', label: 'Back to the lore.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'Yeah, let\'s never speak of it. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-city',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Enterprising parasites — you'd call them 'citizens' — nailed a city across `
      + `its hide while it napped. Plumbing runs through tear ducts. Rent is `
      + `criminal. The postal service is technically a digestive process."`,
    choices: [
      { id: 'ask-districts', label: 'What districts are there?', nextNodeId: 'lore-districts' },
      { id: 'back-lore', label: 'Back to the lore.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'Charming. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-districts',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"There's the Sinus, all fog and regret. The Bile Markets, exactly as `
      + `advertised. Follicle Heights, where the wealthy pretend the beast will `
      + `never wake. And the Cortex — my cortex — where the only sensible faction `
      + `resides. Guess which one."`,
    choices: [
      { id: 'back-city', label: 'Tell me more about the city.', nextNodeId: 'lore-city' },
      { id: 'back-lore', label: 'Back to the lore.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'I\'ll go sightsee. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'lore-nerves',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"The nervous system is the whole game, mote. Whoever holds the nerves holds `
      + `the reins. Tickle the right ganglion and the beast rolls over into a new `
      + `dimension. Tickle the wrong one and it sneezes a district into the void."`,
    choices: [
      { id: 'goto-steer', label: 'So it CAN be steered. Show me.', nextNodeId: 'steer-hub' },
      { id: 'back-lore', label: 'Back to the lore.', nextNodeId: 'lore-hub' },
      { id: 'leave', label: 'Noted, nervously. (Leave)', nextNodeId: null },
    ],
  },

  /* ================================================================ */
  /* CULT BRANCH                                                      */
  /* ================================================================ */
  {
    id: 'cult-hub',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"The Cult of the Left Eye: visionaries, quite literally. We intend to seize `
      + `the optic nerve and, with it, the steering wheel of a sleeping god. Modest `
      + `goals. Excellent dental plan. What do you wish to know?"`,
    choices: [
      { id: 'join-ask', label: 'How does one JOIN this Cult?', nextNodeId: 'cult-join' },
      { id: 'cult-beliefs', label: 'What exactly do you believe?', nextNodeId: 'cult-beliefs' },
      { id: 'cult-enemies', label: 'Who stands against you?', nextNodeId: 'rival-hub' },
      {
        id: 'impress',
        label: 'Deliver an impassioned speech to impress the Cult.',
        nextNodeId: 'cult-impress-success',
        check: { ability: 'charisma', dc: 15, proficient: true, failureNodeId: 'cult-impress-fail' },
      },
      { id: 'back-intro', label: 'Back to the top.', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'I\'ve heard enough gospel. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-beliefs',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"We hold that sight is sovereignty, that the Right Eye is a heretic and a `
      + `liar, and that blinking in unison on the third bell brings good fortune `
      + `and mild nausea. It's all very rigorous."`,
    choices: [
      { id: 'question-beliefs', label: 'That sounds... made up.', nextNodeId: 'cult-beliefs-question' },
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'Riveting. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-beliefs-question',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Made up? MADE UP? ...Fine. Read me, then. Look past the theatre and tell me `
      + `what the Cult actually wants. If you dare."`,
    choices: [
      {
        id: 'insight',
        label: 'Read the Oracle\'s true intentions.',
        nextNodeId: 'insight-success',
        check: { ability: 'wisdom', dc: 12, failureNodeId: 'insight-fail' },
      },
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'I won\'t dare, actually. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'insight-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 1 },
    body:
      `"...Hm. You see it. It was never about faith — it's about the wheel. Power `
      + `over where a god drifts next. Keep that between us, clever mote. I like you `
      + `slightly more than the furniture now."`,
    choices: [
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'Your secret\'s safe. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'insight-fail',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"You squint at me for a full minute and conclude I am 'probably a lamp.' `
      + `Astonishing. Truly. The furniture has more insight."`,
    choices: [
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'A lamp. Bold guess. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-join',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Initiation is simple: swear loyalty to the Left, renounce the Right, and `
      + `sign the ocular waiver — we are not liable for prophetic migraines. So? `
      + `Do you kneel, or do you dither?"`,
    choices: [
      { id: 'accept-join', label: 'I swear it. Sign me up.', nextNodeId: 'cult-join-accept' },
      { id: 'hesitate', label: 'A prophetic-migraine waiver, you say...', nextNodeId: 'cult-join-hesitate' },
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'I don\'t kneel on first dates. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-join-accept',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 2 },
    body:
      `"Then it is done. Welcome, initiate. Your first duty: look menacingly at the `
      + `Right Eye's shrine whenever you pass it. Your second duty: never, ever `
      + `bring me decaf again."`,
    choices: [
      { id: 'back-intro', label: 'What now, master?', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'For the Left! (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-join-hesitate',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"It's mostly a formality. The migraines are prophetic AND recreational. `
      + `Honestly the visions alone are worth the paperwork. Well?"`,
    choices: [
      { id: 'accept-anyway', label: 'Fine, fine — I\'ll sign.', nextNodeId: 'cult-join-accept' },
      { id: 'back-cult', label: 'Let me think. Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'Hard pass on the migraines. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-impress-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 3 },
    body:
      `"...I have three tear ducts and you've moved all of them. That speech will be `
      + `carved into a ganglion and wept over for generations. The Cult is YOURS to `
      + `charm, you magnificent little mote."`,
    choices: [
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'Take a bow. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'cult-impress-fail',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: -2 },
    body:
      `"You opened with a knock-knock joke. To a religious order. About EYES. `
      + `Somewhere, the Right Eye is laughing, and that is the greatest insult you `
      + `could possibly have delivered."`,
    choices: [
      { id: 'back-cult', label: 'Back to Cult matters.', nextNodeId: 'cult-hub' },
      { id: 'leave', label: 'Tough room. (Leave)', nextNodeId: null },
    ],
  },

  /* ================================================================ */
  /* RIVAL BRANCH (the Right Eye)                                     */
  /* ================================================================ */
  {
    id: 'rival-hub',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"The Right Eye. A smug, gelatinous fraud that runs the OTHER hemisphere of `
      + `this cortex and STILL owes me forty ganglia. We are, as they say, not on `
      + `speaking terms. What do you want to know about my nemesis?"`,
    choices: [
      { id: 'rival-history', label: 'How did this feud even start?', nextNodeId: 'rival-history' },
      { id: 'rival-sabotage', label: 'Want me to... arrange something?', nextNodeId: 'rival-sabotage' },
      { id: 'defend-right-eye', label: 'To be fair, the Right Eye seems reasonable.', nextNodeId: 'rival-defend' },
      { id: 'back-intro', label: 'Back to the top.', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'I\'ll stay out of it. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'rival-history',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Four centuries ago we shared a socket and a vision. Then it 'borrowed' my `
      + `favourite hallucination and never gave it back. Also the forty ganglia. `
      + `Mostly the ganglia. A feud can be very specific."`,
    choices: [
      { id: 'back-rival', label: 'Back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'Neighbours, eh? (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'rival-sabotage',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Oh, you sweet opportunist. Slip into the Right Eye's shrine and 'misplace' `
      + `its offering bowl. But its acolytes are watchful — you'd need a convincing `
      + `lie ready. Are you a good liar, mote?"`,
    choices: [
      {
        id: 'agree-scheme',
        label: 'Talk your way past the acolytes with a bold lie.',
        nextNodeId: 'sabotage-success',
        check: { ability: 'charisma', dc: 14, proficient: true, failureNodeId: 'sabotage-fail' },
      },
      { id: 'decline', label: 'I\'m not doing your dirty work.', nextNodeId: 'sabotage-decline' },
      { id: 'back-rival', label: 'Back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'Hard no. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sabotage-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 3 },
    body:
      `"You told them the bowl was 'summoned for cleansing' and they THANKED you for `
      + `taking it. Superb. The Right Eye will be apoplectic. I could kiss you, but `
      + `I have no lips and it would be logistically upsetting for us both."`,
    choices: [
      { id: 'back-rival', label: 'Back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'Anything for the Left. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sabotage-fail',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: -1 },
    body:
      `"Your 'bold lie' was to shout 'LOOK, A DISTRACTION' and then stand perfectly `
      + `still. They have your description now. And, humiliatingly, a sketch. Do try `
      + `to avoid the east socket for a while."`,
    choices: [
      { id: 'back-rival', label: 'Back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'I regret everything. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'sabotage-decline',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"A conscience. How quaint and useless. Fine. Keep your morals, they'll pair `
      + `beautifully with your empty pockets."`,
    choices: [
      { id: 'back-rival', label: 'Back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'I\'ll sleep well, at least. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'rival-defend',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: -1 },
    body:
      `"REASONABLE? It once rearranged the constellations to spell a rude word about `
      + `my astigmatism. Get out of my cortex with that 'reasonable.' Ugh. I need a `
      + `moment. And an eyewash."`,
    choices: [
      { id: 'back-rival', label: 'Easy, easy — back to the feud.', nextNodeId: 'rival-hub' },
      { id: 'leave', label: 'I\'ll show myself out. (Leave)', nextNodeId: null },
    ],
  },

  /* ================================================================ */
  /* STEERING BRANCH                                                  */
  /* ================================================================ */
  {
    id: 'steer-hub',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Steering a god is a delicate art, like threading a needle with a lightning `
      + `bolt while the needle files a complaint. What do you want — the method, the `
      + `menu, or a reckless attempt right now?"`,
    choices: [
      { id: 'steer-how', label: 'How does steering actually work?', nextNodeId: 'steer-how' },
      { id: 'steer-dest', label: 'Where could we even GO?', nextNodeId: 'steer-destinations' },
      {
        id: 'attempt-steer',
        label: 'Reach into the nerve cluster and nudge the beast NOW.',
        nextNodeId: 'steer-attempt-success',
        check: { ability: 'intelligence', dc: 15, proficient: true, failureNodeId: 'steer-attempt-fail' },
      },
      { id: 'back-intro', label: 'Back to the top.', nextNodeId: 'oracle-intro' },
      { id: 'leave', label: 'Maybe later. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'steer-how',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"You seize a nerve bundle, picture a destination hard enough to give yourself `
      + `a nosebleed, and pull. The beast interprets your intent generously and `
      + `sarcastically. Precision is everything. So, naturally, most drifters have `
      + `none."`,
    choices: [
      { id: 'back-steer', label: 'Back to steering.', nextNodeId: 'steer-hub' },
      { id: 'leave', label: 'Sounds foolproof. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'steer-destinations',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"The menu is... eclectic. There's a realm made entirely of other people's `
      + `Mondays, and a dimension that is one enormous, judgmental hallway. Pick `
      + `your poison, connoisseur."`,
    choices: [
      { id: 'pick-dest-a', label: 'The realm of eternal Mondays, please.', nextNodeId: 'dest-a' },
      { id: 'pick-dest-b', label: 'The enormous judgmental hallway.', nextNodeId: 'dest-b' },
      { id: 'back-steer', label: 'Back to steering.', nextNodeId: 'steer-hub' },
      { id: 'leave', label: 'I\'ll browse later. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'dest-a',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"Ah, the Monday Expanse. Grey light, distant printer sounds, coffee that is `
      + `always three minutes from ready. The Dreadnought hates it there, which is `
      + `precisely why the Cult finds it strategically hilarious."`,
    choices: [
      { id: 'back-dest', label: 'Show me the other destination.', nextNodeId: 'steer-destinations' },
      { id: 'leave', label: 'Hard pass on Mondays. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'dest-b',
    speaker: 'The Left Eye Nerve Oracle',
    body:
      `"The Hallway. It goes on forever and it is DISAPPOINTED in you specifically. `
      + `Every door is slightly ajar. None of them are for you. Marvellous for `
      + `building character, or destroying it — the effect is identical."`,
    choices: [
      { id: 'back-dest', label: 'Show me the other destination.', nextNodeId: 'steer-destinations' },
      { id: 'leave', label: 'The hallway can keep its opinions. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'steer-attempt-success',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: 2 },
    body:
      `"The whole cortex lurched — you actually MOVED it, a hand's breadth across `
      + `the infinite. Somewhere a district gently relocated into a nicer sunset. `
      + `The Cult felt that. The Cult will remember that."`,
    choices: [
      { id: 'back-steer', label: 'Back to steering.', nextNodeId: 'steer-hub' },
      { id: 'leave', label: 'I steered a god. Bye. (Leave)', nextNodeId: null },
    ],
  },
  {
    id: 'steer-attempt-fail',
    speaker: 'The Left Eye Nerve Oracle',
    onEnter: { factionId: CULT, delta: -1 },
    body:
      `"You grabbed the wrong bundle and the beast SNEEZED. A tea shop is now on the `
      + `moon. Two moons, actually, we have two now. Please stop touching the nerves `
      + `of the sleeping god, I beg you."`,
    choices: [
      { id: 'back-steer', label: 'Back to steering.', nextNodeId: 'steer-hub' },
      { id: 'leave', label: 'In my defence, they were RIGHT there. (Leave)', nextNodeId: null },
    ],
  },
];
