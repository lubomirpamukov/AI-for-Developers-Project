import { useMemo, useState } from "react";
import type { GenerateFlashcardsRequest, GenerateFlashcardsResponse } from "@quizmaker/shared";
import { generateFlashcards } from "./api/quizmakerApi.js";
import { Deck } from "./components/Deck.js";
import { GenerationForm } from "./components/GenerationForm.js";
import {
  loadPreferences,
  loadStoredDecks,
  savePreferences,
  saveStoredDecks
} from "./storage/quizStorage.js";
import memoryAtelierHero from "./assets/memory-atelier-hero.webp";
import styles from "./App.module.css";

const learningMoments = [
  "Generate",
  "Preview",
  "Quiz",
  "Remember"
] as const;

export function App() {
  const [initialRequest] = useState<GenerateFlashcardsRequest>(() => {
    const preferences = loadPreferences();

    return {
      topic: "",
      difficulty: preferences.lastDifficulty ?? "beginner",
      count: preferences.lastCount ?? 5,
      provider: preferences.lastProvider ?? "gemini"
    };
  });
  const [lastRequest, setLastRequest] = useState<GenerateFlashcardsRequest | null>(null);
  const [deck, setDeck] = useState<GenerateFlashcardsResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const previewTitle = useMemo(() => {
    if (isGenerating && lastRequest) {
      return `${formatProviderName(lastRequest.provider)} is shaping ${lastRequest.count} ${lastRequest.difficulty} cards about ${lastRequest.topic}`;
    }

    if (deck) {
      return `${deck.cards.length} ${deck.difficulty} cards ready about ${deck.topic}`;
    }

    if (generationError) {
      return "Deck request needs another try";
    }

    if (!lastRequest) {
      return "No deck requested yet";
    }

    return `${formatProviderName(lastRequest.provider)} will shape ${lastRequest.count} ${lastRequest.difficulty} cards about ${lastRequest.topic}`;
  }, [deck, generationError, isGenerating, lastRequest]);

  async function handleGenerate(request: GenerateFlashcardsRequest) {
    setLastRequest(request);
    setGenerationError(null);
    setIsGenerating(true);
    savePreferences({
      lastDifficulty: request.difficulty,
      lastCount: request.count,
      lastProvider: request.provider
    });

    try {
      const generatedDeck = await generateFlashcards(request);
      setDeck(generatedDeck);
      saveStoredDecks([
        {
          ...generatedDeck,
          createdAt: new Date().toISOString()
        },
        ...loadStoredDecks()
      ]);
    } catch (error) {
      setDeck(null);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "We could not generate flashcards right now."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero} aria-labelledby="page-title">
        <div className={styles.copyColumn}>
          <p className={styles.eyebrow}>QuizMaker</p>
          <h1 id="page-title">Shape memory into a deck worth revisiting.</h1>
          <p className={styles.intro}>
            Generate focused flashcards, move through the quiz, and keep the learning trace close.
          </p>

          <div className={styles.formStage}>
            <GenerationForm
              initialValue={initialRequest}
              isSubmitting={isGenerating}
              onSubmit={handleGenerate}
            />
          </div>
        </div>

        <aside className={styles.visualColumn} aria-label="Deck preview atmosphere">
          <img
            className={styles.heroImage}
            src={memoryAtelierHero}
            alt="Abstract layered flashcards with graphite marks and memory trace lines"
          />
          <div className={styles.orbitPanel}>
            <span className={styles.panelKicker}>Current trace</span>
            <strong>{previewTitle}</strong>
          </div>
        </aside>
      </section>

      <section className={styles.deckStage} aria-live="polite" aria-busy={isGenerating}>
        {generationError ? (
          <p className={styles.errorNotice} role="alert">
            {generationError}
          </p>
        ) : null}

        {deck ? (
          <Deck deck={deck} provider={lastRequest?.provider ?? "gemini"} />
        ) : null}
      </section>

      <section className={styles.moments} aria-label="Learning flow">
        {learningMoments.map((moment, index) => (
          <div className={styles.moment} key={moment}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{moment}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}

function formatProviderName(provider: GenerateFlashcardsRequest["provider"]) {
  return provider === "openai" ? "OpenAI" : "Gemini";
}
