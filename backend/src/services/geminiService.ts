import type {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse
} from "@quizmaker/shared";

export interface FlashcardGenerator {
  generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse>;
}

export class GeminiFlashcardService implements FlashcardGenerator {
  async generateFlashcards(
    _request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    throw new Error("Gemini flashcard generation is not implemented yet.");
  }
}
