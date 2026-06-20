import { useMemo, useState } from "react";
import type {
  ApiProvider,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse
} from "@quizmaker/shared";
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

interface SessionDeck {
  deck: GenerateFlashcardsResponse;
  provider: ApiProvider;
}

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
  const [sessionDecks, setSessionDecks] = useState<SessionDeck[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const previewTitle = useMemo(() => {
    if (isGenerating && lastRequest) {
      return `${formatProviderName(lastRequest.provider)} is shaping ${lastRequest.count} ${lastRequest.difficulty} cards about ${lastRequest.topic}`;
    }

    const latestEntry = sessionDecks[sessionDecks.length - 1];

    if (latestEntry) {
      const deckCountLabel = sessionDecks.length === 1 ? "deck" : "decks";
      return `${sessionDecks.length} ${deckCountLabel} in this session. Latest: ${latestEntry.deck.cards.length} ${latestEntry.deck.difficulty} cards about ${latestEntry.deck.topic}`;
    }

    if (generationError) {
      return "Deck request needs another try";
    }

    if (!lastRequest) {
      return "No deck requested yet";
    }

    return `${formatProviderName(lastRequest.provider)} will shape ${lastRequest.count} ${lastRequest.difficulty} cards about ${lastRequest.topic}`;
  }, [generationError, isGenerating, lastRequest, sessionDecks]);

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
      setSessionDecks((currentDecks) => [
        ...currentDecks,
        {
          deck: generatedDeck,
          provider: request.provider
        }
      ]);
      saveStoredDecks([
        {
          ...generatedDeck,
          createdAt: new Date().toISOString()
        },
        ...loadStoredDecks()
      ]);
    } catch (error) {
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
    <div className={styles.shell}>
      <header className={styles.siteHeader}>
        <p className={`${styles.eyebrow} ${styles.siteBrand}`}>QuizMaker</p>
        <ol className={styles.headerFlow} aria-label="Learning flow">
          {learningMoments.map((moment) => (
            <li className={styles.headerFlowItem} key={moment}>
              <span className={styles.flowLabel}>{moment}</span>
            </li>
          ))}
        </ol>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="page-title">
          <div className={styles.copyColumn}>
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
          {isGenerating ? (
            <p className={styles.statusNotice}>
              {lastRequest
                ? `${formatProviderName(lastRequest.provider)} is preparing the next deck.`
                : "Preparing the next deck."}
            </p>
          ) : null}

          {generationError ? (
            <p className={styles.errorNotice} role="alert">
              {generationError}
            </p>
          ) : null}

          {sessionDecks.length > 0 ? (
            <div
              aria-label="Generated decks in this session"
              className={styles.deckRail}
              role="list"
            >
              {sessionDecks.map((entry) => (
                <div className={styles.deckRailItem} key={entry.deck.deckId} role="listitem">
                  <Deck deck={entry.deck} provider={entry.provider} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNotice}>The session deck rail is waiting.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function formatProviderName(provider: GenerateFlashcardsRequest["provider"]) {
  return provider === "openai" ? "OpenAI" : "Gemini";
}
