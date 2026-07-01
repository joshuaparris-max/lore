# QA Playtest — Dreadnought Drifters (Oracle Vertical Slice)

End-to-end Playwright coverage of the current playable slice: first-person Cortex,
proximity prompt, `E`-to-interact, dialogue, d20 Persuasion check, roll breakdown,
and faction reputation.

## How to run

```bash
npm install
npm run test:install     # one-time: downloads the Chromium binary
npm run build            # type-check + production bundle
npm run test:e2e         # build + serve (vite preview) + run the suite
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run test:e2e:headed` | Watch the run in a real browser window |
| `npm run test:e2e:ui` | Playwright's interactive UI mode |
| `npm run test:e2e:report` | Open the last HTML report |

`playwright.config.ts` builds and serves the **production** bundle on an isolated
port (`47823`) via `vite preview`, so the tests validate the real shipped bundle.

## Test architecture

The 3D layer (pointer-lock + WASD walking) is intentionally **not** automated —
it is flaky and hostile to headless runners. Instead, a **test-only bridge**
(`src/test/TestBridge.tsx`) is mounted **only** when the app is opened with
`?e2e=1`, so it never attaches in a normal user session. It exposes just enough
to skip the hard-to-automate bits while still exercising the *real* systems:

- `approachOracle()` — sets proximity (equivalent to walking up to the Oracle).
- `forceD20(n)` — forces the next d20 face so success/failure is deterministic
  (backed by `__setForcedD20` in `gameStore.ts`; `null` in production = real RNG).
- `store` — the live Zustand store, for asserting state directly.

Everything else is the genuine article: the real `E` keyboard handler, the real
dialogue UI, the real `rollSkillCheck` math, and the real reputation updates.

Deterministic dice used:
- **Success:** d20 = 15 → 15 + CHA mod (+2) + proficiency (+2) = **19** vs DC 13.
- **Failure:** d20 = 2 → 2 + 2 + 2 = **6** vs DC 13 (and not a natural 1).

## Coverage (11 cases — all passing)

| # | Test | Verifies |
| --- | --- | --- |
| 1 | launches, renders game screen + 3D canvas | app boots, `game-root` + `<canvas>` present |
| 2 | loads without severe console errors | no `console.error` / `pageerror` (benign GL/font noise filtered) |
| 3 | interaction prompt only when near | prompt absent by default, appears on approach |
| 4 | pressing E opens dialogue | real `E` handler opens overlay, prompt hides |
| 5 | speaker, body, all choices render | speaker text, non-empty body, all 6 intro choices |
| 6 | successful Persuasion → reputation up | roll breakdown (d20/mod/prof/total/DC), SUCCESS, rep `+0`→`+2` |
| 7 | failed Persuasion → reputation down | roll breakdown, FAILURE, rep `-1` |
| 8 | number keys select options | `2` picks Persuasion, `1` leaves — no mouse needed |
| 9 | deep branch traversal (keyboard) | intro → cult → join → accept, rep `+2` several nodes deep |
| 10 | dialogue graph integrity | every `nextNodeId`/`failureNodeId` resolves to a real node |
| 11 | close resumes scene, E works again | overlay closes, store cleared, E re-opens dialogue |

> Note: the deep-traversal test drives the tree with **number keys** rather than
> clicks. Rapid multi-hop *clicking* under headless Chromium hits Playwright's
> actionability hit-test flakiness against the constantly-repainting WebGL canvas
> (single clicks are fine). Keyboard is the robust primary path anyway.

## Stable selectors added

`game-root`, `interaction-prompt`, `dialogue-overlay`, `dialogue-speaker`,
`dialogue-body`, `dialogue-choices`, `choice-<id>` (e.g. `choice-persuade`),
`roll-breakdown`, `roll-d20`, `roll-modifier`, `roll-proficiency`, `roll-total`,
`roll-dc`, `roll-result`, `rep-cult`, `dialogue-close`.

## Bugs found & fixed during this pass

1. **Stale-server reuse (test infra).** `reuseExistingServer` reused a foreign
   `vite dev` already listening on `4173`, so tests hit an old bundle with no
   `data-testid`s. → Moved to isolated port `47823` + `reuseExistingServer:false`.
2. **`E` handler race (real timing gap).** R3F mounts the canvas — and its
   keyboard handler — asynchronously after WebGL init, while the DOM prompt
   appears instantly. Tests pressed `E` before the handler existed. → Added an
   `isSceneReady` store flag (set when the controller mounts; also useful for a
   future loading gate) and made tests await it before any key input.
3. **Parallel WebGL contention.** `fullyParallel` starved SwiftShader and caused
   30s timeouts / context crashes. → Serialized (`workers:1`), raised timeouts.
4. **Missing `roll-breakdown` selector.** The breakdown container lacked the
   `data-testid` the test referenced. → Added it.

No gameplay-logic bugs were found — the dice math, branching, reputation effects,
and dialogue flow all behaved correctly once the harness was sound.

## Artifacts

- HTML report: `playwright-report/` (`npm run test:e2e:report`)
- Failure screenshots + traces: `test-results/<test>/` (traces retained on failure)
- View a trace: `npx playwright show-trace test-results/<...>/trace.zip`

## Recommended next QA step

Add a **unit test layer (Vitest)** for the pure logic in `gameStore.ts` —
`abilityModifier`, `rollDie` (with an injected RNG), and `rollSkillCheck` edge
cases (natural 1 auto-fail, natural 20 auto-success, advantage/disadvantage).
These run in milliseconds with no browser/WebGL, giving fast, deterministic
coverage of the rules engine and freeing the Playwright suite to focus on
integration/flow. After that, extend E2E to the `oracle-lore` branch and the
"leave" choices to lock in full dialogue-graph traversal.
