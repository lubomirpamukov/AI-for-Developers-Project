import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { flashcardRouter } from "./routes/flashcardRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", healthRouter);
  app.use("/api", flashcardRouter);

  app.use(errorHandler);

  return app;
}
