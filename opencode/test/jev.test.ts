import assert from "node:assert/strict";
import { Plugin } from "@opencode/plugin";
import jevPlugin from "../plugins/jev.ts";

type Tool = {
  name: string;
  execute: (
    input: unknown,
    context: { sessionID: string; progress: () => Promise<void> },
  ) => Promise<{ content?: string }>;
};

type Editor = {
  add: (tool: Tool) => void;
};

async function loadTools(): Promise<Map<string, Tool>> {
  const tools = new Map<string, Tool>();
  const ctx = {
    tool: {
      transform: async (callback: (editor: Editor) => void) => {
        callback({
          add: (tool: Tool) => tools.set(tool.name, tool),
        });
      },
    },
  };
  await (jevPlugin.setup as (context: unknown) => Promise<void>)(
    ctx as unknown,
  );
  return tools;
}

const tools = await loadTools();
const context = {
  sessionID: "test-session",
  progress: async () => {},
};

let failures = 0;

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.error(
      `FAIL ${name}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function parse(result: { content?: string }) {
  assert.equal(typeof result.content, "string", "tool output is a string");
  return JSON.parse(result.content!) as Record<string, unknown>;
}

await check("plugin registers all three Jev tools", async () => {
  assert.ok(tools.has("jev_choice"));
  assert.ok(tools.has("jev_noul"));
  assert.ok(tools.has("jev_score"));
  assert.equal(Plugin.define.length, 1);
});

await check("missing TYPESAFE_API_KEY fails clearly", async () => {
  const saved = process.env.TYPESAFE_API_KEY;
  delete process.env.TYPESAFE_API_KEY;
  try {
    await assert.rejects(
      () =>
        tools.get("jev_noul")!.execute(
          { state: "state", question: "question?" },
          context,
        ),
      /TYPESAFE_API_KEY/,
    );
  } finally {
    if (saved !== undefined) process.env.TYPESAFE_API_KEY = saved;
  }
});

const hasKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());

if (!hasKey) {
  console.error("SKIP live Jev smoke tests: TYPESAFE_API_KEY is not set");
  process.exit(failures ? 1 : 0);
}

await check("choice selects a supplied option and pins the model", async () => {
  const result = parse(
    await tools.get("jev_choice")!.execute(
      {
        state:
          "The requested task is to add retry handling around one existing HTTP request. " +
          "The implementation location and requirements are already known.",
        question: "Which task category best describes this work?",
        options: [
          {
            id: "implementation",
            description: "implementing a bounded, clearly specified change",
          },
          {
            id: "debugging",
            description: "investigating an unknown failure or root cause",
          },
          {
            id: "architecture",
            description: "making a significant system-level design decision",
          },
        ],
      },
      context,
    ),
  );
  assert.equal(result.model, "jev-1.13.0", "model is pinned");
  assert.ok(
    ["implementation", "debugging", "architecture"].includes(
      result.selected as string,
    ),
    "selection is one of the supplied options",
  );
  assert.equal(result.selected, "implementation");
  assert.equal(typeof result.confidence, "number");
});

await check("noul answers a bounded proposition and pins the model", async () => {
  const result = parse(
    await tools.get("jev_noul")!.execute(
      {
        state:
          "The requirement is that failed HTTP calls are retried. " +
          "The implementation adds retry handling around the HTTP call.",
        question:
          "Does the described implementation directly address the stated requirement?",
      },
      context,
    ),
  );
  assert.equal(result.model, "jev-1.13.0", "model is pinned");
  assert.ok(
    (result.probability as number) > 0.5,
    `expected a yes-leaning probability, got ${result.probability}`,
  );
});

await check("score uses the ordered rubric and pins the model", async () => {
  const result = parse(
    await tools.get("jev_score")!.execute(
      {
        state:
          "The suspected root cause is an unchecked null cache result. " +
          "A failing stack trace points to dereferencing the cache result. " +
          "Adding a null check removes the observed failure.",
        question:
          "How strongly does the available evidence support the proposed root cause?",
        levels: [
          "little or no support",
          "some support",
          "strong support",
          "directly demonstrated",
        ],
      },
      context,
    ),
  );
  assert.equal(result.model, "jev-1.13.0", "model is pinned");
  assert.ok(
    (result.score as number) >= 0 && (result.score as number) <= 3,
    `score ${result.score} is within the rubric`,
  );
  assert.deepEqual(result.scale, { min: 0, max: 3 });
  assert.equal((result.probabilities as unknown[]).length, 4);
});

if (failures) {
  console.error(`${failures} test(s) failed`);
  process.exit(1);
}
console.log("all Jev checks passed");
