import { useMemo, useState } from "react";
import type { Difficulty, GenerateFlashcardsRequest } from "@quizmaker/shared";
import { GenerationForm } from "./components/GenerationForm.js";
import styles from "./App.module.css";

const initialRequest: GenerateFlashcardsRequest = {
  topic: "",
  difficulty: "beginner",
  count: 5
};

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
      <section className={styles.workspace} aria-labelledby="page-title">
        <div className={styles.header}>
          <p className={styles.eyebrow}>QuizMaker</p>
          <h1 id="page-title">Generate a focused flashcard deck</h1>
        </div>

        <GenerationForm initialValue={initialRequest} onSubmit={handleGenerate} />

        <section className={styles.preview} aria-labelledby="preview-title">
          <h2 id="preview-title">Deck preview scaffold</h2>
          <p>{previewTitle}</p>
        </section>
      </section>
    </main>
  );
}

export const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];
