import { GoogleGenAI } from "@google/genai";
import type {
  ApiProvider,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse
} from "@quizmaker/shared";
import { VALIDATION_LIMITS } from "@quizmaker/shared";
import type { ServerEnv } from "../config/env.js";

export interface FlashcardGenerator {
  generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse>;
}

export class MissingProviderApiKeyError extends Error {
  constructor(provider: ApiProvider) {
    super(`Missing ${provider} API key.`);
    this.name = "MissingProviderApiKeyError";
  }
}

export class ProviderGenerationError extends Error {
  constructor(provider: ApiProvider) {
    super(`${provider} flashcard generation failed.`);
    this.name = "ProviderGenerationError";
  }
}

export class GeminiFlashcardService implements FlashcardGenerator {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  async generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    const apiKey = request.apiKey ?? this.apiKey;

    if (!apiKey) {
      throw new MissingProviderApiKeyError("gemini");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: this.model,
        contents: buildFlashcardPrompt(request),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: flashcardDeckSchema(request.count),
          temperature: 0.4
        }
      });

      if (typeof response.text !== "string") {
        throw new Error("Gemini response did not include text output.");
      }

      return mapProviderDeck(JSON.parse(response.text), request);
    } catch (error) {
      if (error instanceof ProviderGenerationError) {
        throw error;
      }

      throw new ProviderGenerationError("gemini");
    }
  }
}

interface OpenAIResponsesPayload {
  output_text?: unknown;
  output?: unknown;
}

interface ProviderDeckPayload {
  cards?: unknown;
}

export class OpenAIFlashcardService implements FlashcardGenerator {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  async generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    const apiKey = request.apiKey ?? this.apiKey;

    if (!apiKey) {
      throw new MissingProviderApiKeyError("openai");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          input: buildFlashcardPrompt(request),
          text: {
            format: {
              type: "json_schema",
              name: "flashcard_deck",
              strict: true,
              schema: flashcardDeckSchema(request.count)
            }
          }
        })
      });

      if (!response.ok) {
        throw new ProviderGenerationError("openai");
      }

      const body = (await response.json()) as OpenAIResponsesPayload;
      const outputText = getOpenAIOutputText(body);

      return mapProviderDeck(JSON.parse(outputText), request);
    } catch (error) {
      if (error instanceof ProviderGenerationError) {
        throw error;
      }

      throw new ProviderGenerationError("openai");
    }
  }
}

function getOpenAIOutputText(body: OpenAIResponsesPayload): string {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  if (!Array.isArray(body.output)) {
    return "";
  }

  for (const outputItem of body.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!isRecord(contentItem)) {
        continue;
      }

      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        return contentItem.text;
      }
    }
  }

  return "";
}

export class ProviderFlashcardService implements FlashcardGenerator {
  private readonly services: Record<ApiProvider, FlashcardGenerator>;

  constructor(env: ServerEnv) {
    this.services = {
      gemini: new GeminiFlashcardService(env.geminiApiKey, env.geminiModel),
      openai: new OpenAIFlashcardService(env.openaiApiKey, env.openaiModel)
    };
  }

  generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    return this.services[request.provider].generateFlashcards(request);
  }
}

function buildFlashcardPrompt(request: GenerateFlashcardsRequest): string {
  return [
    `Create ${request.count} ${request.difficulty} flashcards about "${request.topic}".`,
    "Each question must be clear and answerable without outside context.",
    "Each answer must be concise, accurate, and useful for studying.",
    "Return only data matching the requested JSON schema."
  ].join("\n");
}

function flashcardDeckSchema(count: number) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["cards"],
    properties: {
      cards: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: {
              type: "string"
            },
            answer: {
              type: "string"
            }
          }
        }
      }
    }
  };
}

function mapProviderDeck(
  payload: ProviderDeckPayload,
  request: GenerateFlashcardsRequest
): GenerateFlashcardsResponse {
  if (!Array.isArray(payload.cards) || payload.cards.length !== request.count) {
    throw new Error("Invalid provider deck.");
  }

  const cards = payload.cards.map((card, index) => {
    if (!isRecord(card)) {
      throw new Error("Invalid provider card.");
    }

    const question = typeof card.question === "string" ? card.question.trim() : "";
    const answer = typeof card.answer === "string" ? card.answer.trim() : "";

    if (
      question.length < VALIDATION_LIMITS.topicMinLength ||
      answer.length < VALIDATION_LIMITS.topicMinLength
    ) {
      throw new Error("Invalid provider card text.");
    }

    return {
      id: `card-${index + 1}`,
      question,
      answer
    };
  });

  return {
    deckId: `deck-${Date.now()}`,
    topic: request.topic,
    difficulty: request.difficulty,
    cards
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
