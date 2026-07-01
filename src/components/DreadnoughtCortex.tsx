import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { ORACLE_INTRO_NODE_ID, ORACLE_INTERACTABLE_ID } from '../data/oracleDialogue';

/**
 * DreadnoughtCortex — the dreadnought's brain room ("the Cortex").
 *
 * Establishes the "on the ground" first-person perspective: eye-height camera,
 * mouse-look (pointer lock), WASD walking. It also hosts the first interactable
 * NPC — The Left Eye Nerve Oracle — with proximity detection and an `E`-to-talk
 * handler. All narrative state lives in the Zustand store, not in this file.
 */

// Tunables kept together so the feel of movement is easy to iterate on.
const EYE_HEIGHT = 1.7;
const MOVE_SPEED = 4; // world units / second
const FLOOR_HALF_EXTENT = 18; // keeps the player from walking off the brain

// The Oracle's identity + placement, shared by the mesh and the proximity check.
const ORACLE_ID = ORACLE_INTERACTABLE_ID;
const ORACLE_POSITION = new THREE.Vector3(0, 0, -4);
const ORACLE_INTERACT_RADIUS = 4.5;

/* ------------------------------------------------------------------ */
/* First-person WASD movement + interaction input                     */
/* ------------------------------------------------------------------ */

/**
 * Reads keyboard state and translates the camera along the ground plane each
 * frame. Movement freezes while a conversation is open, and `E` opens the
 * nearby interactable. Store reads use getState() to avoid stale closures.
 */
function FirstPersonController(): null {
  const { camera } = useThree();
  // Which movement keys are currently held. Ref (not state) to avoid re-renders.
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 6);
    // The controller mounting is our signal that keyboard input is live and the
    // scene is interactive (used by loading UI and by e2e tests to avoid racing
    // the async R3F canvas mount before pressing keys).
    useGameStore.getState().setSceneReady(true);

    const down = (e: KeyboardEvent): void => {
      keys.current[e.code] = true;

      // `E` communes with whatever interactable is in range (if not already talking).
      if (e.code === 'KeyE') {
        const { nearbyInteractableId, activeDialogueNodeId, startDialogue } = useGameStore.getState();
        if (nearbyInteractableId === ORACLE_ID && activeDialogueNodeId === null) {
          startDialogue(ORACLE_INTRO_NODE_ID);
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
    // Lock the player in place while a conversation is on screen.
    if (useGameStore.getState().activeDialogueNodeId !== null) return;

    const k = keys.current;
    const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
    const r = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (f === 0 && r === 0) return;

    // Camera forward flattened onto the ground plane.
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    // Right vector is forward rotated -90° about Y.
    right.set(forward.z, 0, -forward.x);

    move
      .set(0, 0, 0)
      .addScaledVector(forward, f)
      .addScaledVector(right, r)
      .normalize()
      .multiplyScalar(MOVE_SPEED * delta);

    camera.position.add(move);
    // Clamp to the floor so you can't walk into the void (yet).
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -FLOOR_HALF_EXTENT, FLOOR_HALF_EXTENT);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -FLOOR_HALF_EXTENT, FLOOR_HALF_EXTENT);
    camera.position.y = EYE_HEIGHT; // never drift off the ground
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* The Left Eye Nerve Oracle (interactable)                           */
/* ------------------------------------------------------------------ */

/**
 * A visually distinct floating eyeball on a pedestal. Each frame it checks the
 * camera's distance and flags itself as "nearby" in the store when in reach,
 * which drives the DOM "Press E" prompt and enables the `E` handler above.
 */
function LeftEyeNerveOracle(): JSX.Element {
  const { camera } = useThree();
  const irisRef = useRef<THREE.MeshStandardMaterial>(null);
  // Local mirror of proximity so we only write to the store on transitions.
  const wasNear = useRef(false);

  useFrame((state) => {
    // Pulse the iris so the object reads as alive/interactable.
    if (irisRef.current) {
      irisRef.current.emissiveIntensity = 1.2 + 0.8 * Math.sin(state.clock.elapsedTime * 3);
    }

    const isNear = camera.position.distanceTo(ORACLE_POSITION) <= ORACLE_INTERACT_RADIUS;
    if (isNear !== wasNear.current) {
      wasNear.current = isNear;
      useGameStore.getState().setNearbyInteractable(isNear ? ORACLE_ID : null);
    }
  });

  return (
    <group position={ORACLE_POSITION}>
      {/* Pedestal of fused vertebrae. */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 1.5, 12]} />
        <meshStandardMaterial color="#2a1a22" roughness={0.8} />
      </mesh>

      {/* The eyeball proper — bright and obviously special. */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.3} emissive="#332222" emissiveIntensity={0.3} />
      </mesh>
      {/* Glowing iris facing the player's spawn (+Z). */}
      <mesh position={[0, 2.1, 0.6]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial ref={irisRef} color="#3aa0ff" emissive="#4fc3ff" emissiveIntensity={1.5} />
      </mesh>

      {/* Floating label so the interactable is unmistakable. */}
      <Text
        position={[0, 3.4, 0]}
        fontSize={0.35}
        color="#7fdfff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#001018"
      >
        The Left Eye Nerve Oracle
      </Text>

      {/* Its own eerie glow. */}
      <pointLight position={[0, 2.1, 1]} intensity={6} color="#4fc3ff" distance={10} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

/** A single slowly-pulsing neuron pillar. */
function NeuronPillar({ position, phase }: { position: [number, number, number]; phase: number }): JSX.Element {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    // Bioluminescent throb, each pillar offset by its phase for an organic feel.
    const t = state.clock.elapsedTime;
    matRef.current.emissiveIntensity = 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + phase));
  });

  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.25, 0.45, 4, 8]} />
      <meshStandardMaterial
        ref={matRef}
        color="#7a2b3f"
        emissive="#ff5e7a"
        emissiveIntensity={0.5}
        roughness={0.6}
      />
    </mesh>
  );
}

/** Procedurally scatter a ring of neuron pillars around the room. */
function CortexScenery(): JSX.Element {
  const pillars = useMemo(() => {
    const count = 10;
    const radius = 10;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        key: i,
        position: [Math.cos(angle) * radius, 2, Math.sin(angle) * radius] as [number, number, number],
        phase: i * 0.7,
      };
    });
  }, []);

  return (
    <group>
      {/* Fleshy cortex floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_HALF_EXTENT * 2, FLOOR_HALF_EXTENT * 2]} />
        <meshStandardMaterial color="#3b1f2b" roughness={0.9} />
      </mesh>

      {pillars.map((p) => (
        <NeuronPillar key={p.key} position={p.position} phase={p.phase} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Root component                                                      */
/* ------------------------------------------------------------------ */

export default function DreadnoughtCortex(): JSX.Element {
  return (
    <Canvas
      shadows
      // Fill the parent; the parent element controls sizing.
      style={{ width: '100%', height: '100%', background: '#0a0406' }}
      camera={{ fov: 70, near: 0.1, far: 100, position: [0, EYE_HEIGHT, 6] }}
    >
      {/* Moody organ-interior lighting. */}
      <ambientLight intensity={0.25} color="#ff9bb0" />
      <pointLight position={[0, 6, 0]} intensity={40} color="#ff6f91" castShadow />
      <fog attach="fog" args={['#0a0406', 8, 30]} />

      <CortexScenery />
      <LeftEyeNerveOracle />
      <FirstPersonController />

      {/* Click the canvas to capture the mouse; Esc releases it. */}
      <PointerLockControls />
    </Canvas>
  );
}
