import { useId, useState } from "react";
import type { GenerateFlashcardsRequest } from "@quizmaker/shared";
import { DIFFICULTIES } from "@quizmaker/shared";
import { validateGenerationInput } from "../validation/generationInput.js";
import styles from "./GenerationForm.module.css";

interface GenerationFormProps {
  initialValue: GenerateFlashcardsRequest;
  onSubmit: (request: GenerateFlashcardsRequest) => void;
}

export function GenerationForm({ initialValue, onSubmit }: GenerationFormProps) {
  const topicId = useId();
  const difficultyId = useId();
  const countId = useId();
  const apiKeyId = useId();
  const [topic, setTopic] = useState(initialValue.topic);
  const [difficulty, setDifficulty] = useState(initialValue.difficulty);
  const [count, setCount] = useState(String(initialValue.count));
  const [apiKey, setApiKey] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateGenerationInput({
      topic,
      difficulty,
      count,
      apiKey
    });

    if (!validation.ok) {
      setFields(validation.fields);
      return;
    }

    setFields({});
    onSubmit(validation.value);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor={topicId}>Topic</label>
        <input
          id={topicId}
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          aria-invalid={Boolean(fields.topic)}
          aria-describedby={fields.topic ? `${topicId}-error` : undefined}
        />
        {fields.topic ? <p id={`${topicId}-error`}>{fields.topic}</p> : null}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={difficultyId}>Difficulty</label>
          <select
            id={difficultyId}
            name="difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as GenerateFlashcardsRequest["difficulty"])
            }
          >
            {DIFFICULTIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={countId}>Cards</label>
          <input
            id={countId}
            name="count"
            inputMode="numeric"
            value={count}
            onChange={(event) => setCount(event.target.value)}
            aria-invalid={Boolean(fields.count)}
            aria-describedby={fields.count ? `${countId}-error` : undefined}
          />
          {fields.count ? <p id={`${countId}-error`}>{fields.count}</p> : null}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={apiKeyId}>One-request API key</label>
        <input
          id={apiKeyId}
          name="apiKey"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>

      <button type="submit">Prepare deck request</button>
    </form>
  );
}
