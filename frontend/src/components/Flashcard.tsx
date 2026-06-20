import { useId, useState } from "react";
import type { Flashcard as FlashcardModel } from "@quizmaker/shared";
import styles from "./Flashcard.module.css";

interface FlashcardProps {
  card: FlashcardModel;
  index: number;
  onOpen?: () => void;
  variant?: "preview" | "reader";
}

export function Flashcard({ card, index, onOpen, variant = "preview" }: FlashcardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const questionId = useId();
  const answerId = useId();
  const cardNumber = index + 1;
  const isReader = variant === "reader";
  const activeLabel = isReader
    ? isAnswerVisible
      ? card.answer
      : card.question
    : `Open card ${cardNumber}: ${card.question}`;

  function handleClick() {
    if (!isReader) {
      onOpen?.();
      return;
    }

    setIsAnswerVisible((currentValue) => !currentValue);
  }

  return (
    <button
      aria-label={activeLabel}
      aria-pressed={isReader ? isAnswerVisible : undefined}
      className={`${styles.card} ${styles[variant]} ${isAnswerVisible ? styles.isFlipped : ""}`}
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden={isAnswerVisible} className={`${styles.face} ${styles.frontFace}`}>
        <span className={styles.cardHeader}>
          <span className={styles.cardNumber}>{String(cardNumber).padStart(2, "0")}</span>
          <span className={styles.sideLabel}>Question</span>
        </span>
        <span className={styles.cardBody} id={questionId}>
          {card.question}
        </span>
        <span className={styles.cardHint}>Tap to reveal the answer</span>
      </span>

      <span aria-hidden={!isAnswerVisible} className={`${styles.face} ${styles.backFace}`}>
        <span className={styles.cardHeader}>
          <span className={styles.cardNumber}>{String(cardNumber).padStart(2, "0")}</span>
          <span className={styles.sideLabel}>Answer</span>
        </span>
        <span className={styles.cardBody} id={answerId}>
          {card.answer}
        </span>
        <span className={styles.cardHint}>Tap to return to the question</span>
      </span>
    </button>
  );
}
