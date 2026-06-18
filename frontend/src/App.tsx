import { useMemo, useState } from "react";
import type { GenerateFlashcardsRequest } from "@quizmaker/shared";
import { GenerationForm } from "./components/GenerationForm.js";
import memoryAtelierHero from "./assets/memory-atelier-hero.webp";
import styles from "./App.module.css";

const initialRequest: GenerateFlashcardsRequest = {
  topic: "",
  difficulty: "beginner",
  count: 5
};

const learningMoments = [
  "Generate",
  "Preview",
  "Quiz",
  "Remember"
] as const;

export function App() {
  const [lastRequest, setLastRequest] = useState<GenerateFlashcardsRequest | null>(null);

  const previewTitle = useMemo(() => {
    if (!lastRequest) {
      return "No deck requested yet";
    }

    return `${lastRequest.count} ${lastRequest.difficulty} cards about ${lastRequest.topic}`;
  }, [lastRequest]);

  function handleGenerate(request: GenerateFlashcardsRequest) {
    setLastRequest(request);
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
            <GenerationForm initialValue={initialRequest} onSubmit={handleGenerate} />
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
