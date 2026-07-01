import { create } from 'zustand';

/**
 * Core narrative + mechanics store for Dreadnought Drifters.
 * Owns three concerns:
 *   1. Player ability scores (the numbers behind every d20 skill check).
 *   2. Faction reputation (how the absurd factions currently feel about you).
 *   3. Dialogue state (which conversation node is active right now).
 *
 * The d20 skill-check engine is modelled on the D&D 5e OGL: roll a d20, add the
 * relevant ability modifier (+ proficiency if proficient), compare against a DC.
 */

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/** The six classic 5e abilities. Scores are raw (e.g. 8-20), not modifiers. */
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type AbilityName = keyof AbilityScores;

/** A single branch a player can take out of a dialogue node. */
export interface DialogueChoice {
  id: string;
  /** Text shown on the button. */
  label: string;
  /** Node to travel to when picked. `null` closes the conversation. */
  nextNodeId: string | null;
  /** Optional gated skill check. If present, resolve before travelling. */
  check?: {
    ability: AbilityName;
    dc: number;
    /** Add proficiency bonus to this check. */
    proficient?: boolean;
    /** Node to jump to on a failed check (falls back to nextNodeId). */
    failureNodeId?: string | null;
  };
}

/** A reputation change with a named faction. */
export interface ReputationEffect {
  factionId: string;
  delta: number;
}

/** A node in the branching dialogue graph. */
export interface DialogueNode {
  id: string;
  /** Who is talking (e.g. "High Ocularist of the Left Eye"). */
  speaker: string;
  body: string;
  choices: DialogueChoice[];
  /** Applied once, the moment this node becomes active (e.g. skill-check payoff). */
  onEnter?: ReputationEffect;
}

/** Reputation keyed by faction id. Positive = friendly, negative = hostile. */
export type FactionReputation = Record<string, number>;

/** Fully-resolved outcome of a single d20 skill check. */
export interface SkillCheckResult {
  ability: AbilityName;
  /** Natural d20 face (1-20), before modifiers. */
  roll: number;
  /** Ability modifier applied. */
  modifier: number;
  /** Proficiency bonus applied (0 when not proficient). */
  proficiencyBonus: number;
  /** roll + modifier + proficiencyBonus. */
  total: number;
  dc: number;
  success: boolean;
  /** Natural 20. */
  criticalSuccess: boolean;
  /** Natural 1. */
  criticalFailure: boolean;
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

interface GameState {
  /* --- Player --- */
  abilities: AbilityScores;
  proficiencyBonus: number;

  /* --- Factions --- */
  reputation: FactionReputation;

  /* --- Dialogue --- */
  /** id of the active node, or null when no conversation is open. */
  activeDialogueNodeId: string | null;
  /** Full node graph, keyed by id. */
  dialogueNodes: Record<string, DialogueNode>;
  /** The most recent skill-check outcome, kept on screen until dialogue closes. */
  lastCheckResult: SkillCheckResult | null;

  /* --- World interaction --- */
  /** id of the interactable the player is currently standing next to (or null). */
  nearbyInteractableId: string | null;
  /** True once the 3D controller has mounted and keyboard input is live. */
  isSceneReady: boolean;
  /** id of the room the player is currently in. */
  currentRoomId: string;

  /* --- Actions --- */
  setActiveDialogueNode: (nodeId: string | null) => void;
  registerDialogueNodes: (nodes: DialogueNode[]) => void;
  adjustReputation: (factionId: string, delta: number) => void;
  setAbility: (ability: AbilityName, score: number) => void;
  /** Roll a d20 skill check against a DC. Pure w.r.t. state (reads abilities only). */
  rollSkillCheck: (
    ability: AbilityName,
    dc: number,
    options?: { proficient?: boolean; mode?: RollMode },
  ) => SkillCheckResult;
  /** Open a conversation at `nodeId`, clearing any prior roll and applying onEnter. */
  startDialogue: (nodeId: string) => void;
  /** Resolve a player's choice: roll any gated check, apply effects, travel on. */
  chooseDialogueOption: (choice: DialogueChoice) => void;
  /** Close the conversation and clear transient dialogue state. */
  endDialogue: () => void;
  /** Flag/unflag the interactable within reach of the player. */
  setNearbyInteractable: (id: string | null) => void;
  /** Mark the 3D scene/controller as mounted (input live) or torn down. */
  setSceneReady: (ready: boolean) => void;
  /** Move the player to another room. */
  setCurrentRoom: (roomId: string) => void;
  /** @internal Move to a node and fire its onEnter effect. Use the actions above. */
  _travelTo: (nodeId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Pure helpers (exported for unit testing)                            */
/* ------------------------------------------------------------------ */

/** 5e ability modifier: floor((score - 10) / 2). */
export const abilityModifier = (score: number): number => Math.floor((score - 10) / 2);

/** Roll a single die with `sides` faces. Injectable rng keeps this testable. */
export const rollDie = (sides: number, rng: () => number = Math.random): number =>
  Math.floor(rng() * sides) + 1;

/* ------------------------------------------------------------------ */
/* Test-only deterministic roll override                              */
/* ------------------------------------------------------------------ */
/**
 * Defaults to null (pure randomness in production). Only ever set via
 * `__setForcedD20`, which is called exclusively by the `?e2e=1` TestBridge —
 * so a normal user session never touches it. Kept here (rather than in the
 * store object) so it can't accidentally leak into serialized game state.
 */
let forcedD20: number | null = null;

/** @internal Force the next d20 face(s). Pass null to restore randomness. */
export const __setForcedD20 = (value: number | null): void => {
  forcedD20 = value;
};

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export const useGameStore = create<GameState>((set, get) => ({
  // A serviceable "level 1 adventurer" default; character creation overrides later.
  abilities: {
    strength: 10,
    dexterity: 12,
    constitution: 11,
    intelligence: 13,
    wisdom: 9,
    charisma: 15,
  },
  proficiencyBonus: 2,

  // Seed the known factions so the reputation panel shows standings from the
  // start. Keys must match the ids used by dialogue onEnter effects.
  reputation: {
    'cult-of-the-left-eye': 0,
    'bile-merchants-guild': 0,
    'order-of-the-weeping-sinus': 0,
  },

  activeDialogueNodeId: null,
  dialogueNodes: {},
  lastCheckResult: null,

  nearbyInteractableId: null,
  isSceneReady: false,
  currentRoomId: 'cortex',

  setActiveDialogueNode: (nodeId) => set({ activeDialogueNodeId: nodeId }),

  registerDialogueNodes: (nodes) =>
    set((state) => ({
      dialogueNodes: nodes.reduce(
        (acc, node) => {
          acc[node.id] = node;
          return acc;
        },
        { ...state.dialogueNodes },
      ),
    })),

  adjustReputation: (factionId, delta) =>
    set((state) => ({
      reputation: {
        ...state.reputation,
        [factionId]: (state.reputation[factionId] ?? 0) + delta,
      },
    })),

  setAbility: (ability, score) =>
    set((state) => ({
      abilities: { ...state.abilities, [ability]: score },
    })),

  rollSkillCheck: (ability, dc, options = {}) => {
    const { proficient = false, mode = 'normal' } = options;
    const { abilities, proficiencyBonus } = get();

    // Advantage/disadvantage: roll twice, keep the better/worse natural d20.
    // `forcedD20` is null in production, so this is a plain random roll.
    const rollOnce = (): number => forcedD20 ?? rollDie(20);
    const first = rollOnce();
    const second = rollOnce();
    let roll = first;
    if (mode === 'advantage') roll = Math.max(first, second);
    else if (mode === 'disadvantage') roll = Math.min(first, second);

    const modifier = abilityModifier(abilities[ability]);
    const bonus = proficient ? proficiencyBonus : 0;
    const total = roll + modifier + bonus;

    return {
      ability,
      roll,
      modifier,
      proficiencyBonus: bonus,
      total,
      dc,
      // Nat 20 always succeeds, nat 1 always fails (standard table convention).
      success: roll === 20 ? true : roll === 1 ? false : total >= dc,
      criticalSuccess: roll === 20,
      criticalFailure: roll === 1,
    };
  },

  startDialogue: (nodeId) => {
    // A fresh conversation always begins with no lingering roll on screen.
    set({ activeDialogueNodeId: nodeId, lastCheckResult: null });
    // Apply the opening node's reputation payoff, if any.
    const node = get().dialogueNodes[nodeId];
    if (node?.onEnter) get().adjustReputation(node.onEnter.factionId, node.onEnter.delta);
  },

  chooseDialogueOption: (choice) => {
    const { check, nextNodeId } = choice;

    // Non-check branch: just travel (or close), dropping any prior roll.
    if (!check) {
      set({ lastCheckResult: null });
      if (nextNodeId === null) {
        get().endDialogue();
        return;
      }
      get()._travelTo(nextNodeId);
      return;
    }

    // Gated branch: roll the d20, keep the breakdown visible, then route.
    const result = get().rollSkillCheck(check.ability, check.dc, { proficient: check.proficient });
    set({ lastCheckResult: result });

    const target = result.success ? nextNodeId : (check.failureNodeId ?? nextNodeId);
    if (target === null) {
      set({ activeDialogueNodeId: null }); // close, but preserve the visible result
      return;
    }
    get()._travelTo(target);
  },

  endDialogue: () => set({ activeDialogueNodeId: null, lastCheckResult: null }),

  setNearbyInteractable: (id) => set({ nearbyInteractableId: id }),

  setSceneReady: (ready) => set({ isSceneReady: ready }),

  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

  // Internal: move to a node and fire its onEnter effect exactly once per entry.
  _travelTo: (nodeId: string) => {
    const node = get().dialogueNodes[nodeId];
    if (node?.onEnter) get().adjustReputation(node.onEnter.factionId, node.onEnter.delta);
    set({ activeDialogueNodeId: nodeId });
  },
}));
