import type {
  ApiErrorResponse,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  HealthResponse
} from "@quizmaker/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/health`);
  return parseJsonResponse<HealthResponse>(response);
}

export async function generateFlashcards(
  request: GenerateFlashcardsRequest
): Promise<GenerateFlashcardsResponse> {
  const response = await fetch(`${apiBaseUrl}/api/generate-flashcards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return parseJsonResponse<GenerateFlashcardsResponse>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse;
    throw new Error(errorBody.error);
  }

  return body as T;
}
