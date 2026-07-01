import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

/**
 * End-to-end playtest of the full Dreadnought Drifters vertical slice:
 * launch → approach Oracle → E to talk → dialogue → d20 Persuasion check →
 * roll breakdown → reputation change → close → scene resumes.
 *
 * The 3D pointer-lock + WASD walk is deliberately NOT automated (flaky/headless-
 * hostile). Instead the `?e2e=1` TestBridge lets us deterministically place the
 * player next to the Oracle and force the d20, while every assertion is made
 * against the REAL dialogue UI, the REAL `E` keyboard handler, and the REAL
 * store logic.
 */

// Mirror of the test bridge shape exposed by src/test/TestBridge.tsx.
declare global {
  interface Window {
    __DRIFTERS_TEST__?: {
      store: {
        getState: () => {
          reputation: Record<string, number>;
          activeDialogueNodeId: string | null;
          isSceneReady: boolean;
        };
      };
      approachOracle: () => void;
      leaveOracle: () => void;
      forceD20: (value: number | null) => void;
      oracleId: string;
    };
  }
}

const CULT_ID = 'cult-of-the-left-eye';

/** Navigate to the app in e2e mode and wait for the test bridge to attach. */
async function gotoGame(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.getByTestId('game-root')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__DRIFTERS_TEST__));
  // The R3F canvas (and its keyboard handler) mount asynchronously after WebGL
  // initialises — wait for that so we never race the `E` key handler.
  await page.waitForFunction(() => window.__DRIFTERS_TEST__!.store.getState().isSceneReady);
}

/** Simulate the player standing within reach of the Oracle. */
async function approachOracle(page: Page): Promise<void> {
  await page.evaluate(() => window.__DRIFTERS_TEST__!.approachOracle());
}

/** Force the next d20 face (null restores randomness). */
async function forceD20(page: Page, value: number | null): Promise<void> {
  await page.evaluate((v) => window.__DRIFTERS_TEST__!.forceD20(v), value);
}

/** Read the current Cult of the Left Eye reputation from the live store. */
async function readCultRep(page: Page): Promise<number> {
  return page.evaluate((id) => window.__DRIFTERS_TEST__!.store.getState().reputation[id], CULT_ID);
}

/** Approach + press E to open the conversation at the intro node. */
async function openOracleDialogue(page: Page): Promise<void> {
  await approachOracle(page);
  await expect(page.getByTestId('interaction-prompt')).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect(page.getByTestId('dialogue-overlay')).toBeVisible();
}

test.describe('Dreadnought Drifters — Oracle vertical slice', () => {
  test('launches, renders the main game screen and the 3D canvas', async ({ page }) => {
    await gotoGame(page);
    await expect(page.getByTestId('game-root')).toBeVisible();
    // R3F mounts a <canvas>; its presence proves the 3D scene initialised.
    await expect(page.locator('canvas')).toHaveCount(1);
  });

  test('loads without severe console errors', async ({ page }) => {
    const severe: string[] = [];
    // Ignore known-benign noise: missing favicon, React devtools tip, and the
    // headless software-GL / troika font-shaping warnings that aren't app bugs.
    const benign = [
      /favicon/i,
      /Download the React DevTools/i,
      /GPU stall/i,
      /GL Driver Message/i,
      /unsupported (GPOS|GSUB) table/i,
      /THREE\.WebGLRenderer/i,
    ];

    const record = (text: string): void => {
      if (!benign.some((re) => re.test(text))) severe.push(text);
    };
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') record(msg.text());
    });
    page.on('pageerror', (err) => record(err.message));

    await gotoGame(page);
    // Give the scene a moment to render a few frames before judging.
    await page.waitForTimeout(1500);

    expect(severe, `Unexpected console errors:\n${severe.join('\n')}`).toEqual([]);
  });

  test('shows the interaction prompt only when near the Oracle', async ({ page }) => {
    await gotoGame(page);
    // Not near yet → no prompt.
    await expect(page.getByTestId('interaction-prompt')).toHaveCount(0);

    await approachOracle(page);
    const prompt = page.getByTestId('interaction-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Left Eye Nerve Oracle');
  });

  test('pressing E near the Oracle opens the dialogue overlay', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    // Prompt hides while talking.
    await expect(page.getByTestId('interaction-prompt')).toHaveCount(0);
  });

  test('renders speaker, body and every dialogue choice', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    await expect(page.getByTestId('dialogue-speaker')).toHaveText('The Left Eye Nerve Oracle');
    await expect(page.getByTestId('dialogue-body')).not.toBeEmpty();

    // The intro node fans out into six choices (lore / persuade / cult / rival /
    // steer / leave), each an entry point into a deeper branch.
    const choices = page.getByTestId('dialogue-choices').locator('button');
    await expect(choices).toHaveCount(6);
    for (const id of ['ask-lore', 'persuade', 'ask-cult', 'ask-rival', 'ask-steer', 'leave-intro']) {
      await expect(page.getByTestId(`choice-${id}`)).toBeVisible();
    }
  });

  test('a SUCCESSFUL Persuasion check shows the full roll breakdown and raises reputation', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    // Reputation starts neutral in the footer.
    await expect(page.getByTestId('rep-cult')).toHaveText('+0');
    expect(await readCultRep(page)).toBe(0);

    // Force a d20 of 15: 15 + CHA mod (+2) + proficiency (+2) = 19 vs DC 13 → success.
    await forceD20(page, 15);
    await page.getByTestId('choice-persuade').click();

    await expect(page.getByTestId('roll-breakdown')).toBeVisible();
    await expect(page.getByTestId('roll-d20')).toHaveText('15');
    await expect(page.getByTestId('roll-modifier')).toHaveText('+2');
    await expect(page.getByTestId('roll-proficiency')).toHaveText('+2');
    await expect(page.getByTestId('roll-total')).toHaveText('19');
    await expect(page.getByTestId('roll-dc')).toHaveText('13');
    await expect(page.getByTestId('roll-result')).toHaveText('SUCCESS');

    // Reputation rises by +2 in both the UI and the store.
    await expect(page.getByTestId('rep-cult')).toHaveText('+2');
    expect(await readCultRep(page)).toBe(2);
  });

  test('a FAILED Persuasion check shows FAILURE and lowers reputation', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    // Force a d20 of 2: 2 + 2 + 2 = 6 vs DC 13 → failure (and not a natural 1).
    await forceD20(page, 2);
    await page.getByTestId('choice-persuade').click();

    await expect(page.getByTestId('roll-d20')).toHaveText('2');
    await expect(page.getByTestId('roll-total')).toHaveText('6');
    await expect(page.getByTestId('roll-result')).toHaveText('FAILURE');

    await expect(page.getByTestId('rep-cult')).toHaveText('-1');
    expect(await readCultRep(page)).toBe(-1);
  });

  test('number keys select dialogue options without the mouse', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    // Intro choices are 1=ask-lore, 2=persuade, 3=leave. Force success and pick
    // the Persuasion option with the "2" key.
    await forceD20(page, 15);
    await page.keyboard.press('Digit2');

    await expect(page.getByTestId('roll-result')).toHaveText('SUCCESS');
    await expect(page.getByTestId('rep-cult')).toHaveText('+2');

    // The success node has a single "leave" choice — key "1" closes the dialogue.
    await page.keyboard.press('Digit1');
    await expect(page.getByTestId('dialogue-overlay')).toHaveCount(0);
  });

  test('can traverse a deep branch by keyboard (intro -> cult -> join -> accept)', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    // intro #3 = ask-cult
    await page.keyboard.press('Digit3');
    await expect(page.getByTestId('choice-join-ask')).toBeVisible();

    // cult-hub #1 = join-ask
    await page.keyboard.press('Digit1');
    await expect(page.getByTestId('choice-accept-join')).toBeVisible();

    // cult-join #1 = accept-join -> lands on the "accepted" node (onEnter +2)
    await page.keyboard.press('Digit1');
    await expect(page.getByTestId('dialogue-body')).toContainText('Welcome, initiate');
    await expect(page.getByTestId('rep-cult')).toHaveText('+2');
  });

  test('every dialogue link resolves to a real node (graph integrity)', async ({ page }) => {
    await gotoGame(page);
    const broken = await page.evaluate(() => {
      const nodes = (window.__DRIFTERS_TEST__!.store.getState() as unknown as {
        dialogueNodes: Record<string, {
          choices: { nextNodeId: string | null; check?: { failureNodeId?: string | null } }[];
        }>;
      }).dialogueNodes;
      const bad: string[] = [];
      for (const [id, node] of Object.entries(nodes)) {
        for (const c of node.choices) {
          if (c.nextNodeId && !nodes[c.nextNodeId]) bad.push(`${id} -> ${c.nextNodeId}`);
          const fail = c.check?.failureNodeId;
          if (fail && !nodes[fail]) bad.push(`${id} -> (fail) ${fail}`);
        }
      }
      return bad;
    });
    expect(broken, `Broken dialogue links:\n${broken.join('\n')}`).toEqual([]);
  });

  test('closing dialogue resumes the scene and E works again', async ({ page }) => {
    await gotoGame(page);
    await openOracleDialogue(page);

    await page.getByTestId('dialogue-close').click();
    await expect(page.getByTestId('dialogue-overlay')).toHaveCount(0);

    // Store confirms the conversation is fully closed (movement un-frozen).
    const active = await page.evaluate(() => window.__DRIFTERS_TEST__!.store.getState().activeDialogueNodeId);
    expect(active).toBeNull();

    // Prompt returns (still near the Oracle) and E re-opens the dialogue,
    // proving the input pipeline and scene are live again.
    await expect(page.getByTestId('interaction-prompt')).toBeVisible();
    await page.keyboard.press('KeyE');
    await expect(page.getByTestId('dialogue-overlay')).toBeVisible();
  });
});
