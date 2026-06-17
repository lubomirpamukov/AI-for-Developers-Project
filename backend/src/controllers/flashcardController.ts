import type { Request, Response } from "express";
import type { ApiErrorResponse } from "@quizmaker/shared";
import { validateGenerateFlashcardsRequest } from "../validation/generateFlashcards.js";

export function generateFlashcards(req: Request, res: Response<ApiErrorResponse>) {
  const validation = validateGenerateFlashcardsRequest(req.body);

  if (!validation.ok) {
    return res.status(400).json({
      error: "Please fix the highlighted fields.",
      code: "VALIDATION_ERROR",
      fields: validation.fields
    });
  }

  return res.status(501).json({
    error: "Flashcard generation is not implemented yet.",
    code: "GENERATION_FAILED"
  });
}
