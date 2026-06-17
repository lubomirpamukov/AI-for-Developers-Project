import type { ErrorRequestHandler } from "express";
import type { ApiErrorResponse } from "@quizmaker/shared";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err instanceof Error ? err.message : "Unknown server error");

  const response: ApiErrorResponse = {
    error: "Something went wrong.",
    code: "GENERATION_FAILED"
  };

  res.status(500).json(response);
};
