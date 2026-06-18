import type { Request, Response } from "express";
import type { ApiErrorResponse, GenerateFlashcardsResponse } from "@quizmaker/shared";
import type { FlashcardGenerator } from "../services/flashcardProviderService.js";
import {
  MissingProviderApiKeyError,
  ProviderGenerationError
} from "../services/flashcardProviderService.js";
import { validateGenerateFlashcardsRequest } from "../validation/generateFlashcards.js";

export function createGenerateFlashcardsController(generator: FlashcardGenerator) {
  return async function generateFlashcards(
    req: Request,
    res: Response<ApiErrorResponse | GenerateFlashcardsResponse>
  ) {
    const validation = validateGenerateFlashcardsRequest(req.body);

    if (!validation.ok) {
      return res.status(400).json({
        error: "Please fix the highlighted fields.",
        code: "VALIDATION_ERROR",
        fields: validation.fields
      });
    }

    try {
      const deck = await generator.generateFlashcards(validation.value);
      return res.status(200).json(deck);
    } catch (error) {
      if (error instanceof MissingProviderApiKeyError) {
        return res.status(400).json({
          error: "Add an API key for the selected provider or configure one on the server.",
          code: "MISSING_API_KEY"
        });
      }

      if (error instanceof ProviderGenerationError) {
        return res.status(502).json({
          error: "We could not generate flashcards right now. Please try again.",
          code: "GENERATION_FAILED"
        });
      }

      return res.status(500).json({
        error: "Something went wrong.",
        code: "GENERATION_FAILED"
      });
    }
  };
}
