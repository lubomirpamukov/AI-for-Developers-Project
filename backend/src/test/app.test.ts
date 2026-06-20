import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateFlashcardsRequest, GenerateFlashcardsResponse } from "@quizmaker/shared";
import { createApp } from "../app.js";
import {
  GeminiFlashcardService,
  MissingProviderApiKeyError,
  OpenAIFlashcardService,
  ProviderGenerationError,
  type FlashcardGenerator
} from "../services/flashcardProviderService.js";

const geminiGenerateContentMock = vi.hoisted(() => vi.fn());
const googleGenAIConstructorMock = vi.hoisted(() =>
  vi.fn(function GoogleGenAIMock() {
    return {
      models: {
        generateContent: geminiGenerateContentMock
      }
    };
  })
);

function createGeminiClientMock() {
  return {
    models: {
      generateContent: geminiGenerateContentMock
    }
  };
}

vi.mock("@google/genai", () => ({
  GoogleGenAI: googleGenAIConstructorMock
}));

function createMockGenerator(
  generateFlashcards: FlashcardGenerator["generateFlashcards"]
): FlashcardGenerator {
  return { generateFlashcards };
}

describe("QuizMaker API scaffold", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const successfulDeck: GenerateFlashcardsResponse = {
    deckId: "deck-1",
    topic: "TypeScript",
    difficulty: "beginner",
    cards: [
      {
        id: "card-1",
        question: "What is TypeScript?",
        answer: "A typed superset of JavaScript."
      }
    ]
  };

  const app = createApp({
    flashcardGenerator: createMockGenerator(async () => successfulDeck)
  });

  it("responds to the health endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(typeof response.body.timestamp).toBe("string");
  });

  it("validates flashcard generation requests before implementation", async () => {
    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({ topic: "", difficulty: "expert", count: 2.5 });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fields).toEqual({
      topic: "Topic is required.",
      difficulty: "Difficulty must be beginner, intermediate, or advanced.",
      provider: "Provider must be Gemini or OpenAI.",
      count: "Count must be a whole number."
    });
  });

  it("rejects topics longer than 120 characters", async () => {
    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({
        topic: "a".repeat(121),
        difficulty: "beginner",
        count: 5,
        provider: "gemini"
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Please fix the highlighted fields.",
      code: "VALIDATION_ERROR",
      fields: {
        topic: "Topic must be 120 characters or fewer."
      }
    });
  });

  it("rejects counts outside the allowed range", async () => {
    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({
        topic: "TypeScript",
        difficulty: "intermediate",
        count: 21,
        provider: "gemini"
      });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({
      count: "Count must be between 1 and 20."
    });
  });

  it("passes valid generation requests to the selected provider", async () => {
    const generateFlashcards = vi.fn(async () => successfulDeck);
    const providerApp = createApp({
      flashcardGenerator: createMockGenerator(generateFlashcards)
    });

    const response = await request(providerApp)
      .post("/api/generate-flashcards")
      .send({
        topic: "  TypeScript  ",
        difficulty: "beginner",
        count: 1,
        provider: "openai",
        apiKey: "test-only-key"
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(successfulDeck);
    expect(generateFlashcards).toHaveBeenCalledWith({
      topic: "TypeScript",
      difficulty: "beginner",
      count: 1,
      provider: "openai",
      apiKey: "test-only-key"
    });
  });

  it("returns a safe missing-key response for the selected provider", async () => {
    const providerApp = createApp({
      flashcardGenerator: createMockGenerator(async (request) => {
        throw new MissingProviderApiKeyError(request.provider);
      })
    });

    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({
        topic: "TypeScript",
        difficulty: "beginner",
        count: 5,
        provider: "openai",
        apiKey: "test-only-key"
      });

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain("test-only-key");

    const missingKeyResponse = await request(providerApp)
      .post("/api/generate-flashcards")
      .send({
        topic: "TypeScript",
        difficulty: "beginner",
        count: 5,
        provider: "openai"
      });

    expect(missingKeyResponse.status).toBe(400);
    expect(missingKeyResponse.body).toEqual({
      error: "Add an API key for the selected provider or configure one on the server.",
      code: "MISSING_API_KEY"
    });
  });

  it("returns a safe provider failure response without leaking API keys", async () => {
    const providerApp = createApp({
      flashcardGenerator: createMockGenerator(async (request) => {
        throw new ProviderGenerationError(request.provider);
      })
    });

    const response = await request(providerApp)
      .post("/api/generate-flashcards")
      .send({
        topic: "TypeScript",
        difficulty: "beginner",
        count: 5,
        provider: "openai",
        apiKey: "test-only-key"
      });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: "We could not generate flashcards right now. Please try again.",
      code: "GENERATION_FAILED"
    });
    expect(JSON.stringify(response.body)).not.toContain("test-only-key");
  });
});

describe("GeminiFlashcardService", () => {
  beforeEach(() => {
    geminiGenerateContentMock.mockReset();
    googleGenAIConstructorMock.mockClear();
    googleGenAIConstructorMock.mockImplementation(function GoogleGenAIMock() {
      return createGeminiClientMock();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requestBody: GenerateFlashcardsRequest = {
    topic: "TypeScript",
    difficulty: "beginner",
    count: 2,
    provider: "gemini",
    apiKey: "request-key"
  };

  it("calls Gemini with structured JSON output and maps generated cards", async () => {
    geminiGenerateContentMock.mockResolvedValue({
      text: JSON.stringify({
        cards: [
          {
            question: "What is TypeScript?",
            answer: "A typed superset of JavaScript."
          },
          {
            question: "Why use types?",
            answer: "They catch many mistakes earlier."
          }
        ]
      })
    });

    const service = new GeminiFlashcardService("server-key", "gemini-test");
    const deck = await service.generateFlashcards(requestBody);

    expect(googleGenAIConstructorMock).toHaveBeenCalledWith({
      apiKey: "request-key"
    });
    expect(geminiGenerateContentMock).toHaveBeenCalledWith({
      model: "gemini-test",
      contents: expect.stringContaining(
        'Create 2 beginner flashcards about "TypeScript".'
      ),
      config: expect.objectContaining({
        responseMimeType: "application/json",
        responseJsonSchema: expect.objectContaining({
          type: "object"
        }),
        temperature: 0.4
      })
    });
    expect(deck).toMatchObject({
      topic: "TypeScript",
      difficulty: "beginner",
      cards: [
        {
          id: "card-1",
          question: "What is TypeScript?",
          answer: "A typed superset of JavaScript."
        },
        {
          id: "card-2",
          question: "Why use types?",
          answer: "They catch many mistakes earlier."
        }
      ]
    });
  });

  it("uses the configured server Gemini key when the request has no API key", async () => {
    geminiGenerateContentMock.mockResolvedValue({
      text: JSON.stringify({
        cards: [
          {
            question: "What is TypeScript?",
            answer: "A typed superset of JavaScript."
          },
          {
            question: "Why use types?",
            answer: "They catch many mistakes earlier."
          }
        ]
      })
    });

    const service = new GeminiFlashcardService("server-key", "gemini-test");
    await service.generateFlashcards({
      ...requestBody,
      apiKey: undefined
    });

    expect(googleGenAIConstructorMock).toHaveBeenCalledWith({
      apiKey: "server-key"
    });
  });

  it("requires a Gemini API key", async () => {
    const service = new GeminiFlashcardService(undefined, "gemini-test");

    await expect(
      service.generateFlashcards({
        ...requestBody,
        apiKey: undefined
      })
    ).rejects.toThrow(MissingProviderApiKeyError);
    expect(googleGenAIConstructorMock).not.toHaveBeenCalled();
  });

  it("rejects malformed Gemini output", async () => {
    geminiGenerateContentMock.mockResolvedValue({
      text: JSON.stringify({
        cards: [{ question: "", answer: "Missing question." }]
      })
    });

    const service = new GeminiFlashcardService("server-key", "gemini-test");

    await expect(service.generateFlashcards(requestBody)).rejects.toThrow(
      ProviderGenerationError
    );
  });

  it("wraps Gemini provider failures", async () => {
    geminiGenerateContentMock.mockRejectedValue(new Error("provider failed"));

    const service = new GeminiFlashcardService("server-key", "gemini-test");

    await expect(service.generateFlashcards(requestBody)).rejects.toThrow(
      ProviderGenerationError
    );
  });
});

describe("OpenAIFlashcardService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requestBody: GenerateFlashcardsRequest = {
    topic: "TypeScript",
    difficulty: "beginner",
    count: 2,
    provider: "openai",
    apiKey: "request-key"
  };

  it("calls the Responses API with structured output and maps REST output cards", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  cards: [
                    {
                      question: "What is TypeScript?",
                      answer: "A typed superset of JavaScript."
                    },
                    {
                      question: "Why use types?",
                      answer: "They catch many mistakes earlier."
                    }
                  ]
                })
              }
            ]
          }
        ]
      })
    } as Response);

    const service = new OpenAIFlashcardService("server-key", "gpt-test");
    const deck = await service.generateFlashcards(requestBody);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer request-key"
        })
      })
    );
    expect(deck).toMatchObject({
      topic: "TypeScript",
      difficulty: "beginner",
      cards: [
        {
          id: "card-1",
          question: "What is TypeScript?",
          answer: "A typed superset of JavaScript."
        },
        {
          id: "card-2",
          question: "Why use types?",
          answer: "They catch many mistakes earlier."
        }
      ]
    });
  });

  it("rejects malformed OpenAI output", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          cards: [{ question: "", answer: "Missing question." }]
        })
      })
    } as Response);

    const service = new OpenAIFlashcardService("server-key", "gpt-test");

    await expect(service.generateFlashcards(requestBody)).rejects.toThrow(
      ProviderGenerationError
    );
  });
});
