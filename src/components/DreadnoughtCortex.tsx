import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import {
  ROOMS,
  getRoomById,
  getInteractableById,
  DEFAULT_SPAWN,
  INTERACT_RADIUS,
  type Interactable,
  type NpcInteractable,
  type DoorInteractable,
  type SceneryKind,
} from '../data/world';

/**
 * The playable 3D scene. Renders whichever room the player is currently in
 * (from the store) as an "on the ground" first-person space, plus every
 * interactable in that room. All of it is driven by src/data/world.ts — this
 * file is the renderer + input, not the content.
 */

const EYE_HEIGHT = 1.7;
const MOVE_SPEED = 4; // world units / second
const FLOOR_HALF_EXTENT = 18; // keeps the player from walking off the deck

/* ------------------------------------------------------------------ */
/* First-person movement + interaction input                          */
/* ------------------------------------------------------------------ */

/**
 * WASD movement + `E` to interact. `E` acts on whatever interactable is in
 * range: NPCs open dialogue, doors move the player to another room (and respawn
 * the camera). Store reads use getState() to avoid stale closures.
 */
function FirstPersonController(): null {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    camera.position.set(DEFAULT_SPAWN[0], EYE_HEIGHT, DEFAULT_SPAWN[2]);
    // Controller mount = input live; also unblocks e2e tests waiting on readiness.
    useGameStore.getState().setSceneReady(true);

    const down = (e: KeyboardEvent): void => {
      keys.current[e.code] = true;

      if (e.code === 'KeyE') {
        const state = useGameStore.getState();
        // Ignore E while a conversation is open (choices use number keys).
        if (state.activeDialogueNodeId !== null) return;
        const def = getInteractableById(state.nearbyInteractableId);
        if (!def) return;

        if (def.kind === 'npc') {
          state.startDialogue(def.dialogueId);
        } else {
          // Travel: switch rooms and drop the player at the room entrance.
          state.setNearbyInteractable(null);
          state.setCurrentRoom(def.targetRoomId);
          camera.position.set(DEFAULT_SPAWN[0], EYE_HEIGHT, DEFAULT_SPAWN[2]);
        }
      }
    };
    const up = (e: KeyboardEvent): void => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      useGameStore.getState().setSceneReady(false);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [camera]);

  // Reused vectors so we don't allocate every frame.
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Movement stays live even during dialogue, so the player can keep walking
    // and pick options with the number keys.
    const k = keys.current;
    const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
    const r = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (f === 0 && r === 0) return;

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.set(forward.z, 0, -forward.x);

    move
      .set(0, 0, 0)
      .addScaledVector(forward, f)
      .addScaledVector(right, r)
      .normalize()
      .multiplyScalar(MOVE_SPEED * delta);

    camera.position.add(move);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -FLOOR_HALF_EXTENT, FLOOR_HALF_EXTENT);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -FLOOR_HALF_EXTENT, FLOOR_HALF_EXTENT);
    camera.position.y = EYE_HEIGHT;
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Interactable visuals                                               */
/* ------------------------------------------------------------------ */

type PulseRef = MutableRefObject<THREE.MeshStandardMaterial | null>;

/** An NPC: a glowing orb on a pedestal with a floating name. */
function NpcMarker({ def, matRef }: { def: NpcInteractable; matRef: PulseRef }): JSX.Element {
  return (
    <group position={def.position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 1.5, 12]} />
        <meshStandardMaterial color="#20161c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial ref={matRef} color={def.color} emissive={def.color} emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      <Text position={[0, 3.2, 0]} fontSize={0.32} color={def.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
        {def.label}
      </Text>
      <pointLight position={[0, 2, 1]} intensity={5} color={def.color} distance={9} />
    </group>
  );
}

/** A door: a glowing archway with a shimmering portal plane and a destination label. */
function DoorMarker({ def, matRef }: { def: DoorInteractable; matRef: PulseRef }): JSX.Element {
  return (
    <group position={def.position}>
      <mesh position={[-1, 1.5, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial ref={matRef} color={def.color} emissive={def.color} emissiveIntensity={1} />
      </mesh>
      <mesh position={[1, 1.5, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[2.3, 0.3, 0.3]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <planeGeometry args={[1.7, 3]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.5} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 3.7, 0]} fontSize={0.28} color={def.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
        {`To ${def.label}`}
      </Text>
      <pointLight position={[0, 1.5, 1]} intensity={4} color={def.color} distance={8} />
    </group>
  );
}

/**
 * Wraps a marker with proximity detection: flags itself as the nearby
 * interactable in the store when the camera is within range (transition-guarded
 * so it only writes on enter/leave), and clears itself on unmount (room change).
 */
function InteractableObject({ def }: { def: Interactable }): JSX.Element {
  const { camera } = useThree();
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wasNear = useRef(false);
  const pos = useMemo(() => new THREE.Vector3(...def.position), [def]);
  const radius = def.radius ?? INTERACT_RADIUS;

  useEffect(
    () => () => {
      const store = useGameStore.getState();
      if (store.nearbyInteractableId === def.id) store.setNearbyInteractable(null);
    },
    [def.id],
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 1.0 + 0.6 * Math.sin(state.clock.elapsedTime * 3);
    }
    const isNear = camera.position.distanceTo(pos) <= radius;
    if (isNear !== wasNear.current) {
      wasNear.current = isNear;
      const store = useGameStore.getState();
      if (isNear) store.setNearbyInteractable(def.id);
      else if (store.nearbyInteractableId === def.id) store.setNearbyInteractable(null);
    }
  });

  return def.kind === 'npc'
    ? <NpcMarker def={def} matRef={matRef} />
    : <DoorMarker def={def} matRef={matRef} />;
}

/* ------------------------------------------------------------------ */
/* Scenery                                                            */
/* ------------------------------------------------------------------ */

/** Per-kind mesh for a single scenery prop, placed by the ring layout below. */
function SceneryProp({ kind, position }: { kind: SceneryKind; position: [number, number, number] }): JSX.Element {
  if (kind === 'crates') {
    return (
      <mesh position={[position[0], 0.75, position[2]]} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#4a5a2a" emissive="#9bff6f" emissiveIntensity={0.15} roughness={0.8} />
      </mesh>
    );
  }
  if (kind === 'columns') {
    return (
      <mesh position={[position[0], 3, position[2]]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 6, 10]} />
        <meshStandardMaterial color="#2a3a5a" emissive="#6f9bff" emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
    );
  }
  // 'neurons'
  return (
    <mesh position={[position[0], 2, position[2]]} castShadow>
      <cylinderGeometry args={[0.25, 0.45, 4, 8]} />
      <meshStandardMaterial color="#7a2b3f" emissive="#ff5e7a" emissiveIntensity={0.5} roughness={0.6} />
    </mesh>
  );
}

/** Ring of scenery props + the floor for the given room look. */
function RoomEnvironment({ floorColor, scenery }: { floorColor: string; scenery: SceneryKind }): JSX.Element {
  const props = useMemo(() => {
    const count = 10;
    const radius = 12;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return { key: i, position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number] };
    });
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_HALF_EXTENT * 2, FLOOR_HALF_EXTENT * 2]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>
      {props.map((p) => (
        <SceneryProp key={p.key} kind={scenery} position={p.position} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Room + root                                                        */
/* ------------------------------------------------------------------ */

/** Renders the current room: lighting, atmosphere, environment, interactables. */
function CurrentRoom(): JSX.Element {
  const roomId = useGameStore((s) => s.currentRoomId);
  const room = getRoomById(roomId) ?? ROOMS[0];

  return (
    <group>
      <color attach="background" args={[room.fogColor]} />
      <fog attach="fog" args={[room.fogColor, 8, 32]} />
      <ambientLight intensity={0.25} color={room.ambientColor} />
      <pointLight position={[0, 6, 0]} intensity={room.lightIntensity} color={room.lightColor} castShadow />

      <RoomEnvironment floorColor={room.floorColor} scenery={room.scenery} />

      {room.interactables.map((def) => (
        <InteractableObject key={def.id} def={def} />
      ))}
    </group>
  );
}

export default function DreadnoughtCortex(): JSX.Element {
  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%' }}
      camera={{ fov: 70, near: 0.1, far: 100, position: DEFAULT_SPAWN }}
    >
      <CurrentRoom />
      <FirstPersonController />
      {/* Click the canvas to capture the mouse; Esc releases it. */}
      <PointerLockControls />
    </Canvas>
  );
}
