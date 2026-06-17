import {
  DIFFICULTIES,
  VALIDATION_LIMITS,
  type Difficulty,
  type GenerateFlashcardsRequest
} from "@quizmaker/shared";

interface FormInput {
  topic: string;
  difficulty: string;
  count: string;
  apiKey: string;
}

type ValidationResult =
  | { ok: true; value: GenerateFlashcardsRequest }
  | { ok: false; fields: Record<string, string> };

export function validateGenerationInput(input: FormInput): ValidationResult {
  const fields: Record<string, string> = {};
  const topic = input.topic.trim();
  const parsedCount = Number(input.count);

  if (topic.length < VALIDATION_LIMITS.topicMinLength) {
    fields.topic = "Topic is required.";
  } else if (topic.length > VALIDATION_LIMITS.topicMaxLength) {
    fields.topic = `Topic must be ${VALIDATION_LIMITS.topicMaxLength} characters or fewer.`;
  }

  if (!isDifficulty(input.difficulty)) {
    fields.difficulty = "Difficulty must be beginner, intermediate, or advanced.";
  }

  if (!Number.isInteger(parsedCount)) {
    fields.count = "Count must be a whole number.";
  } else if (
    parsedCount < VALIDATION_LIMITS.countMin ||
    parsedCount > VALIDATION_LIMITS.countMax
  ) {
    fields.count = `Count must be between ${VALIDATION_LIMITS.countMin} and ${VALIDATION_LIMITS.countMax}.`;
  }

  if (Object.keys(fields).length > 0 || !isDifficulty(input.difficulty)) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      topic,
      difficulty: input.difficulty,
      count: parsedCount,
      apiKey: input.apiKey.trim() || undefined
    }
  };
}

function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}
