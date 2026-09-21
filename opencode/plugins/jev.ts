import { Plugin } from "@opencode/plugin";
import {
  choice as choiceQuestion,
  type Questions,
  noul as noulQuestion,
  score as scoreQuestion,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

const MODEL = "jev-1.13.0";

let client: TypeSafeClient | undefined;

function jev() {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "TYPESAFE_API_KEY is not set in the process environment; the Jev tools cannot run.",
    );
  }
  client ??= new TypeSafeClient({
    apiKey,
    defaultModel: MODEL,
    logLevel: "off",
  });
  return client;
}

async function ask<Q extends Questions>(state: string, questions: Q) {
  const result = await jev().systemOne({ state, questions, model: MODEL });
  if (result.model !== MODEL) {
    throw new Error(
      `Unexpected Jev model "${result.model}"; expected "${MODEL}".`,
    );
  }
  return result;
}

function report(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

export default Plugin.define({
  id: "jev",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "jev_choice",
        description:
          "Ask Jev to select one option from a finite set of explicit alternatives. " +
          "Use for bounded classification or choosing between supplied approaches; " +
          "not for open-ended generation. Send state, question, and options in English.",
        input: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description:
                "Concise English description of the semantic state for the decision.",
            },
            question: {
              type: "string",
              description:
                "One precise English question that selects among the options.",
            },
            options: {
              type: "array",
              minItems: 2,
              description: "Finite alternatives to choose from; at least two.",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description:
                      "Stable identifier returned as the selected option.",
                  },
                  description: {
                    type: "string",
                    description: "English description of this option.",
                  },
                },
                required: ["id", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["state", "question", "options"],
          additionalProperties: false,
        },
        async execute(input, context) {
          const args = input as {
            state: string;
            question: string;
            options: Array<{ id: string; description: string }>;
          };
          const result = await ask(
            args.state,
            {
              judgement: choiceQuestion(
                args.question,
                Object.fromEntries(
                  args.options.map((option) => [option.id, option.description]),
                ),
              ),
            },
          );
          const answer = result.answers.judgement;
          await context.progress({ title: `Jev choice: ${answer.choice}` });
          return {
            content: report({
              operation: "choice",
              selected: answer.choice,
              confidence: answer.confidence,
              probabilities: answer.probabilities,
              model: result.model,
              usage: result.usage,
            }),
          };
        },
      });

      editor.add({
        name: "jev_noul",
        description:
          "Ask Jev one bounded yes/no semantic question and receive a probability. " +
          "Use for verification, gating, and semantic checks; not for open-ended reasoning. " +
          "Send state and question in English.",
        input: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description:
                "Concise English description of the semantic state to judge.",
            },
            question: {
              type: "string",
              description: "One precise English yes/no semantic question.",
            },
          },
          required: ["state", "question"],
          additionalProperties: false,
        },
        async execute(input, context) {
          const args = input as { state: string; question: string };
          const result = await ask(
            args.state,
            { judgement: noulQuestion(args.question) },
          );
          const answer = result.answers.judgement;
          await context.progress({ title: `Jev noul: ${answer.noul}` });
          return {
            content: report({
              operation: "noul",
              probability: answer.noul,
              model: result.model,
              usage: result.usage,
            }),
          };
        },
      });

      editor.add({
        name: "jev_score",
        description:
          "Ask Jev to score a state against an ordered qualitative rubric. " +
          "Use for graded semantic judgments; not for arithmetic or deterministic scoring. " +
          "Send state, question, and rubric descriptions in English.",
        input: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description:
                "Concise English description of the semantic state to score.",
            },
            question: {
              type: "string",
              description: "One precise English scoring instruction.",
            },
            levels: {
              type: "array",
              minItems: 2,
              description:
                "Ordered rubric levels from lowest to highest; at least two.",
              items: {
                type: "string",
                description: "English description of one rubric level.",
              },
            },
          },
          required: ["state", "question", "levels"],
          additionalProperties: false,
        },
        async execute(input, context) {
          const args = input as {
            state: string;
            question: string;
            levels: string[];
          };
          const levels = args.levels as [string, string, ...string[]];
          const result = await ask(
            args.state,
            { judgement: scoreQuestion(args.question, levels) },
          );
          const answer = result.answers.judgement;
          await context.progress({ title: `Jev score: ${answer.score}` });
          return {
            content: report({
              operation: "score",
              score: answer.score,
              confidence: answer.confidence,
              scale: { min: 0, max: levels.length - 1 },
              probabilities: levels.map((description, level) => ({
                level,
                description,
                probability: answer.probabilities[level] ?? 0,
              })),
              model: result.model,
              usage: result.usage,
            }),
          };
        },
      });
    });
  },
});
