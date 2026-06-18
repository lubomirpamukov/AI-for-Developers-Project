import { Router } from "express";
import { createGenerateFlashcardsController } from "../controllers/flashcardController.js";
import type { FlashcardGenerator } from "../services/flashcardProviderService.js";

export function createFlashcardRouter(generator: FlashcardGenerator) {
  const flashcardRouter = Router();

  flashcardRouter.post(
    "/generate-flashcards",
    createGenerateFlashcardsController(generator)
  );

  return flashcardRouter;
}
