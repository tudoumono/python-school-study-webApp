import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Problem: a
    .model({
      categoryId: a.string().required(),
      difficulty: a.enum(["beginner", "easy", "medium", "hard"]),
      order: a.integer().required(),
      title: a.string().required(),
      description: a.string().required(),
      expectedOutput: a.string(),
      explanation: a.string(),
      blockMode: a.enum(["token", "line"]),
      correctOrder: a.json().required(),
      distractors: a.json(),
      hints: a.json().required(),
      points: a.integer().required(),
      tags: a.json(),
      source: a.enum(["manual", "ai_generated"]),
      codeHash: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create", "update", "delete"]),
      allow.guest().to(["read"]),
    ]),

  ProblemAttempt: a
    .model({
      owner: a.string().required(),
      problemId: a.string().required(),
      status: a.enum(["not_started", "attempted", "completed"]),
      attempts: a.integer().required(),
      usedHint: a.boolean().required(),
      bestScore: a.integer().required(),
      firstAttemptAt: a.datetime().required(),
      completedAt: a.datetime(),
      incorrectPatterns: a.json(),
      avgTimePerAttempt: a.float(),
      hintViewCount: a.integer(),
      gaveUp: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  UserProgress: a
    .model({
      owner: a.string().required(),
      version: a.integer().required(),
      totalPoints: a.integer().required(),
      level: a.integer().required(),
      currentStreak: a.integer().required(),
      longestStreak: a.integer().required(),
      lastActivityDate: a.string(),
      totalSolved: a.integer().required(),
      analytics: a.json(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
