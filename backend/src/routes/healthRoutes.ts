import { Router } from "express";
import type { HealthResponse } from "@quizmaker/shared";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString()
  };

  res.json(response);
});
