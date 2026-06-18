import cors from "cors";
import express from "express";
import { getEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createFlashcardRouter } from "./routes/flashcardRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";
import {
  ProviderFlashcardService,
  type FlashcardGenerator
} from "./services/flashcardProviderService.js";

interface CreateAppOptions {
  flashcardGenerator?: FlashcardGenerator;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const flashcardGenerator =
    options.flashcardGenerator ?? new ProviderFlashcardService(getEnv());

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", healthRouter);
  app.use("/api", createFlashcardRouter(flashcardGenerator));

  app.use(errorHandler);

  return app;
}
