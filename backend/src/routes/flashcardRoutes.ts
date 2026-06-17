import { Router } from "express";
import { generateFlashcards } from "../controllers/flashcardController.js";

export const flashcardRouter = Router();

flashcardRouter.post("/generate-flashcards", generateFlashcards);
