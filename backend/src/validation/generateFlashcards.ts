import {
  API_PROVIDERS,
  DIFFICULTIES,
  VALIDATION_LIMITS,
  type ApiProvider,
  type Difficulty,
  type GenerateFlashcardsRequest
} from "@quizmaker/shared";

type ValidationResult =
  | { ok: true; value: GenerateFlashcardsRequest }
  | { ok: false; fields: Record<string, string> };

export function validateGenerateFlashcardsRequest(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      fields: { body: "Request body must be a JSON object." }
    };
  }

  const fields: Record<string, string> = {};
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const difficulty = body.difficulty;
  const count = body.count;
  const provider = body.provider;
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : undefined;
  const hasValidCount = typeof count === "number" && Number.isInteger(count);

  if (topic.length < VALIDATION_LIMITS.topicMinLength) {
    fields.topic = "Topic is required.";
  } else if (topic.length > VALIDATION_LIMITS.topicMaxLength) {
    fields.topic = `Topic must be ${VALIDATION_LIMITS.topicMaxLength} characters or fewer.`;
  }

  if (!isDifficulty(difficulty)) {
    fields.difficulty = "Difficulty must be beginner, intermediate, or advanced.";
  }

  if (!isApiProvider(provider)) {
    fields.provider = "Provider must be Gemini or OpenAI.";
  }

  if (!hasValidCount) {
    fields.count = "Count must be a whole number.";
  } else if (
    count < VALIDATION_LIMITS.countMin ||
    count > VALIDATION_LIMITS.countMax
  ) {
    fields.count = `Count must be between ${VALIDATION_LIMITS.countMin} and ${VALIDATION_LIMITS.countMax}.`;
  }

  if (
    Object.keys(fields).length > 0 ||
    !isDifficulty(difficulty) ||
    !isApiProvider(provider) ||
    !hasValidCount
  ) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      topic,
      difficulty,
      count,
      provider,
      apiKey
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);
}

function isApiProvider(value: unknown): value is ApiProvider {
  return typeof value === "string" && API_PROVIDERS.includes(value as ApiProvider);
}
