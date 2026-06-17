import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("QuizMaker API scaffold", () => {
  const app = createApp();

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
      count: "Count must be a whole number."
    });
  });

  it("rejects topics longer than 120 characters", async () => {
    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({
        topic: "a".repeat(121),
        difficulty: "beginner",
        count: 5
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
        count: 21
      });

    expect(response.status).toBe(400);
    expect(response.body.fields).toEqual({
      count: "Count must be between 1 and 20."
    });
  });

  it("returns a safe placeholder response for valid generation requests", async () => {
    const response = await request(app)
      .post("/api/generate-flashcards")
      .send({
        topic: "TypeScript",
        difficulty: "beginner",
        count: 5,
        apiKey: "test-only-key"
      });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      error: "Flashcard generation is not implemented yet.",
      code: "GENERATION_FAILED"
    });
    expect(JSON.stringify(response.body)).not.toContain("test-only-key");
  });
});
