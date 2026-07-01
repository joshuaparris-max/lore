import type { DialogueNode } from '../state/gameStore';
import { oracleDialogue } from './oracleDialogue';
import { gurgleDialogue } from './gurgleDialogue';
import { wardenDialogue } from './wardenDialogue';

/**
 * Every NPC's dialogue tree, flattened into one list for registration.
 * Node ids are globally unique (each NPC prefixes its own), so they can all
 * live in the single store `dialogueNodes` map.
 */
export const allDialogue: DialogueNode[] = [
  ...oracleDialogue,
  ...gurgleDialogue,
  ...wardenDialogue,
];
