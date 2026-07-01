import type { DialogueNode } from '../state/gameStore';

/**
 * World definition: the rooms of the Dreadnought and the interactables in them.
 *
 * Everything the 3D scene renders and everything the "E" handler acts on is
 * driven by this data — adding a room or NPC is a data edit, not a code change.
 * Interactables come in two kinds:
 *   - npc  : opens a dialogue tree (by `dialogueId`).
 *   - door : moves the player to another room (`targetRoomId`).
 */

export type Vec3 = [number, number, number];

interface BaseInteractable {
  id: string;
  label: string;
  position: Vec3;
  color: string;
  /** Interaction range in world units (defaults to INTERACT_RADIUS). */
  radius?: number;
}

export interface NpcInteractable extends BaseInteractable {
  kind: 'npc';
  /** Intro dialogue node id. */
  dialogueId: string;
}

export interface DoorInteractable extends BaseInteractable {
  kind: 'door';
  /** Room to travel to when used. */
  targetRoomId: string;
}

export type Interactable = NpcInteractable | DoorInteractable;

export type SceneryKind = 'neurons' | 'crates' | 'columns';

export interface Room {
  id: string;
  name: string;
  floorColor: string;
  fogColor: string;
  ambientColor: string;
  lightColor: string;
  lightIntensity: number;
  scenery: SceneryKind;
  interactables: Interactable[];
}

/** Where the camera lands when entering any room. Kept clear of interactables. */
export const DEFAULT_SPAWN: Vec3 = [0, 1.7, 6];
export const INTERACT_RADIUS = 4.5;
export const START_ROOM_ID = 'cortex';

/** Human-readable faction names for the reputation panel. */
export const FACTION_NAMES: Record<string, string> = {
  'cult-of-the-left-eye': 'Cult of the Left Eye',
  'bile-merchants-guild': "Bile Merchants' Guild",
  'order-of-the-weeping-sinus': 'Order of the Weeping Sinus',
};

export const ROOMS: Room[] = [
  {
    id: 'cortex',
    name: 'The Dreadnought Cortex',
    floorColor: '#3b1f2b',
    fogColor: '#0a0406',
    ambientColor: '#ff9bb0',
    lightColor: '#ff6f91',
    lightIntensity: 40,
    scenery: 'neurons',
    interactables: [
      { id: 'oracle', kind: 'npc', label: 'The Left Eye Nerve Oracle', position: [0, 0, -4], color: '#4fc3ff', dialogueId: 'oracle-intro' },
      { id: 'door-cortex-market', kind: 'door', label: 'the Bile Markets', position: [9, 0, -2], color: '#9bff6f', targetRoomId: 'bile-markets' },
      { id: 'door-cortex-sinus', kind: 'door', label: 'the Weeping Sinus', position: [-9, 0, -2], color: '#7fb8ff', targetRoomId: 'sinus' },
    ],
  },
  {
    id: 'bile-markets',
    name: 'The Bile Markets',
    floorColor: '#2f3b1f',
    fogColor: '#090f04',
    ambientColor: '#d6ff9b',
    lightColor: '#9bff6f',
    lightIntensity: 34,
    scenery: 'crates',
    interactables: [
      { id: 'gurgle', kind: 'npc', label: 'Gurgle, Purveyor of Viscera', position: [0, 0, -4], color: '#b6ff5e', dialogueId: 'gurgle-intro' },
      { id: 'door-market-cortex', kind: 'door', label: 'the Cortex', position: [9, 0, -2], color: '#ff6f91', targetRoomId: 'cortex' },
    ],
  },
  {
    id: 'sinus',
    name: 'The Weeping Sinus',
    floorColor: '#1f2b3b',
    fogColor: '#04070a',
    ambientColor: '#9bc9ff',
    lightColor: '#6f9bff',
    lightIntensity: 30,
    scenery: 'columns',
    interactables: [
      { id: 'warden', kind: 'npc', label: 'The Weeping Sinus Warden', position: [0, 0, -4], color: '#7fdfff', dialogueId: 'sinus-intro' },
      { id: 'door-sinus-cortex', kind: 'door', label: 'the Cortex', position: [9, 0, -2], color: '#ff6f91', targetRoomId: 'cortex' },
    ],
  },
];

/** Flat id -> interactable index for O(1) lookups from the input handler / UI. */
const INTERACTABLE_INDEX: Record<string, Interactable> = ROOMS.reduce(
  (acc, room) => {
    room.interactables.forEach((it) => {
      acc[it.id] = it;
    });
    return acc;
  },
  {} as Record<string, Interactable>,
);

export const getInteractableById = (id: string | null): Interactable | undefined =>
  (id ? INTERACTABLE_INDEX[id] : undefined);

export const getRoomById = (id: string): Room | undefined => ROOMS.find((r) => r.id === id);

/** Re-exported for the dialogue registry so App has a single import site. */
export type { DialogueNode };
